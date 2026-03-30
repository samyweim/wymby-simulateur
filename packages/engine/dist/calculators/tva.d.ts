/**
 * calculators/tva.ts — Normalisation CA et calcul TVA
 *
 * Fonctions pures : (inputs, params) → result
 */
/**
 * Convertit un CA TTC en CA HT.
 * Si le taux TVA n'est pas fourni, utilise 20 % (taux standard) avec avertissement.
 */
export declare function f_normalisation_CA(ca_utilisateur: number, mode: "HT" | "TTC", tva_collectee_saisie?: number, _taux_tva?: number): {
    CA_HT: number;
    CA_TTC: number;
    hypothese: string | null;
};
/**
 * Calcule la TVA collectée théorique et la TVA nette due.
 */
export declare function f_tva(CA_HT: number, regime: "TVA_FRANCHISE" | "TVA_COLLECTEE", taux_tva: number, tva_deductible: number): {
    TVA_COLLECTEE_THEORIQUE: number;
    TVA_DEDUCTIBLE_RETENUE: number;
    TVA_NETTE_DUE: number;
};
//# sourceMappingURL=tva.d.ts.map