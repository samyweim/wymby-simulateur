import { useState } from "react";
import type { EngineLog, EngineOutput } from "@wymby/types";
import { FiabiliteBar } from "../components/FiabiliteBar.js";
import { AvertissementBanner } from "../components/AvertissementBanner.js";
import { DebugPanel } from "../components/DebugPanel.js";
import { CollapsibleSection } from "../components/CollapsibleSection.js";
import { EmptyState } from "../components/EmptyState.js";
import { ScenarioCard } from "./ScenarioCard.js";
import { ComparaisonTable } from "./ComparaisonTable.js";
import { getScenarioLabel } from "../data/scenario-labels.js";
import "./ResultsPage.css";

interface Props {
  output: EngineOutput;
  debugLogs?: EngineLog[];
  onRestart: () => void;
}

export function ResultsPage({ output, debugLogs, onRestart }: Props) {
  const [showMotif, setShowMotif] = useState(false);
  const { calculs_par_scenario, comparaison, recommandation, qualite_resultat } = output;
  const isDebug =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("debug");

  const recommandeId = recommandation?.scenario_recommande_id ?? null;
  const referenceId = comparaison.scenario_reference_id;
  const recommendationMeta = (recommandation ?? null) as
    | (typeof recommandation & {
        conditions_applicables?: string[];
        points_de_vigilance?: string[];
      })
    | null;
  const conditionsApplicables =
    recommendationMeta?.conditions_applicables ??
    recommendationMeta?.points_de_vigilance ??
    [];

  const scReference = calculs_par_scenario.find((c) => c.scenario_id === referenceId);
  const scRecommande = recommandeId
    ? calculs_par_scenario.find((c) => c.scenario_id === recommandeId)
    : null;

  const ecartRecommande = recommandeId
    ? comparaison.ecarts.find((e) => e.scenario_id === recommandeId)?.DELTA_NET_APRES_IR
    : undefined;

  if (calculs_par_scenario.length === 0) {
    return (
      <div className="results-page">
        <div className="results-hero">
          <div className="container">
            <h1>Votre simulation fiscale 2026</h1>
            <FiabiliteBar
              niveau={qualite_resultat.niveau_fiabilite}
              score={qualite_resultat.score_fiabilite}
            />
            <AvertissementBanner avertissements={qualite_resultat.avertissements} />
          </div>
        </div>

        <div className="container results-body">
          <EmptyState
            title="Aucun scénario calculé"
            description={`Aucun régime fiscal applicable n'a pu être déterminé pour votre profil.${
              output.scenarios_exclus.length > 0
                ? ` ${output.scenarios_exclus.length} scénario(s) ont été exclus : ${output.scenarios_exclus
                    .map((e) => e.scenario_id)
                    .join(", ")}.`
                : ""
            } Modifiez vos paramètres ou consultez un expert-comptable.`}
            action={{ label: "Recommencer la simulation", onClick: onRestart }}
          />
        </div>

        <footer className="results-legal-footer">
          <div className="container">
            Ces résultats sont des estimations établies à partir des paramètres fiscaux 2026 en
            vigueur. Pour un conseil personnalisé adapté à votre situation, votre
            expert-comptable reste votre référence.
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="results-page">
      <div className="results-hero">
        <div className="container">
          <h1>Votre simulation fiscale 2026</h1>
          <p className="results-hero-sub">
            {calculs_par_scenario.length} scénario
            {calculs_par_scenario.length > 1 ? "s" : ""} calculé
            {calculs_par_scenario.length > 1 ? "s" : ""} — résultats annuels, charges incluses.
          </p>
          <FiabiliteBar
            niveau={qualite_resultat.niveau_fiabilite}
            score={qualite_resultat.score_fiabilite}
          />
          <AvertissementBanner avertissements={qualite_resultat.avertissements} />
        </div>
      </div>

      <div className="container results-body">
        {recommandation && (
          <section className="results-section">
            <button
              type="button"
              className="btn-motif-toggle"
              onClick={() => setShowMotif((value) => !value)}
            >
              {showMotif ? "Masquer l'explication" : "Pourquoi cette recommandation ?"}
            </button>

            {showMotif && (
              <div className="results-motif card">
                <p className="motif-text">{recommandation.motif}</p>
                {conditionsApplicables.length > 0 && (
                  <div className="motif-note-block">
                    <div className="motif-note-title">ℹ À noter</div>
                    <ul className="vigilance-list">
                      {conditionsApplicables.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        <section className="results-section">
          <h2>Comparaison clé</h2>
          <p className="section-sub">
            Le scénario de référence comparé au scénario recommandé.
          </p>
          <div className="results-criteria-legend">
            <div className="legend-item">
              <span className="sc-badge sc-badge-reference">Référence</span>
              <span>Régime le plus courant pour votre profil, point de départ de la comparaison</span>
            </div>
            <div className="legend-arrow">→</div>
            <div className="legend-item">
              <span className="sc-badge sc-badge-recommande">Recommandé</span>
              <span>Meilleur compromis entre revenu net, robustesse et complexité administrative</span>
            </div>
          </div>
          <div className="compare-pair">
            {scReference && <ScenarioCard scenario={scReference} isReference />}
            {scRecommande && scRecommande.scenario_id !== referenceId && (
              <ScenarioCard
                scenario={scRecommande}
                isRecommande
                ecartAnnuel={ecartRecommande}
              />
            )}
            {scRecommande && scRecommande.scenario_id === referenceId && (
              <div className="results-same-note">
                Le scénario de référence est déjà optimal pour votre profil.
              </div>
            )}
          </div>
        </section>

        {calculs_par_scenario.length > 1 && (
          <section className="results-section">
            <h2>Tous les scénarios</h2>
            <p className="section-sub">Classés par revenu net décroissant.</p>
            <ComparaisonTable
              calculs={calculs_par_scenario}
              comparaison={comparaison}
              recommandeId={recommandeId}
            />
          </section>
        )}

        {output.scenarios_exclus.length > 0 && (
          <section className="results-section results-exclus">
            <CollapsibleSection
              summary={`${output.scenarios_exclus.length} scénario${
                output.scenarios_exclus.length > 1 ? "s" : ""
              } exclu${output.scenarios_exclus.length > 1 ? "s" : ""} de votre profil`}
              badge={output.scenarios_exclus.length}
            >
              <table className="exclus-table">
                <thead>
                  <tr>
                    <th>Régime</th>
                    <th>Motif d'exclusion</th>
                  </tr>
                </thead>
                <tbody>
                  {output.scenarios_exclus.map((exclusion, index) => (
                    <tr key={`${exclusion.scenario_id}-${index}`}>
                      <td>{getScenarioLabel(exclusion.scenario_id).titre}</td>
                      <td>{exclusion.motifs_exclusion.join(" — ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CollapsibleSection>
          </section>
        )}

        <div className="results-footer">
          <button className="btn btn-secondary" onClick={onRestart}>
            ← Recommencer une simulation
          </button>
        </div>

        {isDebug && debugLogs !== undefined && (
          <DebugPanel inputs={output.inputs_normalises} logs={debugLogs} />
        )}
      </div>

      <footer className="results-legal-footer">
        <div className="container">
          Ces résultats sont des estimations établies à partir des paramètres fiscaux 2026 en
          vigueur. Pour un conseil personnalisé adapté à votre situation, votre
          expert-comptable reste votre référence.
        </div>
      </footer>
    </div>
  );
}
