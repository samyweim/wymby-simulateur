"use strict";
/**
 * calculators/tva.ts — Normalisation CA et calcul TVA
 *
 * Fonctions pures : (inputs, params) → result
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.f_normalisation_CA = f_normalisation_CA;
exports.f_tva = f_tva;
/**
 * Convertit un CA TTC en CA HT.
 * Si le taux TVA n'est pas fourni, utilise 20 % (taux standard) avec avertissement.
 */
function f_normalisation_CA(ca_utilisateur, mode, tva_collectee_saisie, _taux_tva) {
    if (mode === "HT") {
        return {
            CA_HT: ca_utilisateur,
            CA_TTC: ca_utilisateur,
            hypothese: null,
        };
    }
    // TTC → HT
    if (tva_collectee_saisie !== undefined && tva_collectee_saisie > 0) {
        return {
            CA_HT: ca_utilisateur - tva_collectee_saisie,
            CA_TTC: ca_utilisateur,
            hypothese: null,
        };
    }
    // Estimation par taux standard 20 %
    return {
        CA_HT: ca_utilisateur / 1.2,
        CA_TTC: ca_utilisateur,
        hypothese: "Conversion TTC→HT au taux standard 20 % (taux effectif non précisé).",
    };
}
/**
 * Calcule la TVA collectée théorique et la TVA nette due.
 */
function f_tva(CA_HT, regime, taux_tva, tva_deductible) {
    if (regime === "TVA_FRANCHISE") {
        return {
            TVA_COLLECTEE_THEORIQUE: 0,
            TVA_DEDUCTIBLE_RETENUE: 0,
            TVA_NETTE_DUE: 0,
        };
    }
    const TVA_COLLECTEE_THEORIQUE = CA_HT * taux_tva;
    const TVA_NETTE_DUE = Math.max(0, TVA_COLLECTEE_THEORIQUE - tva_deductible);
    return {
        TVA_COLLECTEE_THEORIQUE,
        TVA_DEDUCTIBLE_RETENUE: tva_deductible,
        TVA_NETTE_DUE,
    };
}
//# sourceMappingURL=tva.js.map