import type { EngineLog, EngineOutput, DetailCalculScenario } from "@wymby/types";
import { FISCAL_PARAMS_2026 } from "@wymby/config";
import { FiabiliteBar } from "../components/FiabiliteBar.js";
import { AlertBanner } from "../components/AlertBanner.js";
import { DebugPanel } from "../components/DebugPanel.js";
import { CollapsibleSection } from "../components/CollapsibleSection.js";
import { EmptyState } from "../components/EmptyState.js";
import { ScenarioCard } from "./ScenarioCard.js";
import { ComparaisonTable } from "./ComparaisonTable.js";
import { PdfExportButton } from "./PdfExportButton.js";
import { getScenarioLabel } from "../data/scenario-labels.js";
import { MicroSeuilProximite } from "../components/MicroSeuilProximite.js";
import { resolveDisplayMessage } from "../data/avertissement-messages.js";
import {
  groupSimilarScenarios,
  isRelevantForProfile,
} from "../data/scenario-relevance.js";
import "./ResultsPage.css";

interface Props {
  output: EngineOutput;
  debugLogs?: EngineLog[];
  onRestart: () => void;
}

type BannerMessage = {
  message: string;
  level: "info" | "warning";
};

type ScenarioFamily =
  | "generaliste_bic"
  | "generaliste_bnc"
  | "societe"
  | "sante"
  | "artiste"
  | "immobilier"
  | "autre";

function dedupeMessages(messages: BannerMessage[]): BannerMessage[] {
  return messages.filter(
    (message, index, array) =>
      array.findIndex(
        (candidate) =>
          candidate.message === message.message && candidate.level === message.level
      ) === index
  );
}

function getFiabiliteDescription(output: EngineOutput): string {
  const missing: string[] = [];

  if (output.inputs_normalises.foyer.autres_revenus === undefined) {
    missing.push("les autres revenus du foyer");
  }
  if (output.inputs_normalises.foyer.rfr_n2 === undefined) {
    missing.push("le RFR N-2");
  }
  if (output.qualification.flags.FLAG_DONNEES_A_COMPLETER) {
    missing.push("certaines donnees complementaires");
  }

  if (missing.length === 0) {
    if (output.qualite_resultat.niveau_fiabilite === "estimation") {
      return "Le calcul reste estimatif sur certains regimes specifiques, meme avec un foyer renseigne.";
    }
    if (output.qualite_resultat.niveau_fiabilite === "partiel") {
      return "Le calcul est partiel sur certains points reglementaires a confirmer.";
    }
    return "Toutes les donnees necessaires sont disponibles.";
  }

  const intro =
    output.qualite_resultat.niveau_fiabilite === "partiel"
      ? "Certaines donnees restent a confirmer"
      : "L'estimation repose encore sur";

  return `${intro} : ${missing.join(", ")}.`;
}

function getAidIneligibilityMessages(output: EngineOutput): string[] {
  const flags = output.qualification.flags;
  const messages: string[] = [];
  const hasMicroScenario =
    output.calculs_par_scenario.some(
      (scenario) => scenario.base_id.includes("MICRO") || scenario.base_id.includes("MB")
    ) ||
    output.scenarios_exclus.some(
      (scenario) => scenario.base_id.includes("MICRO") || scenario.base_id.includes("MB")
    );
  const input = output.inputs_normalises;

  if (hasMicroScenario && flags.FLAG_VFL_INTERDIT && input.foyer.rfr_n2 !== undefined) {
    messages.push("Versement Liberatoire ineligible : le RFR N-2 depasse le seuil autorise.");
  }

  if (!flags.FLAG_ACRE_POSSIBLE && output.inputs_normalises.profil.segment !== "immobilier") {
    messages.push("ACRE non retenue : reservee aux creations ou reprises dans la periode d'eligibilite.");
  }

  if (output.qualification.segment_retenu === "sante" && !flags.FLAG_AIDE_CPAM_POSSIBLE) {
    messages.push("Aide CPAM non applicable : votre secteur conventionnel ne permet pas cette prise en charge.");
  }

  return messages;
}

