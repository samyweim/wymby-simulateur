import { SCENARIO_REGISTRY } from "@wymby/engine";
import type { BaseScenarioId, DetailCalculScenario } from "@wymby/types";

export interface RelevanceRule {
  ca_min?: number;
  ca_max?: number;
  requiert_interet_societe?: boolean;
  delta_minimal_vs_reference?: number;
}

export interface RelevanceContext {
  ca: number;
  interet_societe_explicite: boolean;
  question_societe_renseignee: boolean;
  reference_net: number;
}

export interface ScenarioGroup {
  primary: DetailCalculScenario;
  groupedCount: number;
}

export const SCENARIO_DEDUPLICATION_DELTA = 500;

export const SCENARIO_RELEVANCE: Partial<Record<BaseScenarioId, RelevanceRule>> = {
  G_EURL_IS: { ca_min: 50_000, requiert_interet_societe: true },
  G_EURL_IR: { ca_min: 40_000, requiert_interet_societe: true },
  G_SASU_IS: { ca_min: 50_000, requiert_interet_societe: true },
  G_SASU_IR: { ca_min: 40_000, requiert_interet_societe: true },
  G_EI_REEL_BIC_IS: { ca_min: 45_000, requiert_interet_societe: true },
  G_EI_REEL_BNC_IS: { ca_min: 45_000, requiert_interet_societe: true },
  S_SELARL_IS: { ca_min: 60_000, requiert_interet_societe: true },
  S_SELAS_IS: { ca_min: 60_000, requiert_interet_societe: true },
};

export function isRelevantForProfile(
  scenario: DetailCalculScenario,
  context: RelevanceContext
): boolean {
  const rule = SCENARIO_RELEVANCE[scenario.base_id];
  if (!rule) return true;

  if (rule.ca_min !== undefined && context.ca < rule.ca_min) return false;
  if (rule.ca_max !== undefined && context.ca > rule.ca_max) return false;

  if (
    rule.requiert_interet_societe &&
    context.question_societe_renseignee &&
    !context.interet_societe_explicite
  ) {
    return false;
  }

  if (rule.delta_minimal_vs_reference !== undefined) {
    const delta = Math.abs(
      (scenario.intermediaires.NET_APRES_IR ?? 0) - context.reference_net
    );
    if (delta < rule.delta_minimal_vs_reference) return false;
  }

  return true;
}

export function groupSimilarScenarios(
  scenarios: DetailCalculScenario[],
  threshold: number = SCENARIO_DEDUPLICATION_DELTA
): ScenarioGroup[] {
  const groups: ScenarioGroup[] = [];

  for (const scenario of scenarios) {
    const regimeSocial = SCENARIO_REGISTRY[scenario.base_id]?.regime_social;
    const existingGroup = groups.find((group) => {
      const groupRegimeSocial = SCENARIO_REGISTRY[group.primary.base_id]?.regime_social;
      const delta = Math.abs(
        (group.primary.intermediaires.NET_APRES_IR ?? 0) -
          (scenario.intermediaires.NET_APRES_IR ?? 0)
      );

      return groupRegimeSocial === regimeSocial && delta < threshold;
    });

    if (!existingGroup) {
      groups.push({ primary: scenario, groupedCount: 1 });
      continue;
    }

    existingGroup.groupedCount += 1;

    if (
      scenario.scores.SCORE_GLOBAL_SCENARIO >
      existingGroup.primary.scores.SCORE_GLOBAL_SCENARIO
    ) {
      existingGroup.primary = scenario;
    }
  }

  return groups;
}
