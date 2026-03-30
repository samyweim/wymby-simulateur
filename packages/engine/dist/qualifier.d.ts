/**
 * qualifier.ts — Étape 2 du pipeline : qualification du profil
 *
 * Détermine le segment, les flags d'éligibilité aux régimes de base,
 * les options TVA, VFL, et les boosters potentiels.
 */
import type { UserInput, QualificationFlags, SegmentActivite, OptionTVA } from "@wymby/types";
import type { NormalisationResult } from "./normalizer.js";
import type { EngineLogger } from "./logger.js";
import type { FISCAL_PARAMS_2026 as FiscalParamsType } from "@wymby/config";
type FP = typeof FiscalParamsType;
export interface QualificationResult {
    segment: SegmentActivite;
    flags: QualificationFlags;
    regime_tva: OptionTVA;
    elements_a_confirmer: string[];
    avertissements: string[];
}
/**
 * Qualifie le profil utilisateur et détermine les flags d'éligibilité.
 */
export declare function qualifierProfil(input: UserInput, norm: NormalisationResult, params: FP, logger: EngineLogger): QualificationResult;
export {};
//# sourceMappingURL=qualifier.d.ts.map