function buildRecommendationExplanation(output: EngineOutput): string | null {
  const recommendedId = output.recommandation?.scenario_recommande_id;
  const optimalId = output.comparaison.classement_net_apres_ir[0];

  if (!recommendedId || !optimalId || recommendedId === optimalId) return null;

  const recommendedScenario = output.calculs_par_scenario.find(
    (scenario) => scenario.scenario_id === recommendedId
  );
  const optimalScenario = output.calculs_par_scenario.find(
    (scenario) => scenario.scenario_id === optimalId
  );

  if (!recommendedScenario || !optimalScenario) return null;

  const delta =
    (optimalScenario.intermediaires.NET_APRES_IR ?? 0) -
    (recommendedScenario.intermediaires.NET_APRES_IR ?? 0);

  if (delta <= 0) return null;

  const optimalLabel = getScenarioLabel(optimalScenario.base_id).titre;
  const optimalComplexity = optimalScenario.scores.SCORE_COMPLEXITE_ADMIN;
  const recommendedComplexity = recommendedScenario.scores.SCORE_COMPLEXITE_ADMIN;
  const complexityGap = optimalComplexity - recommendedComplexity;

  if (complexityGap > 0) {
    return `${optimalLabel} donne environ +${new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(delta)} EUR/an, mais avec plus de complexite administrative ou plus de contraintes. Le recommande privilegie un meilleur equilibre global.`;
  }

  return `${optimalLabel} donne environ +${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(delta)} EUR/an, mais le scenario recommande reste plus robuste selon vos parametres et les aides mobilisees.`;
}

function getScenarioFamily(baseId: string): ScenarioFamily {
  if (baseId.startsWith("S_")) return "sante";
  if (baseId.startsWith("A_")) return "artiste";
  if (baseId.startsWith("I_")) return "immobilier";
  if (
    baseId === "G_EURL_IS" ||
    baseId === "G_EURL_IR" ||
    baseId === "G_SASU_IS" ||
    baseId === "G_SASU_IR" ||
    baseId === "S_SELARL_IS" ||
    baseId === "S_SELAS_IS"
  ) {
    return "societe";
  }
  if (baseId.includes("_BNC")) return "generaliste_bnc";
  if (baseId.includes("_BIC") || baseId.includes("_MBIC")) return "generaliste_bic";
  return "autre";
}

function shouldDisplayWithReference(
  referenceBaseId: string | undefined,
  candidateBaseId: string
): boolean {
  if (!referenceBaseId) return true;

  const referenceFamily = getScenarioFamily(referenceBaseId);
  const candidateFamily = getScenarioFamily(candidateBaseId);

  if (referenceFamily === "generaliste_bic") {
    return candidateFamily === "generaliste_bic" || candidateFamily === "societe";
  }

  if (referenceFamily === "generaliste_bnc") {
    return candidateFamily === "generaliste_bnc" || candidateFamily === "societe";
  }

  if (referenceFamily === "societe") {
    return candidateFamily === "societe";
  }

  return candidateFamily === referenceFamily;
}

function getUniqueScenariosByBaseId(sortedScenarios: DetailCalculScenario[]) {
  return sortedScenarios.filter(
    (scenario, index, array) =>
      array.findIndex((candidate) => candidate.base_id === scenario.base_id) === index
  );
}

function isStructureIS(baseId: string): boolean {
  return (
    baseId === "G_EURL_IS" ||
    baseId === "G_SASU_IS" ||
    baseId === "S_SELARL_IS" ||
    baseId === "S_SELAS_IS"
  );
}

