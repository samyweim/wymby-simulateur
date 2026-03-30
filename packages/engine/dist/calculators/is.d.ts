/**
 * calculators/is.ts — Calcul de l'Impôt sur les Sociétés
 */
import type { ResultatIS } from "@wymby/types";
import type { FISCAL_PARAMS_2026 as FiscalParamsType } from "@wymby/config";
type FP = typeof FiscalParamsType;
/**
 * Calcule l'IS sur un résultat fiscal.
 * Taux réduit de 15 % jusqu'au seuil, taux normal de 25 % au-delà.
 * Le seuil est proratisé si l'exercice est incomplet.
 *
 * @param resultat_fiscal — Bénéfice fiscal imposable à l'IS
 * @param params — Paramètres fiscaux
 * @param nb_mois_exercice — Nombre de mois de l'exercice (prorata temporis), défaut 12
 */
export declare function f_is(resultat_fiscal: number, params: FP, nb_mois_exercice?: number): ResultatIS;
/**
 * Calcule les dividendes distribuables après IS et réserves légales.
 */
export declare function f_dividendes_distribuables(resultat_apres_is: number, reserve_legale_taux?: number, reserve_legale_plafond_fraction_capital?: number): number;
/**
 * Calcule les dividendes nets perçus (après prélèvements sociaux et PFU).
 *
 * Pour assimilé-salarié (SASU/SELAS) : PFU 31,4 % (IR 12,8 % + PS 18,6 %)
 * Pour TNS (EURL/SELARL) : dividendes hors franchise soumis aux cotisations TNS
 */
export declare function f_dividendes_nets_assimile(dividendes_distribuables: number, params: FP): number;
export {};
//# sourceMappingURL=is.d.ts.map