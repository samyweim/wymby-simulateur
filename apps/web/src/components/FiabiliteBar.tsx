import type { NiveauFiabilite } from "@wymby/types";
import "./FiabiliteBar.css";

interface Props {
  niveau: NiveauFiabilite;
  score: number;
  description?: string;
}

const LABELS: Record<NiveauFiabilite, string> = {
  complet: "Calcul complet",
  partiel: "Calcul partiel",
  estimation: "Estimation",
};

const DESCRIPTIONS: Record<NiveauFiabilite, string> = {
  complet: "Toutes les données nécessaires sont disponibles.",
  partiel: "Certaines données sont manquantes — les valeurs peuvent varier.",
  estimation: "Plusieurs hypothèses ont été utilisées. Renseignez vos revenus foyer pour affiner.",
};

export function FiabiliteBar({ niveau, score, description }: Props) {
  return (
    <div className={`fiabilite-bar fiabilite-${niveau}`}>
      <div className="fiabilite-header">
        <span className="fiabilite-label">{LABELS[niveau]}</span>
        <span className="fiabilite-score">{score}/10</span>
      </div>
      <div className="fiabilite-track">
        <div className="fiabilite-fill" style={{ width: `${score * 10}%` }} />
      </div>
      <p className="fiabilite-desc">{description ?? DESCRIPTIONS[niveau]}</p>
    </div>
  );
}
