/**
 * comparator.ts — Comparaison et classement des scénarios
 *
 * Implémente ALGORITHME.md sections 9.1–9.5.
 */
import type { DetailCalculScenario, Comparaison, EcartVsReference, ScenarioId, Recommandation } from "@wymby/types";
import type { FISCAL_PARAMS_2026 as FiscalParamsType } from "@wymby/config";
import type { EngineLogger } from "./logger.js";
type FP = typeof FiscalParamsType;
/**
 * Détermine le scénario de référence selon ALGORITHME.md section 9.1.
 * Priorité : 1) régime déclaré, 2) micro si disponible, 3) premier scénario disponible.
 */
export declare function determinerScenarioReference(calculs: DetailCalculScenario[]): ScenarioId | null;
/**
 * Calcule les écarts de chaque scénario vs le scénario de référence.
 */
export declare function calculerEcarts(calculs: DetailCalculScenario[], scenario_reference_id: ScenarioId): EcartVsReference[];
/**
 * Calcule les scores de chaque scénario (robustesse, complexité, global).
 */
export declare function calculerScores(calcul: DetailCalculScenario, _params: FP): DetailCalculScenario["scores"];
/**
 * Construit l'objet Comparaison complet.
 */
export declare function construireComparaison(calculs: DetailCalculScenario[], scenario_reference_id: ScenarioId, logger: EngineLogger): Comparaison;
/**
 * Détermine le scénario recommandé.
 * Critère principal : score global (pondération robustesse + net + complexité).
 */
export declare function determinerRecommandation(calculs: DetailCalculScenario[], comparaison: Comparaison, logger: EngineLogger): Recommandation | null;
export {};
//# sourceMappingURL=comparator.d.ts.map