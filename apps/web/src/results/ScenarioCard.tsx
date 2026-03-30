import { useState } from "react";
import type { DetailCalculScenario } from "@wymby/types";
import { DeltaBadge } from "../components/DeltaBadge.js";
import "./ScenarioCard.css";

interface Props {
  scenario: DetailCalculScenario;
  isReference?: boolean;
  isRecommande?: boolean;
  ecartAnnuel?: number;
  rank?: number;
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
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n)) + " €";
}

function pct(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  return Math.round(n * 100) + " %";
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
  const sign = negative ? "−" : positive ? "+" : "";
  return (
    <tr className={`dr ${isSubtotal ? "dr-subtotal" : ""} ${isFinal ? "dr-final" : ""}`}>
      <td className="dr-label">{label}</td>
      <td className={`dr-value ${negative ? "dr-neg" : positive ? "dr-pos" : ""}`}>
        {sign}{" "}
        {new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(
          Math.round(Math.abs(value))
        )}{" "}
        €
      </td>
    </tr>
  );
}

export function ScenarioCard({ scenario, isReference, isRecommande, ecartAnnuel, rank }: Props) {
  const [showDetail, setShowDetail] = useState(false);
  const inter = scenario.intermediaires as typeof scenario.intermediaires & Record<string, number | undefined>;
  const boosters = scenario.boosters_actifs;
  const label = LIBELLES[scenario.base_id] ?? scenario.base_id;
  const complexite = scenario.scores.SCORE_COMPLEXITE_ADMIN;

  return (
    <div className={`sc-card ${isRecommande ? "sc-recommande" : ""} ${isReference ? "sc-reference" : ""}`}>
      {isRecommande && <div className="sc-badge sc-badge-recommande">Recommandé</div>}
      {isReference && !isRecommande && <div className="sc-badge sc-badge-reference">Référence</div>}

      <div className="sc-head">
        <div className="sc-title-wrap">
          {rank && !isRecommande && <span className="sc-rank">#{rank}</span>}
          <h3 className="sc-title">{label}</h3>
        </div>
        <div className="sc-net">
          <span className="sc-net-label">Net après impôt</span>
          <span className="sc-net-value">{fmt(inter.NET_APRES_IR)}</span>
          <span className="sc-net-sub">/ an</span>
        </div>
      </div>

      {inter.SUPER_NET !== undefined && inter.SUPER_NET !== inter.NET_APRES_IR && (
        <div className="sc-super-net">
          Super-net (avec ARCE) : <strong>{fmt(inter.SUPER_NET)}</strong>
        </div>
      )}

      <div className="sc-metrics">
        <div className="sc-metric">
          <span className="sc-metric-label">Cotisations sociales</span>
          <span className="sc-metric-value">{fmt(inter.COTISATIONS_SOCIALES_NETTES)}</span>
        </div>
        <div className="sc-metric">
          <span className="sc-metric-label">Impôt sur le revenu</span>
          <span className="sc-metric-value">{fmt(inter.IR_ATTRIBUABLE_SCENARIO)}</span>
        </div>
        {(inter.IS_DU_SCENARIO ?? 0) > 0 && (
          <div className="sc-metric">
            <span className="sc-metric-label">IS</span>
            <span className="sc-metric-value">{fmt(inter.IS_DU_SCENARIO)}</span>
          </div>
        )}
        <div className="sc-metric">
          <span className="sc-metric-label">Coût total charges</span>
          <span className="sc-metric-value">{fmt(inter.COUT_TOTAL_SOCIAL_FISCAL)}</span>
        </div>
        <div className="sc-metric">
          <span className="sc-metric-label">Taux de prélèvement</span>
          <span className="sc-metric-value">{pct(scenario.scores.TAUX_PRELEVEMENTS_GLOBAL)}</span>
        </div>
        <div className="sc-metric">
          <span className="sc-metric-label">Complexité admin.</span>
          <span className="sc-metric-value">{COMPLEXITE_LABELS[complexite] ?? complexite}</span>
        </div>
      </div>

      <button
        className="sc-detail-toggle"
        onClick={() => setShowDetail((v) => !v)}
        aria-expanded={showDetail}
        type="button"
      >
        {showDetail ? "▲ Masquer le détail" : "▼ Voir le détail du calcul"}
      </button>

      {showDetail && (
        <div className="sc-detail-panel" role="region" aria-label="Détail du calcul">
          <table className="sc-detail-table">
            <tbody>
              <DetailRow label="CA HT retenu" value={inter.CA_HT_RETENU} />
              <DetailRow label="Charges déductibles" value={inter.CHARGES_DEDUCTIBLES} negative />
              <DetailRow label="Amortissements" value={inter.DOTATIONS_AMORTISSEMENTS} negative />
              <DetailRow label="Base sociale (ASU)" value={inter.ASSIETTE_SOCIALE_BRUTE} isSubtotal />
              <DetailRow label="Cotisations brutes" value={inter.COTISATIONS_SOCIALES_BRUTES} negative />
              {(inter.REDUCTION_ACRE ?? 0) > 0 && (
                <DetailRow label="Réduction ACRE" value={inter.REDUCTION_ACRE} positive />
              )}
              <DetailRow
                label="Cotisations nettes"
                value={inter.COTISATIONS_SOCIALES_NETTES}
                negative
                isSubtotal
              />
              <DetailRow label="Résultat fiscal" value={inter.RESULTAT_FISCAL_APRES_EXONERATIONS} isSubtotal />
              {(inter.IS_DU_SCENARIO ?? 0) > 0 && (
                <DetailRow label="IS dû" value={inter.IS_DU_SCENARIO} negative />
              )}
              {(inter.TVA_NETTE_DUE ?? 0) > 0 && (
                <DetailRow label="TVA nette due" value={inter.TVA_NETTE_DUE} negative />
              )}
              <DetailRow label="Net avant IR" value={inter.NET_AVANT_IR} isSubtotal />
              <DetailRow label="IR attribuable" value={inter.IR_ATTRIBUABLE_SCENARIO} negative />
              <DetailRow label="Net après IR" value={inter.NET_APRES_IR} isFinal />
            </tbody>
          </table>
          {scenario.explication && <p className="sc-detail-note">{scenario.explication}</p>}
          <div className={`sc-fiabilite sc-fiabilite-${scenario.niveau_fiabilite}`}>
            Fiabilité : <strong>{scenario.niveau_fiabilite}</strong>
          </div>
        </div>
      )}

      {ecartAnnuel !== undefined && ecartAnnuel !== 0 && (
        <div className="sc-ecart">
          <span>vs référence :</span>
          <DeltaBadge value={ecartAnnuel} label="Écart annuel vs scénario de référence" showZero />
          <span className="sc-ecart-per-month">({fmt(ecartAnnuel / 12)} / mois)</span>
        </div>
      )}

      {boosters.length > 0 && (
        <div className="sc-boosters">
          {boosters.map((b) => (
            <span key={b} className="sc-booster-tag">
              {b.replace("BOOST_", "")}
            </span>
          ))}
        </div>
      )}

      <div className={`sc-fiabilite sc-fiabilite-${scenario.niveau_fiabilite}`}>
        {scenario.niveau_fiabilite === "complet" && "✓ Calcul complet"}
        {scenario.niveau_fiabilite === "partiel" && "~ Calcul partiel"}
        {scenario.niveau_fiabilite === "estimation" && "≈ Estimation"}
      </div>
    </div>
  );
}
