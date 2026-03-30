"use strict";
/**
 * Tests unitaires — calculators/ir.ts
 *
 * Couvre : barème progressif, méthode différentielle, quotient familial,
 * cas sans données foyer (estimation), cas avec toutes les données (complet).
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const config_1 = require("@wymby/config");
// Import direct des fonctions — les fichiers .js sont les sources TypeScript compilés
// En contexte vitest + tsx, l'import .js fonctionne avec le source TypeScript
const irModule = await import("../../src/calculators/ir.js");
const { f_bareme_progressif, f_ir_attribuable_scenario } = irModule;
const P = config_1.FISCAL_PARAMS_2026;
(0, vitest_1.describe)("f_bareme_progressif", () => {
    (0, vitest_1.it)("Revenu nul → IR = 0", () => {
        const ir = f_bareme_progressif(0, 1, P);
        (0, vitest_1.expect)(ir).toBe(0);
    });
    (0, vitest_1.it)("Revenu très faible (en dessous première tranche) → IR = 0", () => {
        // Première tranche à 11_600 € (2026)
        const tranche0_fin = P.fiscal.CFG_BAREME_IR_TRANCHES[0]?.a ?? 11_600;
        const ir = f_bareme_progressif(tranche0_fin - 100, 1, P);
        (0, vitest_1.expect)(ir).toBe(0);
    });
    (0, vitest_1.it)("Revenu élevé → IR croissant avec le revenu", () => {
        const ir_50k = f_bareme_progressif(50_000, 1, P);
        const ir_100k = f_bareme_progressif(100_000, 1, P);
        (0, vitest_1.expect)(ir_100k).toBeGreaterThan(ir_50k);
    });
    (0, vitest_1.it)("Quotient familial 2 parts réduit l'IR vs 1 part", () => {
        const revenu = 80_000;
        const ir_1part = f_bareme_progressif(revenu, 1, P);
        const ir_2parts = f_bareme_progressif(revenu, 2, P);
        (0, vitest_1.expect)(ir_2parts).toBeLessThan(ir_1part);
    });
    (0, vitest_1.it)("Quotient familial : impôt × 1 part < 2 × (impôt ÷ 2 parts) — avantage QF", () => {
        const revenu = 70_000;
        const ir_1part = f_bareme_progressif(revenu, 1, P);
        const ir_2parts = f_bareme_progressif(revenu, 2, P);
        // Avec 2 parts, on calcule sur 35 000 € → *2, ce qui est inférieur à 1 part sur 70 000 €
        // Grâce à la progressivité
        (0, vitest_1.expect)(ir_2parts).toBeLessThanOrEqual(ir_1part);
    });
});
(0, vitest_1.describe)("f_ir_attribuable_scenario — méthode différentielle", () => {
    (0, vitest_1.it)("Sans autres revenus : mode estimation, avertissement émis", () => {
        const result = f_ir_attribuable_scenario(40_000, undefined, undefined, 1, P);
        (0, vitest_1.expect)(result.mode).toBe("estimation");
        // L'IR attribuable doit quand même être calculé (estimation fallback)
        (0, vitest_1.expect)(result.ir_attribuable_scenario).toBeGreaterThanOrEqual(0);
    });
    (0, vitest_1.it)("Avec autres revenus à 0 : mode complet, différentiel = IR sur revenu seul", () => {
        const base_scenario = 30_000;
        const result = f_ir_attribuable_scenario(base_scenario, 0, 0, 1, P);
        (0, vitest_1.expect)(result.mode).toBe("complet");
        // IR attribuable ≈ IR(30k + 0) - IR(0 + 0) = IR sur 30k
        const ir_direct = f_bareme_progressif(base_scenario, 1, P);
        (0, vitest_1.expect)(result.ir_attribuable_scenario).toBeCloseTo(ir_direct, 0);
    });
    (0, vitest_1.it)("Avec autres revenus positifs : méthode différentielle correcte", () => {
        const base_scenario = 30_000;
        const autres = 20_000;
        const result = f_ir_attribuable_scenario(base_scenario, autres, 0, 1, P);
        const ir_avec = f_bareme_progressif(base_scenario + autres, 1, P);
        const ir_sans = f_bareme_progressif(autres, 1, P);
        const delta = ir_avec - ir_sans;
        (0, vitest_1.expect)(result.mode).toBe("complet");
        (0, vitest_1.expect)(result.ir_attribuable_scenario).toBeCloseTo(delta, 0);
    });
    (0, vitest_1.it)("IR attribuable ne peut pas être négatif", () => {
        // Cas où le scénario réduit le revenu imposable (charges déductibles, etc.)
        const result = f_ir_attribuable_scenario(0, 50_000, 0, 1, P);
        (0, vitest_1.expect)(result.ir_attribuable_scenario).toBeGreaterThanOrEqual(0);
    });
    (0, vitest_1.it)("Plusieurs parts fiscales : IR réduit vs 1 part pour même revenu", () => {
        const base = 50_000;
        const autres = 10_000;
        const result_1part = f_ir_attribuable_scenario(base, autres, 0, 1, P);
        const result_2parts = f_ir_attribuable_scenario(base, autres, 0, 2, P);
        (0, vitest_1.expect)(result_2parts.ir_attribuable_scenario).toBeLessThan(result_1part.ir_attribuable_scenario);
    });
});
//# sourceMappingURL=ir.test.js.map