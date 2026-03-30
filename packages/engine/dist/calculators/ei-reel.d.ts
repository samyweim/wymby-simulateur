/**
 * calculators/ei-reel.ts — EI Réel BIC/BNC IR/IS (C13–C16)
 *
 * Implémente les formules de ALGORITHME.md sections 5.3 et 5.4.
 */
import type { NiveauFiabilite, IntermediairesCalcul } from "@wymby/types";
import type { FISCAL_PARAMS_2026 as FiscalParamsType } from "@wymby/config";
import type { EngineLogger } from "../logger.js";
type FP = typeof FiscalParamsType;
export type TypeEIReel = "BIC_IR" | "BIC_IS" | "BNC_IR" | "BNC_IS";
export interface InputCalculEIReel {
    scenario_id?: string;
    RECETTES_PRO_RETENUES: number;
    CHARGES_DECAISSEES: number;
    CHARGES_DEDUCTIBLES: number;
    DOTATIONS_AMORTISSEMENTS?: number;
    TVA_NETTE_DUE: number;
    type_ei: TypeEIReel;
    acre_active?: boolean;
    date_creation?: Date;
    exoneration_fiscale_zone?: number;
    exoneration_sociale_zone?: number;
    autres_revenus_foyer?: number;
    autres_charges_foyer?: number;
    nombre_parts_fiscales: number;
    nb_mois_exercice?: number;
    droits_are_restants?: number;
    remuneration_dirigeant?: number;
}
export interface ResultatCalculEIReel {
    intermediaires: Partial<IntermediairesCalcul>;
    niveau_fiabilite: NiveauFiabilite;
    avertissements: string[];
}
/**
 * Calcule un scénario EI au régime réel (BIC ou BNC, IR ou IS).
 * Conforme à ALGORITHME.md sections 5.3 et 5.4.
 */
export declare function calculerEIReel(input: InputCalculEIReel, params: FP, logger?: EngineLogger): ResultatCalculEIReel;
export {};
//# sourceMappingURL=ei-reel.d.ts.map