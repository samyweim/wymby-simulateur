"use strict";
/**
 * @wymby/config — Configuration fiscale et paramétrages réglementaires
 *
 * Point d'entrée unique du package. Exporte les paramètres fiscaux 2026
 * et un utilitaire de résolution des paramètres par année.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FISCAL_PARAMS_2026 = void 0;
exports.resolveParams = resolveParams;
var fiscal_params_2026_js_1 = require("./fiscal_params_2026.js");
Object.defineProperty(exports, "FISCAL_PARAMS_2026", { enumerable: true, get: function () { return fiscal_params_2026_js_1.FISCAL_PARAMS_2026; } });
const fiscal_params_2026_js_2 = require("./fiscal_params_2026.js");
/**
 * Résout les paramètres fiscaux pour une année donnée.
 * Retourne null si l'année n'est pas disponible — jamais de valeur par défaut silencieuse.
 */
function resolveParams(annee) {
    if (annee === 2026) {
        return fiscal_params_2026_js_2.FISCAL_PARAMS_2026;
    }
    return null;
}
//# sourceMappingURL=index.js.map