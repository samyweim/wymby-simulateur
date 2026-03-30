/**
 * calculators/cotisations-tns.ts — Cotisations sociales TNS (régime réel)
 *
 * Implémente les barèmes SSI/BIC et CIPAV avec :
 * - Cotisations par branche (maladie, retraite base/complémentaire, etc.)
 * - Assiette Sociale Unique (ASU) 2026 — abattement 26 %
 * - Cotisations minimales forfaitaires si résultat nul ou négatif
 */
import type { ResultatCotisationsTNS } from "@wymby/types";
import type { FISCAL_PARAMS_2026 as FiscalParamsType } from "@wymby/config";
import type { EngineLogger } from "../logger.js";
type FP = typeof FiscalParamsType;
/**
 * Calcule l'assiette sociale après application de l'ASU 2026.
 * Assiette = max(plancher, min(revenu_net × 0.74, plafond))
 */
export declare function f_assiette_sociale_ASU(revenu_professionnel_net: number, params: FP, logger?: EngineLogger, scenario_id?: string): {
    assiette: number;
    hypothese?: string;
};
/**
 * Calcule les cotisations TNS BIC/BNC SSI par branche.
 * Retourne le détail par branche et le total.
 */
export declare function f_cotisations_tns_bic(assiette: number, params: FP, logger?: EngineLogger, scenario_id?: string): ResultatCotisationsTNS;
/**
 * Calcule les cotisations TNS ACRE hors micro (dégressif).
 * Réduction maximale si assiette ≤ 75 % PASS, dégressif jusqu'à 100 % PASS.
 */
export declare function f_acre_hors_micro(cotisations_brutes: number, assiette: number, params: FP, date_creation?: Date): number;
export {};
//# sourceMappingURL=cotisations-tns.d.ts.map