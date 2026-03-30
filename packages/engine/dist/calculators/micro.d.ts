/**
 * calculators/micro.ts — Calcul Micro-BIC / Micro-BNC (C01–C12)
 *
 * Implémente les formules décrites dans ALGORITHME.md section 5.2.
 */
import type { NiveauFiabilite, IntermediairesCalcul } from "@wymby/types";
import type { FISCAL_PARAMS_2026 as FiscalParamsType } from "@wymby/config";
import type { EngineLogger } from "../logger.js";
type FP = typeof FiscalParamsType;
export type TypeMicro = "BIC_VENTE" | "BIC_SERVICE" | "BNC";
export interface InputCalculMicro {
    scenario_id?: string;
    CA_HT_RETENU: number;
    TVA_NETTE_DUE: number;
    type_micro: TypeMicro;
    option_vfl: boolean;
    acre_active: boolean;
    date_creation?: Date;
    exoneration_zone?: number;
    autres_revenus_foyer?: number;
    autres_charges_foyer?: number;
    nombre_parts_fiscales: number;
    droits_are_restants?: number;
}
export interface ResultatCalculMicro {
    intermediaires: Partial<IntermediairesCalcul>;
    niveau_fiabilite: NiveauFiabilite;
    avertissements: string[];
}
/**
 * Calcule un scénario Micro-BIC ou Micro-BNC.
 * Conforme à ALGORITHME.md section 5.2.
 */
export declare function calculerMicro(input: InputCalculMicro, params: FP, logger?: EngineLogger): ResultatCalculMicro;
export {};
//# sourceMappingURL=micro.d.ts.map