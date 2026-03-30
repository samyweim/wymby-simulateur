/**
 * scenarios/generator.ts — Génération des scénarios compatibles
 *
 * Produit le produit cartésien contrôlé : BASE × TVA × OPTIONS × AIDES
 * en respectant la matrice de compatibilité.
 */
import type { UserInput, ScenarioCandidat } from "@wymby/types";
import type { QualificationResult } from "../qualifier.js";
import type { FiltreExclusionResult } from "../filters/exclusion.js";
import type { EngineLogger } from "../logger.js";
import type { FISCAL_PARAMS_2026 as FiscalParamsType } from "@wymby/config";
type FP = typeof FiscalParamsType;
/**
 * Génère tous les scénarios compatibles pour un profil donné.
 * Chaque scénario est identifié par un scenario_id unique.
 */
export declare function genererScenarios(input: UserInput, qual: QualificationResult, filtres: FiltreExclusionResult, params: FP, logger: EngineLogger): ScenarioCandidat[];
export {};
//# sourceMappingURL=generator.d.ts.map