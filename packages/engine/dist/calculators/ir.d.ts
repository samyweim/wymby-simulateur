/**
 * calculators/ir.ts — Calcul de l'Impôt sur le Revenu (méthode différentielle)
 *
 * Implémente la méthode différentielle décrite dans ALGORITHME.md section 5.1 :
 *   IR_scenario = IR_foyer(avec_revenu) − IR_foyer(sans_revenu_scenario)
 *
 * Les calculs IR sont TOUJOURS des estimations si les données foyer
 * sont incomplètes — la qualité est systématiquement qualifiée.
 */
import type { FISCAL_PARAMS_2026 as FiscalParamsType } from "@wymby/config";
import type { ResultatIR } from "@wymby/types";
import type { EngineLogger } from "../logger.js";
type FP = typeof FiscalParamsType;
/**
 * Applique le barème progressif IR sur une base imposable et un nombre de parts.
 * Implémente le mécanisme du quotient familial avec plafonnement.
 *
 * @param base_imposable — Revenu net global imposable du foyer
 * @param nb_parts — Nombre de parts fiscales
 * @param params — Paramètres fiscaux
 * @returns Impôt brut sur le revenu avant décote
 */
export declare function f_bareme_progressif(base_imposable: number, nb_parts: number, params: FP): number;
/**
 * Calcule l'IR attribuable au scénario par la méthode différentielle.
 *
 * Si AUTRES_REVENUS_FOYER_IMPOSABLES est absent, bascule en mode estimation
 * et émet un avertissement.
 */
export declare function f_ir_attribuable_scenario(base_ir_scenario: number, autres_revenus_foyer: number | undefined, autres_charges_foyer: number | undefined, nb_parts: number, params: FP, logger?: EngineLogger, scenario_id?: string): ResultatIR;
export {};
//# sourceMappingURL=ir.d.ts.map