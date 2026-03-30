import { Fragment, useState } from "react";
import type { Comparaison, DetailCalculScenario } from "@wymby/types";
import { DeltaBadge } from "../components/DeltaBadge.js";
import "./ComparaisonTable.css";

interface Props {
  calculs: DetailCalculScenario[];
  comparaison: Comparaison;
  recommandeId: string | null;
}

const LIBELLES: Record<string, string> = {
  G_MBIC_VENTE: "Micro-BIC Vente",
  G_MBIC_SERVICE: "Micro-BIC Service",
  G_MBNC: "Micro-BNC",
  G_EI_REEL_BIC_IR: "EI Réel BIC — IR",
  G_EI_REEL_BIC_IS: "EI Réel BIC — IS",
  G_EI_REEL_BNC_IR: "EI Réel BNC — IR",
  G_EI_REEL_BNC_IS: "EI Réel BNC — IS",
  G_EURL_IS: "EURL à l'IS",
  G_EURL_IR: "EURL à l'IR",
  G_SASU_IS: "SASU à l'IS",
  G_SASU_IR: "SASU à l'IR",
  S_RSPM: "RSPM",
  S_MICRO_BNC_SECTEUR_1: "Micro-BNC Santé S1",
  S_MICRO_BNC_SECTEUR_2: "Micro-BNC Santé S2",
  S_EI_REEL_SECTEUR_1: "EI Réel Santé S1",
};

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

  return (
    <div className="comp-wrap">
      <div className="comp-scroll">
        <table className="comp-table">
          <thead>
            <tr>
              <th className="col-scenario">Régime</th>
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
            {sorted.map((sc, i) => {
              const inter = sc.intermediaires;
              const ecart = comparaison.ecarts.find((e) => e.scenario_id === sc.scenario_id);
              const isExpanded = expandedId === sc.scenario_id;
              const isRec = sc.scenario_id === recommandeId;
              const isRef = sc.scenario_id === comparaison.scenario_reference_id;
              const complexiteLabel =
                COMPLEXITE_LABELS[sc.scores.SCORE_COMPLEXITE_ADMIN] ?? "—";

              return (
                <Fragment key={sc.scenario_id}>
                  <tr
                    className={`comp-row ${isExpanded ? "comp-row-open" : ""} ${isRec ? "row-recommande" : ""} ${isRef ? "row-reference" : ""}`}
                    onClick={() => setExpandedId(isExpanded ? null : sc.scenario_id)}
                    style={{ cursor: "pointer" }}
                    aria-expanded={isExpanded}
                  >
                    <td className="col-scenario">
                      <div className="row-name-wrap">
                        {isRec && <span className="row-tag tag-rec">Recommandé</span>}
                        {isRef && !isRec && <span className="row-tag tag-ref">Référence</span>}
                        <span className="row-rank">#{i + 1}</span>
                        <span className="row-name">{LIBELLES[sc.base_id] ?? sc.base_id}</span>
                      </div>
                    </td>
                    <td className="col-options">
                      <div className="row-options">
                        <span
                          className={`opt-tag ${sc.option_tva === "TVA_FRANCHISE" ? "opt-muted" : "opt-active"}`}
                        >
                          {sc.option_tva === "TVA_FRANCHISE" ? "Franchise" : "TVA"}
                        </span>
                        {sc.option_vfl === "VFL_OUI" && <span className="opt-tag opt-active">VFL</span>}
                        {sc.boosters_actifs.map((b) => (
                          <span key={b} className="opt-tag opt-booster">
                            {b.replace("BOOST_", "")}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="col-num col-net">{fmt(inter.NET_APRES_IR)} €</td>
                    <td className="col-num">{fmt(inter.COTISATIONS_SOCIALES_NETTES)} €</td>
                    <td className="col-num">{fmt(inter.IR_ATTRIBUABLE_SCENARIO)} €</td>
                    <td className="col-num">{fmt(inter.COUT_TOTAL_SOCIAL_FISCAL)} €</td>
                    <td className="col-num">
                      {ecart && !isRef ? (
                        <DeltaBadge value={ecart.DELTA_NET_APRES_IR} showZero />
                      ) : (
                        <span className="col-muted">—</span>
                      )}
                    </td>
                    <td className="col-complexite">
                      <span
                        className={`badge-complexite complexite-${sc.scores.SCORE_COMPLEXITE_ADMIN}`}
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
                      <td colSpan={9}>
                        <div className="comp-detail-body">
                          <p className="comp-detail-explication">
                            {sc.explication ??
                              `Régime ${LIBELLES[sc.base_id] ?? sc.base_id} — aucune note disponible.`}
                          </p>
                          {sc.avertissements_scenario.length > 0 && (
                            <ul className="comp-detail-warnings">
                              {sc.avertissements_scenario.map((w, wi) => (
                                <li key={wi}>⚠ {w}</li>
                              ))}
                            </ul>
                          )}
                          <p className="comp-detail-fiabilite">
                            Fiabilité : <strong>{sc.niveau_fiabilite}</strong>
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
