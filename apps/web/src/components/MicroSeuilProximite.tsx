import { FISCAL_PARAMS_2026 } from "@wymby/config";
import type { BaseScenarioId, EngineOutput } from "@wymby/types";
import "./MicroSeuilProximite.css";

const MICRO_BASE_IDS = new Set<BaseScenarioId>([
  "G_MBIC_VENTE",
  "G_MBIC_SERVICE",
  "G_MBNC",
  "S_MICRO_BNC_SECTEUR_1",
  "S_MICRO_BNC_SECTEUR_2",
]);

function getThreshold(baseId: BaseScenarioId): number | null {
  if (baseId === "G_MBIC_VENTE") return FISCAL_PARAMS_2026.micro.CFG_SEUIL_CA_MICRO_BIC_VENTE;
  if (baseId === "G_MBIC_SERVICE") return FISCAL_PARAMS_2026.micro.CFG_SEUIL_CA_MICRO_BIC_SERVICE;
  if (baseId === "G_MBNC" || baseId === "S_MICRO_BNC_SECTEUR_1" || baseId === "S_MICRO_BNC_SECTEUR_2")
    return FISCAL_PARAMS_2026.micro.CFG_SEUIL_CA_MICRO_BNC;
  return null;
}

const PROXIMITY_THRESHOLD_RATIO = 0.7;

interface Props {
  output: EngineOutput;
  scenarioIds?: string[];
}

export function MicroSeuilProximite({ output, scenarioIds }: Props) {
  const ca = output.inputs_normalises.activite.CA_HT_RETENU;

  const scopedScenarios =
    scenarioIds && scenarioIds.length > 0
      ? output.calculs_par_scenario.filter((scenario) => scenarioIds.includes(scenario.scenario_id))
      : output.calculs_par_scenario;

  // Find the first micro scenario in the selected results to determine the relevant threshold
  const firstMicro = scopedScenarios.find((c) => MICRO_BASE_IDS.has(c.base_id));
  if (!firstMicro) return null;

  const seuil = getThreshold(firstMicro.base_id);
  if (!seuil) return null;

  const ratio = ca / seuil;
  if (ratio < PROXIMITY_THRESHOLD_RATIO) return null;

  const pct = Math.min(ratio * 100, 100);
  const remaining = Math.max(seuil - ca, 0);

  return (
    <div className="micro-seuil-card card">
      <div className="micro-seuil-header">
        <span className="micro-seuil-label">Proximité du seuil micro</span>
        <span className="micro-seuil-pct">{pct.toFixed(0)} %</span>
      </div>
      <div className="micro-seuil-bar-track">
        <div
          className={`micro-seuil-bar-fill${pct >= 100 ? " micro-seuil-bar-fill--depasse" : pct >= 90 ? " micro-seuil-bar-fill--proche" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="micro-seuil-legend">
        {pct >= 100
          ? `Seuil dépassé (${seuil.toLocaleString("fr-FR")} €) — le régime réel s'appliquera à partir du 1er janvier prochain si ce CA se confirme deux années de suite.`
          : `${remaining.toLocaleString("fr-FR")} € avant le seuil micro (${seuil.toLocaleString("fr-FR")} €). Un dépassement ponctuel est toléré la première année.`}
      </p>
    </div>
  );
}
