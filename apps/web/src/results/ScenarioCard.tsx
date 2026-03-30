import { useState } from "react";
import type { DetailCalculScenario } from "@wymby/types";
import { DeltaBadge } from "../components/DeltaBadge.js";
import { TooltipFiscal } from "../components/TooltipFiscal.js";
import {
  SCENARIO_COMPLEXITY,
  getComplexityTone,
} from "../data/scenario-complexity.js";
import {
  SCENARIO_ACCESS,
  selectAccesRegime,
} from "../data/scenario-access.js";
import { getBoosterLabel, getScenarioLabel } from "../data/scenario-labels.js";
import "./ScenarioCard.css";

interface Props {
  scenario: DetailCalculScenario;
  referenceBaseId?: DetailCalculScenario["base_id"];
  isReference?: boolean;
  isRecommande?: boolean;
  isOptimal?: boolean;
  ecartAnnuel?: number;
  rank?: number;
  badges?: Array<"reference" | "recommande" | "optimal">;
  groupedCount?: number;
}

function fmt(n: number | undefined): string {
  if (n === undefined || n === null) return "-";
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n))} EUR`;
}

function pct(n: number | undefined): string {
  if (n === undefined || n === null) return "-";
  return `${Math.round(n * 100)} %`;
}

function fmtIr(
  value: number | undefined,
  niveauFiabilite: DetailCalculScenario["niveau_fiabilite"],
  optionVfl: DetailCalculScenario["option_vfl"]
): string {
  if (value === undefined || value === null) return "-";
  const formatted = fmt(value);
  if (niveauFiabilite === "estimation" && optionVfl !== "VFL_OUI") {
    return `~${formatted} (estimation)`;
  }
  return formatted;
}

function DetailRow({
  label,
  value,
  negative,
  positive,
  isSubtotal,
  isFinal,
}: {
  label: string;
  value: number | undefined;
  negative?: boolean;
  positive?: boolean;
  isSubtotal?: boolean;
  isFinal?: boolean;
}) {
  if (value === undefined || value === null) return null;
  const sign = negative ? "-" : positive ? "+" : "";

  return (
    <tr className={`dr ${isSubtotal ? "dr-subtotal" : ""} ${isFinal ? "dr-final" : ""}`}>
      <td className="dr-label">{label}</td>
      <td className={`dr-value text-numeric ${negative ? "dr-neg" : positive ? "dr-pos" : ""}`}>
        {sign}{" "}
        {new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(
          Math.round(Math.abs(value))
        )}{" "}
        EUR
      </td>
    </tr>
  );
}

function getProfessionnelBadge(
  professionnel: "expert_comptable" | "avocat" | "ordre_professionnel" | null
): string | null {
  if (professionnel === "ordre_professionnel") return "Agrement de l'Ordre requis";
  if (professionnel === "expert_comptable") return "Expert-comptable recommande";
  if (professionnel === "avocat") return "Avocat specialise recommande";
  return null;
}

function getDemarcheLabel(link?: string): string | null {
  if (!link) return null;

  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function ScenarioCard({
  scenario,
  referenceBaseId,
  isReference,
  isRecommande,
  isOptimal,
  ecartAnnuel,
  rank,
  badges,
  groupedCount = 1,
}: Props) {
  const [showDetail, setShowDetail] = useState(false);
  const [showComplexityDetail, setShowComplexityDetail] = useState(false);
  const [showAccessDetail, setShowAccessDetail] = useState(false);
  const inter = scenario.intermediaires as typeof scenario.intermediaires &
    Record<string, number | undefined>;
  const boosters = scenario.boosters_actifs;
  const scenarioLabel = getScenarioLabel(scenario.base_id);
  const complexity =
    SCENARIO_COMPLEXITY[scenario.base_id] ?? {
      score: scenario.scores.SCORE_COMPLEXITE_ADMIN,
      label: "Modérée" as const,
      obligations: [],
      frequence_principale: "A confirmer",
    };
  const complexityTone = getComplexityTone(complexity.score);
  const accessConfig = SCENARIO_ACCESS[scenario.base_id];
  const access = accessConfig
    ? selectAccesRegime(accessConfig, referenceBaseId)
    : null;
  const professionnelBadge = getProfessionnelBadge(access?.professionnel_requis ?? null);
  const demarcheLabel = getDemarcheLabel(access?.lien_officiel);
  const isMicro =
    inter.ABATTEMENT_FORFAITAIRE !== undefined &&
    inter.ABATTEMENT_FORFAITAIRE > 0 &&
    !inter.CHARGES_DEDUCTIBLES;
  const monthlyNet = Math.round((inter.NET_APRES_IR ?? 0) / 12);
  const activeBadges = badges ?? [
    ...(isReference ? (["reference"] as const) : []),
    ...(isRecommande ? (["recommande"] as const) : []),
    ...(isOptimal ? (["optimal"] as const) : []),
  ];

  return (
    <div
      className={`sc-card ${activeBadges.includes("recommande") ? "sc-recommande" : ""} ${
        activeBadges.includes("reference") ? "sc-reference" : ""
      } ${activeBadges.includes("optimal") ? "sc-optimal" : ""}`}
    >
      {activeBadges.length > 0 && (
        <div className="sc-badges">
          {activeBadges.map((badge) => (
            <div key={badge} className={`sc-badge sc-badge-${badge}`}>
              {badge === "recommande" && "Recommande"}
              {badge === "reference" && "Reference"}
              {badge === "optimal" && "Optimal"}
            </div>
          ))}
        </div>
      )}

      <div className="sc-head">
        <div className="sc-title-wrap">
          {rank && !isRecommande && <span className="sc-rank">#{rank}</span>}
          <div className="sc-title-block">
            <h3 className="sc-title">{scenarioLabel.titre}</h3>
            <p className="sc-title-desc">{scenarioLabel.description}</p>
          </div>
        </div>
        <div className="sc-net">
          <span className="sc-net-label">Net apres impot</span>
          <span className="sc-net-value text-numeric">{fmt(inter.NET_APRES_IR)}</span>
          <span className="sc-net-monthly text-numeric">
            soit environ {monthlyNet.toLocaleString("fr-FR")} EUR/mois
          </span>
          <span className="sc-net-sub">/ an</span>
        </div>
      </div>

      {inter.SUPER_NET !== undefined && inter.SUPER_NET !== inter.NET_APRES_IR && (
        <div className="sc-super-net">
          Super-net (avec ARCE) : <strong className="text-numeric">{fmt(inter.SUPER_NET)}</strong>
        </div>
      )}

      <div className="sc-metrics">
        <div className="sc-metric">
          <span className="sc-metric-label">Cotisations sociales</span>
          <span className="sc-metric-value text-numeric">{fmt(inter.COTISATIONS_SOCIALES_NETTES)}</span>
        </div>
        <div className="sc-metric">
          <span className="sc-metric-label">Impot sur le revenu</span>
          <span className="sc-metric-value text-numeric">
            {fmtIr(inter.IR_ATTRIBUABLE_SCENARIO, scenario.niveau_fiabilite, scenario.option_vfl)}
          </span>
        </div>
        {(inter.IS_DU_SCENARIO ?? 0) > 0 && (
          <div className="sc-metric">
            <span className="sc-metric-label">IS</span>
            <span className="sc-metric-value text-numeric">{fmt(inter.IS_DU_SCENARIO)}</span>
          </div>
        )}
        <div className="sc-metric">
          <span className="sc-metric-label">Cout total charges</span>
          <span className="sc-metric-value text-numeric">{fmt(inter.COUT_TOTAL_SOCIAL_FISCAL)}</span>
        </div>
        <div className="sc-metric">
          <span className="sc-metric-label">Taux de prelevement</span>
          <span className="sc-metric-value text-numeric">{pct(scenario.scores.TAUX_PRELEVEMENTS_GLOBAL)}</span>
        </div>
        <div className="sc-metric">
          <span className="sc-metric-label">Complexite admin.</span>
          <span className="sc-metric-value">{complexity.label}</span>
        </div>
      </div>

      <div className={`sc-complexity sc-complexity-${complexityTone}`}>
        <div className="sc-complexity-summary">
          <div>
            <span className="sc-complexity-kicker">Complexite</span>
            <div className="sc-complexity-line">
              <strong>{complexity.label}</strong>
              <span>{complexity.frequence_principale}</span>
            </div>
          </div>
          <div className="sc-complexity-side">
            <span className="sc-complexity-score">{complexity.score}/5</span>
            {complexity.cout_comptable_estime && (
              <span className="sc-complexity-cost">{complexity.cout_comptable_estime}</span>
            )}
          </div>
        </div>

        <button
          className="sc-complexity-toggle"
          onClick={() => setShowComplexityDetail((value) => !value)}
          aria-expanded={showComplexityDetail}
          type="button"
        >
          {showComplexityDetail ? "Masquer les obligations" : "Voir les obligations"}
        </button>

        {showComplexityDetail && complexity.obligations.length > 0 && (
          <ul className="sc-complexity-list">
            {complexity.obligations.map((obligation) => (
              <li key={obligation}>{obligation}</li>
            ))}
          </ul>
        )}
      </div>

      {access && (
        <div className="sc-access">
          <div className="sc-access-summary">
            <div>
              <span className="sc-access-kicker">Comment y acceder</span>
              <div className="sc-access-line">
                <strong>Delai : {access.delai_effectivite}</strong>
                <span>Cout : {access.cout_demarche_estime}</span>
              </div>
            </div>
          </div>

          <button
            className="sc-access-toggle"
            onClick={() => setShowAccessDetail((value) => !value)}
            aria-expanded={showAccessDetail}
            type="button"
          >
            {showAccessDetail ? "Masquer les etapes detaillees" : "Voir les etapes detaillees"}
          </button>

          {showAccessDetail && (
            <div className="sc-access-detail" role="region" aria-label="Comment y acceder">
              {demarcheLabel && (
                <p className="sc-access-meta">
                  <strong>Demarche :</strong> {demarcheLabel}
                </p>
              )}
              {access.fenetre_option && (
                <p className="sc-access-meta">
                  <strong>Fenetre :</strong> {access.fenetre_option}
                </p>
              )}
              {professionnelBadge && <div className="sc-access-badge">{professionnelBadge}</div>}
              {access.accompagnement_recommande && (
                <div className="sc-access-warning">Accompagnement recommande</div>
              )}
              <ol className="sc-access-list">
                {access.etapes.map((etape) => (
                  <li key={etape}>{etape}</li>
                ))}
              </ol>
              {access.lien_officiel && (
                <a
                  className="sc-access-link"
                  href={access.lien_officiel}
                  target="_blank"
                  rel="noreferrer"
                >
                  Voir la source officielle
                </a>
              )}
            </div>
          )}
        </div>
      )}

      <button
        className="sc-detail-toggle"
        onClick={() => setShowDetail((value) => !value)}
        aria-expanded={showDetail}
        type="button"
      >
        {showDetail ? "Masquer le detail" : "Voir le detail du calcul"}
      </button>

      {showDetail && (
        <div className="sc-detail-panel" role="region" aria-label="Detail du calcul">
          <table className="sc-detail-table">
            <tbody>
              <DetailRow label="CA HT retenu" value={inter.CA_HT_RETENU} />
              {isMicro ? (
                <DetailRow
                  label="Abattement forfaitaire"
                  value={inter.ABATTEMENT_FORFAITAIRE}
                  negative
                />
              ) : (
                <>
                  {(inter.CHARGES_DEDUCTIBLES ?? 0) > 0 && (
                    <DetailRow
                      label="Charges deductibles"
                      value={inter.CHARGES_DEDUCTIBLES}
                      negative
                    />
                  )}
                  {(inter.DOTATIONS_AMORTISSEMENTS ?? 0) > 0 && (
                    <DetailRow
                      label="Amortissements"
                      value={inter.DOTATIONS_AMORTISSEMENTS}
                      negative
                    />
                  )}
                </>
              )}
              <DetailRow label="Base sociale (ASU)" value={inter.ASSIETTE_SOCIALE_BRUTE} isSubtotal />
              <DetailRow label="Cotisations brutes" value={inter.COTISATIONS_SOCIALES_BRUTES} negative />
              {(inter.REDUCTION_ACRE ?? 0) > 0 && (
                <DetailRow label="Reduction ACRE" value={inter.REDUCTION_ACRE} positive />
              )}
              <DetailRow
                label="Cotisations nettes"
                value={inter.COTISATIONS_SOCIALES_NETTES}
                negative
                isSubtotal
              />
              <DetailRow label="Resultat fiscal" value={inter.RESULTAT_FISCAL_APRES_EXONERATIONS} isSubtotal />
              {(inter.IS_DU_SCENARIO ?? 0) > 0 && (
                <DetailRow label="IS du" value={inter.IS_DU_SCENARIO} negative />
              )}
              {(inter.TVA_NETTE_DUE ?? 0) > 0 && (
                <DetailRow label="TVA nette due" value={inter.TVA_NETTE_DUE} negative />
              )}
              <DetailRow label="Net avant IR" value={inter.NET_AVANT_IR} isSubtotal />
              <DetailRow
                label={
                  scenario.niveau_fiabilite === "estimation" && scenario.option_vfl !== "VFL_OUI"
                    ? "IR attribuable (estimation)"
                    : "IR attribuable"
                }
                value={inter.IR_ATTRIBUABLE_SCENARIO}
                negative
              />
              <DetailRow label="Net apres IR" value={inter.NET_APRES_IR} isFinal />
            </tbody>
          </table>
          {scenario.explication && <p className="sc-detail-note">{scenario.explication}</p>}
          <div className={`sc-fiabilite sc-fiabilite-${scenario.niveau_fiabilite}`}>
            Fiabilite : <strong>{scenario.niveau_fiabilite}</strong>
          </div>
        </div>
      )}

      {ecartAnnuel !== undefined && ecartAnnuel !== 0 && (
        <div className="sc-ecart">
          <span>vs reference :</span>
          <DeltaBadge value={ecartAnnuel} label="Ecart annuel vs scenario de reference" showZero />
          <span className="sc-ecart-per-month text-numeric">({fmt(ecartAnnuel / 12)} / mois)</span>
        </div>
      )}

      {boosters.length > 0 && (
        <div className="sc-boosters">
          {boosters.map((boosterId) => {
            const booster = getBoosterLabel(boosterId);
            return (
              <TooltipFiscal key={boosterId} term={booster.titre}>
                {booster.description}
              </TooltipFiscal>
            );
          })}
        </div>
      )}

      {groupedCount > 1 && (
        <div className="sc-grouped-note">{groupedCount} scenarios proches regroupes</div>
      )}

      <div className={`sc-fiabilite sc-fiabilite-${scenario.niveau_fiabilite}`}>
        {scenario.niveau_fiabilite === "complet" && "Calcul complet"}
        {scenario.niveau_fiabilite === "partiel" && "Calcul partiel"}
        {scenario.niveau_fiabilite === "estimation" && "Estimation"}
      </div>
    </div>
  );
}
