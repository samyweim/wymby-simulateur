/**
 * output-builder.ts — Construction de la sortie structurée EngineOutput
 *
 * Assemble tous les résultats intermédiaires en un objet EngineOutput complet.
 */
import type { UserInput, EngineOutput, DetailCalculScenario, ScenarioCandidat, ScenarioExclu, Comparaison, Recommandation } from "@wymby/types";
import type { NormalisationResult } from "./normalizer.js";
import type { QualificationResult } from "./qualifier.js";
import type { EngineLogger } from "./logger.js";
export declare function construireEngineOutput(input: UserInput, norm: NormalisationResult, qual: QualificationResult, scenarios_possibles: ScenarioCandidat[], scenarios_exclus: ScenarioExclu[], calculs: DetailCalculScenario[], comparaison: Comparaison, recommandation: Recommandation | null, avertissements_globaux: string[], logger: EngineLogger): EngineOutput;
//# sourceMappingURL=output-builder.d.ts.map