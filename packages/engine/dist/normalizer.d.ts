/**
 * normalizer.ts — Étape 1 du pipeline : normalisation des entrées
 *
 * Responsabilités :
 * - Convertir CA TTC → HT si nécessaire
 * - Calculer ancienneté, flags de complétude
 * - Normaliser les données foyer
 * - Initialiser variables intermédiaires
 */
import type { UserInput, OptionTVA } from "@wymby/types";
import type { EngineLogger } from "./logger.js";
import type { FISCAL_PARAMS_2026 as FiscalParamsType } from "@wymby/config";
export interface NormalisationResult {
    CA_HT_RETENU: number;
    CA_TTC_RETENU: number;
    TVA_COLLECTEE_THEORIQUE: number;
    TVA_DEDUCTIBLE_RETENUE: number;
    TVA_NETTE_DUE: number;
    RECETTES_PRO_RETENUES: number;
    CHARGES_DECAISSEES_RETENUES: number;
    CHARGES_DEDUCTIBLES_RETENUES: number;
    NOMBRE_PARTS_FISCALES: number;
    ANCIENNETE_MOIS: number | null;
    ANNEE_SIMULATION: number;
    avertissements: string[];
    hypotheses: string[];
    regime_tva_applicable: OptionTVA;
}
type FP = typeof FiscalParamsType;
/**
 * Normalise les entrées utilisateur.
 * Toute hypothèse appliquée est tracée dans `hypotheses`.
 * Toute donnée manquante critique est tracée dans `avertissements`.
 */
export declare function normaliserEntrees(input: UserInput, params: FP, logger: EngineLogger): NormalisationResult;
export {};
//# sourceMappingURL=normalizer.d.ts.map