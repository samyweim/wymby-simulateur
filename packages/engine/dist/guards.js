"use strict";
/**
 * guards.ts — Type guards et validateurs d'entrée
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUserInput = validateUserInput;
exports.isSegmentActivite = isSegmentActivite;
exports.isValidISODate = isValidISODate;
/** Valide que les champs critiques minimum sont présents */
function validateUserInput(input) {
    const erreurs = [];
    if (!input.SEGMENT_ACTIVITE) {
        erreurs.push("SEGMENT_ACTIVITE est requis");
    }
    if (typeof input.CA_ENCAISSE_UTILISATEUR !== "number") {
        erreurs.push("CA_ENCAISSE_UTILISATEUR est requis et doit être un nombre");
    }
    if (input.CA_ENCAISSE_UTILISATEUR < 0) {
        erreurs.push("CA_ENCAISSE_UTILISATEUR ne peut pas être négatif");
    }
    if (!input.INPUT_MODE_CA) {
        erreurs.push("INPUT_MODE_CA (HT ou TTC) est requis");
    }
    if (!input.SITUATION_FAMILIALE) {
        erreurs.push("SITUATION_FAMILIALE est requis");
    }
    if (input.CHARGES_DECAISSEES !== undefined && input.CHARGES_DECAISSEES < 0) {
        erreurs.push("CHARGES_DECAISSEES ne peut pas être négatif");
    }
    return erreurs;
}
function isSegmentActivite(val) {
    return ["generaliste", "sante", "artiste_auteur", "immobilier"].includes(val);
}
/** Vérifie si une date ISO est valide */
function isValidISODate(val) {
    const d = new Date(val);
    return !isNaN(d.getTime());
}
//# sourceMappingURL=guards.js.map