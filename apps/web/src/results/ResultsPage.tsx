import type { EngineOutput } from "@wymby/types";
import { FiabiliteBar } from "../components/FiabiliteBar.js";
import { AvertissementBanner } from "../components/AvertissementBanner.js";
import { ScenarioCard } from "./ScenarioCard.js";
import { ComparaisonTable } from "./ComparaisonTable.js";
import "./ResultsPage.css";

interface Props {
  output: EngineOutput;
  onRestart: () => void;
}

export function ResultsPage({ output, onRestart }: Props) {
  const { calculs_par_scenario, comparaison, recommandation, qualite_resultat } = output;

  const recommandeId = recommandation?.scenario_recommande_id ?? null;
  const referenceId = comparaison.scenario_reference_id;

  const scReference = calculs_par_scenario.find((c) => c.scenario_id === referenceId);
  const scRecommande = recommandeId
    ? calculs_par_scenario.find((c) => c.scenario_id === recommandeId)
    : null;

  const ecartRecommande = recommandeId
    ? comparaison.ecarts.find((e) => e.scenario_id === recommandeId)?.DELTA_NET_APRES_IR
    : undefined;

  return (
    <div className="results-page">
      {/* Header */}
      <div className="results-hero">
        <div className="container">
          <h1>Votre simulation fiscale 2026</h1>
          <p className="results-hero-sub">
            {calculs_par_scenario.length} scénario{calculs_par_scenario.length > 1 ? "s" : ""} calculé{calculs_par_scenario.length > 1 ? "s" : ""} —
            {" "}résultats annuels, charges incluses.
          </p>
          <FiabiliteBar
            niveau={qualite_resultat.niveau_fiabilite}
            score={qualite_resultat.score_fiabilite}
          />
          <AvertissementBanner avertissements={qualite_resultat.avertissements} />
        </div>
      </div>

      <div className="container results-body">
        {/* Recommandation motif */}
        {recommandation && (
          <div className="results-motif card">
            <p className="motif-text">{recommandation.motif}</p>
            {recommandation.points_de_vigilance.length > 0 && (
              <ul className="vigilance-list">
                {recommandation.points_de_vigilance.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Comparaison principale : référence → recommandé */}
        <section className="results-section">
          <h2>Comparaison clé</h2>
          <p className="section-sub">
            Le scénario de référence (le plus courant pour votre profil) comparé au scénario recommandé.
          </p>
          <div className="compare-pair">
            {scReference && (
              <ScenarioCard
                scenario={scReference}
                isReference
              />
            )}
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

        {/* Tableau complet */}
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

        {/* Scénarios exclus */}
        {output.scenarios_exclus.length > 0 && (
          <section className="results-section results-exclus">
            <details>
              <summary>
                {output.scenarios_exclus.length} scénario{output.scenarios_exclus.length > 1 ? "s" : ""} exclu{output.scenarios_exclus.length > 1 ? "s" : ""} de votre profil
              </summary>
              <ul className="exclus-list">
                {output.scenarios_exclus.slice(0, 8).map((e, i) => (
                  <li key={i}>
                    <span className="exclus-id">{e.scenario_id}</span>
                    <span className="exclus-motif">{e.motifs_exclusion.join(" — ")}</span>
                  </li>
                ))}
              </ul>
            </details>
          </section>
        )}

        {/* Footer */}
        <div className="results-footer">
          <p className="disclaimer">
            Ce simulateur est un outil d'orientation. Les résultats sont des estimations basées sur les
            paramètres fiscaux 2026 connus à ce jour. Consultez un expert-comptable avant toute décision.
          </p>
          <button className="btn btn-secondary" onClick={onRestart}>
            ← Recommencer une simulation
          </button>
        </div>
      </div>
    </div>
  );
}