export function ResultsPage({ output, debugLogs, onRestart }: Props) {
  const { calculs_par_scenario, comparaison, recommandation, qualite_resultat } = output;
  const sortedScenarios = comparaison.classement_net_apres_ir
    .map((id) => calculs_par_scenario.find((scenario) => scenario.scenario_id === id))
    .filter((scenario): scenario is DetailCalculScenario => Boolean(scenario));

  const referenceScenario =
    calculs_par_scenario.find((scenario) => scenario.scenario_id === comparaison.scenario_reference_id) ??
    sortedScenarios[0] ??
    null;

  const referenceNet = referenceScenario?.intermediaires.NET_APRES_IR ?? 0;
  const filteredByFamily = sortedScenarios.filter((scenario) =>
    shouldDisplayWithReference(referenceScenario?.base_id, scenario.base_id)
  );
  const uniqueScenarios = getUniqueScenariosByBaseId(filteredByFamily);
  const relevanceContext = {
    ca: output.inputs_normalises.activite.CA_HT_RETENU,
    interet_societe_explicite: output.inputs_normalises.profil.interet_societe ?? false,
    question_societe_renseignee:
      output.inputs_normalises.profil.question_societe_renseignee ?? false,
    reference_net: referenceNet,
  };
  const relevantScenarios = uniqueScenarios.filter((scenario) =>
    isRelevantForProfile(scenario, relevanceContext)
  );
  const lessRelevantScenarios = uniqueScenarios.filter(
    (scenario) => !isRelevantForProfile(scenario, relevanceContext)
  );
  const groupedScenarios = groupSimilarScenarios(relevantScenarios);
  const podiumScenarioGroups = groupedScenarios.slice(0, 3);
  const nextScenarioGroups = groupedScenarios.slice(3, 8);
  const nextScenarios = nextScenarioGroups.map((group) => group.primary);
  const displayScenarioCount = groupedScenarios.length;
  const podiumScenarioIds = podiumScenarioGroups.map((group) => group.primary.scenario_id);
  const allScenarioWarnings = new Set(
    calculs_par_scenario.flatMap((scenario) => scenario.avertissements_scenario)
  );
  const topScenarioWarnings = podiumScenarioGroups.flatMap(
    (group) => group.primary.avertissements_scenario
  );
  const relevantWarnings = dedupeMessages(
    [
      ...qualite_resultat.avertissements.filter((warning) => !allScenarioWarnings.has(warning)),
      ...topScenarioWarnings,
    ]
      .map(resolveDisplayMessage)
      .filter((message): message is NonNullable<typeof message> => message !== null)
  );

  const recommendedId = recommandation?.scenario_recommande_id ?? null;
  const optimalId = comparaison.classement_net_apres_ir[0] ?? null;
  const referenceId = comparaison.scenario_reference_id;
  const recommendationExplanation = buildRecommendationExplanation(output);
  const infoMessages = relevantWarnings.filter((message) => message.level === "info");
  const alertMessages = relevantWarnings.filter((message) => message.level === "warning");
  const ineligibleAidMessages = getAidIneligibilityMessages(output);
  const contextMessages = dedupeMessages([
    ...infoMessages,
    ...ineligibleAidMessages.map((message) => ({ message, level: "info" as const })),
  ]);

  const isDebug =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("debug");
  const hasIrEstimation = calculs_par_scenario.some(
    (scenario) =>
      scenario.niveau_fiabilite === "estimation" && scenario.option_vfl !== "VFL_OUI"
  );
  const objectifTresorerie = output.inputs_normalises.profil.objectif_tresorerie ?? null;
  const recommendedScenario = calculs_par_scenario.find(
    (scenario) => scenario.scenario_id === recommendedId
  );
  const podiumContainsISStructure = podiumScenarioGroups.some((group) =>
    isStructureIS(group.primary.base_id)
  );

  const paramsBannerMessage = `Simulation basee sur les parametres fiscaux 2026 (PASS : ${new Intl.NumberFormat(
    "fr-FR"
  ).format(FISCAL_PARAMS_2026.referentiels.CFG_PASS_2026)} EUR, derniere mise a jour : mars 2026). Si votre situation a change depuis, relancez une simulation.`;

  if (calculs_par_scenario.length === 0) {
    return (
      <div className="results-page">
        <div className="results-hero">
          <div className="container">
            <h1>Votre simulation fiscale 2026</h1>
            <AlertBanner level="info" primaryMessage={paramsBannerMessage} dismissible={true} />
            <FiabiliteBar
              niveau={qualite_resultat.niveau_fiabilite}
              score={qualite_resultat.score_fiabilite}
              description={getFiabiliteDescription(output)}
            />
          </div>
        </div>

        <div className="container results-body">
          <EmptyState
            title="Aucun scenario calcule"
            description={`Aucun regime fiscal applicable n'a pu etre determine pour votre profil.${
              output.scenarios_exclus.length > 0
                ? ` ${output.scenarios_exclus.length} scenario(s) ont ete exclus.`
                : ""
            } Modifiez vos parametres ou consultez un expert-comptable.`}
            action={{ label: "Recommencer la simulation", onClick: onRestart }}
          />
        </div>

        <footer className="results-legal-footer">
          <div className="container">
            Ces resultats sont des estimations etablies a partir des parametres fiscaux
            2026 en vigueur. Pour un conseil personnalise adapte a votre situation, votre
            expert-comptable reste votre reference.
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="results-page">
      <div className="results-hero">
        <div className="container">
          <div className="results-hero-head">
            <div>
              <h1>Votre simulation fiscale 2026</h1>
            </div>
            <div className="results-hero-actions">
              <PdfExportButton output={output} />
            </div>
          </div>

          <AlertBanner level="info" primaryMessage={paramsBannerMessage} dismissible={true} />
          <FiabiliteBar
            niveau={qualite_resultat.niveau_fiabilite}
            score={qualite_resultat.score_fiabilite}
            description={getFiabiliteDescription(output)}
          />

          <section className="results-topfold">
            <div className="results-topfold-head">
              <h2>Regimes compatibles</h2>
              <p className="section-sub">
                {displayScenarioCount} scenario{displayScenarioCount > 1 ? "s" : ""} affiche
                {displayScenarioCount > 1 ? "s" : ""} pour votre profil.
              </p>
            </div>
            <div className="results-podium results-podium-top">
              {podiumScenarioGroups.map((group, index) => {
                const scenario = group.primary;
                const badges: Array<"reference" | "recommande" | "optimal"> = [];

                if (scenario.scenario_id === referenceId) badges.push("reference");
                if (scenario.scenario_id === recommendedId) badges.push("recommande");
                if (scenario.scenario_id === optimalId) badges.push("optimal");

                return (
                  <ScenarioCard
                    key={scenario.scenario_id}
                    scenario={scenario}
                    referenceBaseId={referenceScenario?.base_id}
                    badges={badges}
                    rank={index + 1}
                    groupedCount={group.groupedCount}
                    ecartAnnuel={
                      comparaison.ecarts.find((entry) => entry.scenario_id === scenario.scenario_id)
                        ?.DELTA_NET_APRES_IR
                    }
                  />
                );
              })}
            </div>

            {recommendationExplanation && (
              <div className="results-explanation-card">
                <span className="results-explanation-kicker">Pourquoi pas juste le plus gros net ?</span>
                <p>{recommendationExplanation}</p>
              </div>
            )}

            {objectifTresorerie === "capitalisation" &&
              recommendedScenario !== undefined &&
              isStructureIS(recommendedScenario.base_id) && (
                <div className="results-context-card">
                  Ce scenario implique de ne pas vous remunerer mensuellement pendant la phase
                  d'accumulation. Les dividendes sont distribuables apres l'assemblee generale
                  annuelle, soit une fois par an au minimum.
                </div>
              )}

            {objectifTresorerie === "flux_mensuel" && podiumContainsISStructure && (
              <div className="results-context-card results-context-card-muted">
                Ce regime peut etre adapte a votre objectif si vous vous versez un salaire
                mensuel regulier, mais la complexite administrative reste plus elevee qu'un
                regime EI.
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="container results-body">
        <MicroSeuilProximite output={output} scenarioIds={podiumScenarioIds} />

        {nextScenarios.length > 0 && (
          <section className="results-section">
            <h2>Scenarios suivants</h2>
            <p className="section-sub">
              {nextScenarios.length} regime{nextScenarios.length > 1 ? "s" : ""} supplementaire
              {nextScenarios.length > 1 ? "s" : ""} pour comparaison.
            </p>
            <ComparaisonTable
              calculs={nextScenarios}
              comparaison={{
                ...comparaison,
                classement_net_apres_ir: nextScenarios.map((scenario) => scenario.scenario_id),
              }}
              recommandeId={recommendedId}
              optimalId={optimalId}
              limit={nextScenarios.length}
            />
            {hasIrEstimation && (
              <p className="section-sub">
                * Estimation IR - donnees foyer incompletes ou calcul PAMC progressif
              </p>
            )}
          </section>
        )}

        {lessRelevantScenarios.length > 0 && (
          <section className="results-section">
            <CollapsibleSection
              summary={`Voir aussi ${lessRelevantScenarios.length} regime${
                lessRelevantScenarios.length > 1 ? "s" : ""
              } moins adapte${lessRelevantScenarios.length > 1 ? "s" : ""} a votre profil`}
              badge={lessRelevantScenarios.length}
            >
              <div className="results-less-relevant">
                {lessRelevantScenarios.map((scenario) => (
                  <ScenarioCard
                    key={scenario.scenario_id}
                    scenario={scenario}
                    referenceBaseId={referenceScenario?.base_id}
                    ecartAnnuel={
                      comparaison.ecarts.find((entry) => entry.scenario_id === scenario.scenario_id)
                        ?.DELTA_NET_APRES_IR
                    }
                  />
                ))}
              </div>
            </CollapsibleSection>
          </section>
        )}

        {contextMessages.length > 0 && (
          <section className="results-section">
            <h2>Points a noter</h2>
            <div className="results-message-stack">
              {contextMessages.map((message, index) => (
                <AlertBanner
                  key={`${message.message}-${index}`}
                  level="info"
                  primaryMessage={message.message}
                />
              ))}
            </div>
          </section>
        )}

        {alertMessages.length > 0 && (
          <section className="results-section">
            <h2>Alertes</h2>
            <div className="results-message-stack">
              {alertMessages.map((message, index) => (
                <AlertBanner
                  key={`${message.message}-${index}`}
                  level="warning"
                  primaryMessage={message.message}
                />
              ))}
            </div>
          </section>
        )}

        {output.scenarios_exclus.length > 0 && (
          <section className="results-section results-exclus">
            <CollapsibleSection
              summary={`${output.scenarios_exclus.length} regime${
                output.scenarios_exclus.length > 1 ? "s" : ""
              } ecarte${output.scenarios_exclus.length > 1 ? "s" : ""}`}
              badge={output.scenarios_exclus.length}
            >
              <div className="exclus-list">
                {output.scenarios_exclus.slice(0, 10).map((excluded, index) => (
                  <div key={`${excluded.scenario_id}-${index}`} className="exclus-item">
                    <span className="exclus-label">
                      {getScenarioLabel(excluded.scenario_id).titre}
                    </span>
                    <span className="exclus-motif">
                      {(excluded as { motif?: string }).motif ??
                        excluded.motifs_exclusion.join(" - ")}
                    </span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          </section>
        )}

        <div className="results-footer">
          <button className="btn btn-secondary" onClick={onRestart}>
            Recommencer une simulation
          </button>
        </div>

        {isDebug && debugLogs !== undefined && (
          <DebugPanel inputs={output.inputs_normalises} logs={debugLogs} />
        )}
      </div>

      <footer className="results-legal-footer">
        <div className="container">
          Ces resultats sont des estimations etablies a partir des parametres fiscaux 2026
          en vigueur. Pour un conseil personnalise adapte a votre situation, votre
          expert-comptable reste votre reference.
        </div>
      </footer>
    </div>
  );
}
