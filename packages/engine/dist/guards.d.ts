/**
 * guards.ts — Type guards et validateurs d'entrée
 */
import type { UserInput, SegmentActivite } from "@wymby/types";
/** Valide que les champs critiques minimum sont présents */
export declare function validateUserInput(input: UserInput): string[];
export declare function isSegmentActivite(val: string): val is SegmentActivite;
/** Vérifie si une date ISO est valide */
export declare function isValidISODate(val: string): boolean;
//# sourceMappingURL=guards.d.ts.map