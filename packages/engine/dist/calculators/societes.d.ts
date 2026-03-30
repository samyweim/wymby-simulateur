/**
 * calculators/societes.ts — EURL/SASU IS et IR (C17–C20)
 *
 * Implémente les formules de ALGORITHME.md sections 5.4 et 5.5.
 *
 * EURL IS (C17) : Gérant majoritaire TNS — cotisations TNS sur rémunération
 * EURL IR (C18) : Transparence fiscale — cotisations TNS sur résultat
 * SASU IS (C19) : Président assimilé-salarié — dividendes sans cotisations
 * SASU IR (C20) : Transparence fiscale — cotisations assimilé-salarié sur résultat
 */
import type { NiveauFiabilite, IntermediairesCalcul } from "@wymby/types";
import type { FISCAL_PARAMS_2026 as FiscalParamsType } from "@wymby/config";
import type { EngineLogger } from "../logger.js";
type FP = typeof FiscalParamsType;
export type TypeSociete = "EURL_IS" | "EURL_IR" | "SASU_IS" | "SASU_IR";
export interface InputCalculSociete {
    scenario_id?: string;
    RECETTES_PRO_RETENUES: number;
    CHARGES_DEDUCTIBLES: number;
    DOTATIONS_AMORTISSEMENTS?: number;
    TVA_NETTE_DUE: number;
    type_societe: TypeSociete;
    remuneration_dirigeant: number;
    dividendes_envisages?: number;
    CHARGES_DECAISSEES: number;
    acre_active?: boolean;
    date_creation?: Date;
    exoneration_fiscale_zone?: number;
    autres_revenus_foyer?: number;
    autres_charges_foyer?: number;
    nombre_parts_fiscales: number;
    nb_mois_exercice?: number;
    droits_are_restants?: number;
}
export interface ResultatCalculSociete {
    intermediaires: Partial<IntermediairesCalcul>;
    niveau_fiabilite: NiveauFiabilite;
    avertissements: string[];
}
/**
 * Calcule un scénario EURL ou SASU (IS ou IR).
 */
export declare function calculerSociete(input: InputCalculSociete, params: FP, logger?: EngineLogger): ResultatCalculSociete;
export {};
//# sourceMappingURL=societes.d.ts.map