import { Fragment, useState } from "react";
import type { Comparaison, DetailCalculScenario } from "@wymby/types";
import { DeltaBadge } from "../components/DeltaBadge.js";
import { getScenarioLabel } from "../data/scenario-labels.js";
import "./ComparaisonTable.css";

interface Props {
  calculs: DetailCalculScenario[];
  comparaison: Comparaison;
  recommandeId?: string | null;
}

const COMPLEXITE_LABELS = ["", "Très simple", "Simple", "Moyen", "Complexe", "Très complexe"];

function fmt(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n));
}

export function ComparaisonTable({ calculs, comparaison, recommandeId }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = comparaison.classement_net_apres_ir
    .map((id) => calculs.find((c) => c.scenario_id === id))
    .filter(Boolean) as DetailCalculScenario[];

  const maxNetApresIR = Math.max(
    ...sorted.map((scenario) => scenario.intermediaires.NET_APRES_IR ?? 0),
    0
  );

  return (
    <div className="comp-wrap">
      <div className="comp-scroll">
        <table className="comp-table">
          <thead>
            <tr>
              <th className="col-scenario">Régime</th>
              <th className="col-bar">Revenu net</th>
              <th className="col-options">Options</th>
              <th className="col-num">Net / an</th>
              <th className="col-num">Cotisations</th>
              <th className="col-num">IR</th>
              <th className="col-num">Coût total</th>
              <th className="col-num">vs référence</th>
              <th className="col-complexite">Complexité</th>
              <th className="col-why">Détail</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((scenario, index) => {
              const inter = scenario.intermediaires;
              const ecart = comparaison.ecarts.find((e) => e.scenario_id === scenario.scenario_id);
              const isExpanded = expandedId === scenario.scenario_id;
              const isRec = scenario.scenario_id === recommandeId;
              const isRef = scenario.scenario_id === comparaison.scenario_reference_id;
              const complexiteLabel =
                COMPLEXITE_LABELS[scenario.scores.SCORE_COMPLEXITE_ADMIN] ?? "—";
              const barWidth =
                maxNetApresIR > 0
                  ? (((inter.NET_APRES_IR ?? 0) / maxNetApresIR) * 100).toFixed(1)
                  : "0";

              return (
                <Fragment key={scenario.scenario_id}>
                  <tr
                    className={`comp-row ${isExpanded ? "comp-row-open" : ""} ${
                      isRec ? "row-recommande" : ""
                    } ${isRef ? "row-reference" : ""}`}
                    onClick={() => setExpandedId(isExpanded ? null : scenario.scenario_id)}
                    aria-expanded={isExpanded}
                  >
                    <td className="col-scenario">
                      <div className="row-name-wrap">
                        {isRec && <span className="row-tag tag-rec">Recommandé</span>}
                        {isRef && !isRec && <span className="row-tag tag-ref">Référence</span>}
                        <span className="row-rank">#{index + 1}</span>
                        <span className="row-name">{getScenarioLabel(scenario.base_id).titre}</span>
                      </div>
                    </td>
                    <td className="col-bar">
                      <div className="comp-bar-track">
                        <div
                          className={`comp-bar-fill ${isRec ? "bar-rec" : ""} ${
                            isRef ? "bar-ref" : ""
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </td>
                    <td className="col-options">
                      <div className="row-options">
                        <span
                          className={`opt-tag ${
                            scenario.option_tva === "TVA_FRANCHISE" ? "opt-muted" : "opt-active"
                          }`}
                        >
                          {scenario.option_tva === "TVA_FRANCHISE" ? "Franchise" : "TVA"}
                        </span>
                        {scenario.option_vfl === "VFL_OUI" && (
                          <span className="opt-tag opt-active">VFL</span>
                        )}
                        {scenario.boosters_actifs.map((booster) => (
                          <span key={booster} className="opt-tag opt-booster">
                            {booster.replace("BOOST_", "")}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="col-num col-net text-numeric">{fmt(inter.NET_APRES_IR)} €</td>
                    <td className="col-num text-numeric">{fmt(inter.COTISATIONS_SOCIALES_NETTES)} €</td>
                    <td className="col-num text-numeric">{fmt(inter.IR_ATTRIBUABLE_SCENARIO)} €</td>
                    <td className="col-num text-numeric">{fmt(inter.COUT_TOTAL_SOCIAL_FISCAL)} €</td>
                    <td className="col-num">
                      {ecart && !isRef ? (
                        <DeltaBadge value={ecart.DELTA_NET_APRES_IR} showZero />
                      ) : (
                        <span className="col-muted">—</span>
                      )}
                    </td>
                    <td className="col-complexite">
                      <span
                        className={`badge-complexite complexite-${scenario.scores.SCORE_COMPLEXITE_ADMIN}`}
                      >
                        {complexiteLabel}
                      </span>
                    </td>
                    <td className="col-why">
                      <span className="expand-icon" aria-hidden>
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="comp-row-detail">
                      <td colSpan={10}>
                        <div className="comp-detail-body">
                          <p className="comp-detail-explication">
                            {scenario.explication ??
                              `${getScenarioLabel(scenario.base_id).description || getScenarioLabel(scenario.base_id).titre} — aucune note disponible.`}
                          </p>
                          {scenario.avertissements_scenario.length > 0 && (
                            <ul className="comp-detail-warnings">
                              {scenario.avertissements_scenario.map((warning, warningIndex) => (
                                <li key={warningIndex}>⚠ {warning}</li>
                              ))}
                            </ul>
                          )}
                          <p className="comp-detail-fiabilite">
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
