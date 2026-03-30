/**
 * calculators/cotisations-assimile.ts — Cotisations assimilé-salarié (Président SASU/SELAS)
 *
 * Le président SASU/SELAS est soumis au régime général (assimilé-salarié),
 * avec parts employeur + salarié. Pas de cotisation chômage pour le président.
 *
 * Méthode simplifiée : les taux globaux moyens sont extraits des paramètres.
 * Précision maximale : ~2–3 % d'écart vs calcul ligne par ligne.
 */
import type { FISCAL_PARAMS_2026 as FiscalParamsType } from "@wymby/config";
type FP = typeof FiscalParamsType;
export interface ResultatCotisationsAssimile {
    cotisations_patronales: number;
    cotisations_salariales: number;
    cotisations_totales: number;
    remuneration_nette: number;
    cout_total_remuneration: number;
    detail: Record<string, number>;
}
/**
 * Calcule les cotisations assimilé-salarié pour le président SASU/SELAS.
 *
 * Calcul ligne par ligne à partir des taux du paramétrage.
 * Le président SASU ne cotise PAS à l'assurance chômage.
 *
 * @param remuneration_brute — Rémunération brute du président (annuelle)
 * @param params — Paramètres fiscaux
 */
export declare function f_cotisations_assimile_salarie(remuneration_brute: number, params: FP): ResultatCotisationsAssimile;
export {};
//# sourceMappingURL=cotisations-assimile.d.ts.map