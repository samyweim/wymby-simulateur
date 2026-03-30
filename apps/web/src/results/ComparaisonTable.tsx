import { Fragment, useState } from "react";
import type { Comparaison, DetailCalculScenario } from "@wymby/types";
import { DeltaBadge } from "../components/DeltaBadge.js";
import { AlertBanner } from "../components/AlertBanner.js";
import { getScenarioLabel } from "../data/scenario-labels.js";
import { resolveDisplayMessage } from "../data/avertissement-messages.js";
import "./ComparaisonTable.css";

interface Props {
  calculs: DetailCalculScenario[];
  comparaison: Comparaison;
  recommandeId?: string | null;
  optimalId?: string | null;
  limit?: number;
}

function fmt(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n));
}

function getFiabiliteLabel(niveau: DetailCalculScenario["niveau_fiabilite"]) {
  if (niveau === "complet") return "✓ Complet";
  if (niveau === "partiel") return "~ Partiel";
  return "≈ Estimation";
}

export function ComparaisonTable({ calculs, comparaison, recommandeId, optimalId, limit }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = comparaison.classement_net_apres_ir
    .map((id) => calculs.find((scenario) => scenario.scenario_id === id))
    .filter(Boolean)
    .slice(0, limit) as DetailCalculScenario[];

  return (
    <div className="comp-wrap">
      <div className="comp-scroll">
        <table className="comp-table">
          <thead>
            <tr>
              <th className="col-scenario">Régime</th>
              <th className="col-num">Net/an</th>
              <th className="col-num col-ecart">Écart vs référence</th>
              <th className="col-fiabilite">Fiabilité</th>
              <th className="col-why">▼</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((scenario, index) => {
              const inter = scenario.intermediaires;
              const delta = comparaison.ecarts.find(
                (entry) => entry.scenario_id === scenario.scenario_id
              )?.DELTA_NET_APRES_IR;
              const isExpanded = expandedId === scenario.scenario_id;
              const isRec = scenario.scenario_id === recommandeId;
              const isRef = scenario.scenario_id === comparaison.scenario_reference_id;
              const isOptimal = scenario.scenario_id === optimalId;
              const label = getScenarioLabel(scenario.base_id);

              return (
                <Fragment key={scenario.scenario_id}>
                  <tr
                    className={`comp-row ${isExpanded ? "comp-row-open" : ""} ${
                      isRec ? "row-recommande" : ""
                    } ${isRef ? "row-reference" : ""}`}
                    onClick={() =>
                      setExpandedId(isExpanded ? null : scenario.scenario_id)
                    }
                    aria-expanded={isExpanded}
                  >
                    <td className="col-scenario">
                      <div className="row-name-wrap">
                        {isRec && <span className="row-tag tag-rec">Recommandé</span>}
                        {isRef && <span className="row-tag tag-ref">Référence</span>}
                        {isOptimal && <span className="row-tag tag-opt">Optimal</span>}
                        <span className="row-rank">#{index + 1}</span>
                        <span className="row-name">{label.titre}</span>
                      </div>
                    </td>
                    <td className="col-num col-net text-numeric">
                      {fmt(inter.NET_APRES_IR)} €/an
                    </td>
                    <td className="col-num col-ecart">
                      {isRef ? (
                        <span className="col-muted">— référence</span>
                      ) : delta !== undefined ? (
                        <DeltaBadge value={delta} showZero />
                      ) : (
                        <span className="col-muted">—</span>
                      )}
                    </td>
                    <td className="col-fiabilite">
                      <span className={`sc-fiabilite sc-fiabilite-${scenario.niveau_fiabilite}`}>
                        {getFiabiliteLabel(scenario.niveau_fiabilite)}
                      </span>
                    </td>
                    <td className="col-why">
                      <button
                        type="button"
                        className="expand-icon"
                        aria-expanded={isExpanded}
                        onClick={(event) => {
                          event.stopPropagation();
                          setExpandedId(isExpanded ? null : scenario.scenario_id);
                        }}
                      >
                        {isExpanded ? "▲" : "▼"}
                      </button>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="comp-row-detail">
                      <td colSpan={5}>
                        <div className="comp-detail-body">
                          <div className="comp-detail-grid">
                            <div className="comp-detail-number">
                              <span className="comp-detail-label">Cotisations nettes</span>
                              <strong>{fmt(inter.COTISATIONS_SOCIALES_NETTES)} €</strong>
                            </div>
                            <div className="comp-detail-number">
                              <span className="comp-detail-label">IR attribuable</span>
                              <strong>{fmt(inter.IR_ATTRIBUABLE_SCENARIO)} €</strong>
                            </div>
                            <div className="comp-detail-number">
                              <span className="comp-detail-label">Coût total</span>
                              <strong>{fmt(inter.COUT_TOTAL_SOCIAL_FISCAL)} €</strong>
                            </div>
                            <div className="comp-detail-number">
                              <span className="comp-detail-label">Base imposable</span>
                              <strong>{fmt(inter.RESULTAT_FISCAL_APRES_EXONERATIONS)} €</strong>
                            </div>
                          </div>

                          <p className="comp-detail-explication">
                            {scenario.explication ??
                              label.description ??
                              label.titre}
                          </p>

                          {scenario.avertissements_scenario.length > 0 && (
                            <div className="comp-detail-warnings">
                              {scenario.avertissements_scenario
                                .map(resolveDisplayMessage)
                                .filter((warning): warning is NonNullable<typeof warning> => warning !== null)
                                .map((warning, warningIndex) => (
                                <AlertBanner
                                  key={`${warning.message}-${warningIndex}`}
                                  level={warning.level}
                                  primaryMessage={warning.message}
                                />
                              ))}
                            </div>
                          )}

                          <p
                            className={`comp-detail-fiabilite sc-fiabilite sc-fiabilite-${scenario.niveau_fiabilite}`}
                          >
                            Fiabilité : <strong>{scenario.niveau_fiabilite}</strong>
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
