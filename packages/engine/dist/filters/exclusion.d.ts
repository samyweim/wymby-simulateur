/**
 * filters/exclusion.ts — Filtres d'exclusion X01–X04
 *
 * X01 : CA N-1 et N-2 > seuils micro → bascule réel obligatoire
 * X02 : CA > seuil TVA → passage TVA collectée immédiat
 * X03 : RFR > seuil VFL → option VFL caduque
 * X04 : Revenu activité < seuil PUMa + revenus capital élevés → taxe rentier potentielle
 */
import type { UserInput, ScenarioCandidat, ScenarioExclu } from "@wymby/types";
import type { NormalisationResult } from "../normalizer.js";
import type { QualificationResult } from "../qualifier.js";
import type { EngineLogger } from "../logger.js";
import type { FISCAL_PARAMS_2026 as FiscalParamsType } from "@wymby/config";
type FP = typeof FiscalParamsType;
export interface FiltreExclusionResult {
    basculement_reel_oblige: boolean;
    tva_collectee_obligatoire: boolean;
    vfl_exclu: boolean;
    puma_applicable: boolean;
    motifs: Record<string, string>;
}
/**
 * Applique les filtres d'exclusion X01–X04 sur les données normalisées.
 * Retourne les flags d'exclusion et leurs motifs.
 */
export declare function appliquerFiltresExclusion(input: UserInput, norm: NormalisationResult, qual: QualificationResult, params: FP, logger: EngineLogger): FiltreExclusionResult;
/**
 * Applique les filtres d'exclusion aux scénarios générés.
 * Retourne { possibles, exclus } mis à jour.
 */
export declare function filtrerScenariosParExclusion(scenarios: ScenarioCandidat[], filtres: FiltreExclusionResult, input: UserInput, logger: EngineLogger): {
    possibles: ScenarioCandidat[];
    exclus: ScenarioExclu[];
};
export {};
//# sourceMappingURL=exclusion.d.ts.map