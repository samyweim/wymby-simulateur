/**
 * scenarios/booster-applicator.ts — Application des boosters aux calculs
 *
 * Chaque booster agit sur une assiette précise :
 * - B01 ZFRR / B02 ZFRR+ : agit sur RESULTAT_FISCAL (IS ou IR)
 * - B03 QPV/ZFU : agit sur RESULTAT_FISCAL avec proratisation CA zone
 * - B04 ACRE : agit sur COTISATIONS_SOCIALES_BRUTES
 * - B05 ARCE : flux trésorerie externe à NET_APRES_IR (SUPER_NET uniquement)
 * - B06 ZIP/ZAC : aide forfaitaire ajoutée à SUPER_NET (Santé, V2)
 */
import type { BoosterId, UserInput } from "@wymby/types";
import type { FISCAL_PARAMS_2026 as FiscalParamsType } from "@wymby/config";
type FP = typeof FiscalParamsType;
export interface BoosterApplicationResult {
    reduction_cotisations: number;
    exoneration_fiscale: number;
    aide_tresorerie: number;
    fiabilite_degradee: boolean;
    avertissement?: string;
}
/**
 * Applique l'ensemble des boosters actifs sur les valeurs calculées.
 * Chaque booster n'agit que sur son assiette précise.
 */
export declare function appliquerBoosters(boosters: BoosterId[], cotisations_brutes: number, resultat_fiscal: number, input: UserInput, params: FP, annee_dans_dispositif: number, scenario_id: string): BoosterApplicationResult;
export {};
//# sourceMappingURL=booster-applicator.d.ts.map