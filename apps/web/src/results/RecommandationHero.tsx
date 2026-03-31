import type { Recommandation, DetailCalculScenario } from "@wymby/types";
import { getScenarioLabel } from "../data/scenario-labels.js";
import "./RecommandationHero.css";

interface Props {
  recommandation: Recommandation;
  recommandedScenario: DetailCalculScenario | undefined;
}

const fmt = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

export function RecommandationHero({ recommandation, recommandedScenario }: Props) {
  if (recommandation.gain_vs_reference_annuel <= 0) {
    return null;
  }

  const gainAnnuel = fmt.format(Math.round(recommandation.gain_vs_reference_annuel));
  const gainMensuel = fmt.format(Math.round(recommandation.gain_vs_reference_mensuel));
  const label = recommandedScenario
    ? getScenarioLabel(recommandedScenario.base_id).titre
    : null;

  return (
    <div className="rec-hero">
      <div className="rec-hero-left">
        <span className="rec-hero-gain-label">Gain estime vs situation actuelle</span>
        <div className="rec-hero-gain-value">+{gainAnnuel} EUR / an</div>
        <div className="rec-hero-gain-monthly">soit +{gainMensuel} EUR / mois</div>
      </div>
      <div className="rec-hero-right">
        <p className="rec-hero-regime">
          Regime recommande :{" "}
          {label ? <strong>{label}</strong> : <strong>Regime recommande</strong>}
        </p>
        {recommandation.motif && (
          <p className="rec-hero-motif">{recommandation.motif}</p>
        )}
        {recommandation.points_de_vigilance.length > 0 && (
          <ul className="rec-hero-vigilance">
            {recommandation.points_de_vigilance.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
