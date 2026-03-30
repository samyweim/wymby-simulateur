/**
 * @wymby/config — Configuration fiscale et paramétrages réglementaires
 *
 * Point d'entrée unique du package. Exporte les paramètres fiscaux 2026
 * et un utilitaire de résolution des paramètres par année.
 */
export { FISCAL_PARAMS_2026 } from "./fiscal_params_2026.js";
import { FISCAL_PARAMS_2026 } from "./fiscal_params_2026.js";
export type { TrancheIR, TrancheCotisation, PhaseExoneration, CotisationLigne, } from "./fiscal_params_2026.js";
/**
 * Résout les paramètres fiscaux pour une année donnée.
 * Retourne null si l'année n'est pas disponible — jamais de valeur par défaut silencieuse.
 */
export declare function resolveParams(annee: number): typeof FISCAL_PARAMS_2026 | null;
//# sourceMappingURL=index.d.ts.map