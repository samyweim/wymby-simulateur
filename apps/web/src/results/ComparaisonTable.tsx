import type { DetailCalculScenario, Comparaison } from "@wymby/types";
import { DeltaBadge } from "../components/DeltaBadge.js";
import "./ComparaisonTable.css";

interface Props {
  calculs: DetailCalculScenario[];
  comparaison: Comparaison;
  recommandeId: string | null;
}

const LIBELLES: Record<string, string> = {
  G_MBIC_VENTE:       "Micro-BIC Vente",
  G_MBIC_SERVICE:     "Micro-BIC Service",
  G_MBNC:             "Micro-BNC",
  G_EI_REEL_BIC_IR:   "EI Réel BIC — IR",
  G_EI_REEL_BIC_IS:   "EI Réel BIC — IS",
  G_EI_REEL_BNC_IR:   "EI Réel BNC — IR",
  G_EI_REEL_BNC_IS:   "EI Réel BNC — IS",
  G_EURL_IS:          "EURL à l'IS",
  G_EURL_IR:          "EURL à l'IR",
  G_SASU_IS:          "SASU à l'IS",
  G_SASU_IR:          "SASU à l'IR",
};

function fmt(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n));
}

export function ComparaisonTable({ calculs, comparaison, recommandeId }: Props) {
  // Tri par NET_APRES_IR décroissant (ordre du classement)
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
            </tr>
          </thead>
          <tbody>
            {sorted.map((sc, i) => {
              const inter = sc.intermediaires;
              const ecart = comparaison.ecarts.find((e) => e.scenario_id === sc.scenario_id);
              const isRef = sc.scenario_id === comparaison.scenario_reference_id;
              const isRec = sc.scenario_id === recommandeId;

              return (
                <tr
                  key={sc.scenario_id}
                  className={`${isRec ? "row-recommande" : ""} ${isRef ? "row-reference" : ""}`}
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
                      <span className={`opt-tag ${sc.option_tva === "TVA_FRANCHISE" ? "opt-muted" : "opt-active"}`}>
                        {sc.option_tva === "TVA_FRANCHISE" ? "Franchise" : "TVA"}
                      </span>
                      {sc.option_vfl === "VFL_OUI" && <span className="opt-tag opt-active">VFL</span>}
                      {sc.boosters_actifs.map((b) => (
                        <span key={b} className="opt-tag opt-booster">{b.replace("BOOST_", "")}</span>
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
