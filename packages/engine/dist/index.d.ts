/**
 * packages/engine/src/index.ts — Point d'entrée du moteur fiscal WYMBY
 *
 * Pipeline d'exécution complet (ALGORITHME.md section 7) :
 *  1. Validation et normalisation des entrées
 *  2. Contrôles de cohérence préalables
 *  3. Qualification du segment et des flags
 *  4–7. Génération et filtrage des scénarios
 *  8–9. Suppression des incompatibilités
 *  10. Calcul scénario par scénario
 *  11. Comparaison et classement
 *  12. Construction de la sortie structurée
 */
import type { UserInput, EngineOutput } from "@wymby/types";
import { FISCAL_PARAMS_2026 } from "@wymby/config";
import type { EngineLog } from "./logger.js";
import { formatEngineLogs, filterLogs, filterLogsByScenario, summarizeLogs } from "./log-formatter.js";
type FP = typeof FISCAL_PARAMS_2026;
/**
 * Exécute le moteur d'arbitrage fiscal complet.
 *
 * @param input — Données utilisateur normalisées
 * @param params — Paramètres fiscaux (défaut : FISCAL_PARAMS_2026)
 * @param debugMode — Active les logs structurés (défaut : false)
 */
export declare function runEngine(input: UserInput, params?: FP, debugMode?: boolean): EngineOutput;
/**
 * Exécute le moteur et retourne aussi les logs DEBUG.
 * Usage test : `const [output, logs] = runEngineWithLogs(input, params);`
 */
export declare function runEngineWithLogs(input: UserInput, params?: FP): [EngineOutput, EngineLog[]];
export { FISCAL_PARAMS_2026 };
export { formatEngineLogs, filterLogs, filterLogsByScenario, summarizeLogs };
export type { EngineOutput, UserInput, EngineLog };
export type { LogLevel } from "./logger.js";
//# sourceMappingURL=index.d.ts.map