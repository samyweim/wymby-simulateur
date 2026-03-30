/**
 * filters/incompatibility-matrix.ts — Matrice des incompatibilités
 *
 * Vérifie les incompatibilités entre :
 * - Régime de base et options (micro/réel, VFL/réel, LMP/LMNP, etc.)
 * - Aides et boosters (non-cumul, conditions mutuellement exclusives)
 * - Conditions temporelles (IR temporaire, ZFU fermée)
 */
import type { ScenarioCandidat, ScenarioExclu, UserInput } from "@wymby/types";
import type { EngineLogger } from "../logger.js";
import type { FISCAL_PARAMS_2026 as FiscalParamsType } from "@wymby/config";
type FP = typeof FiscalParamsType;
/** Vérifie les incompatibilités de la matrice et retourne les scénarios exclus */
export declare function verifierIncompatibilites(scenarios: ScenarioCandidat[], input: UserInput, params: FP, logger: EngineLogger): {
    possibles: ScenarioCandidat[];
    exclus: ScenarioExclu[];
};
export {};
//# sourceMappingURL=incompatibility-matrix.d.ts.map