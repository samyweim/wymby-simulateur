"use strict";
/**
 * Tests unitaires — calculators/ei-reel.ts
 *
 * Couvre : BIC IR, BIC IS, BNC IR, résultat négatif (cotisations minimales),
 * ACRE, TVA, fiabilité partielle/estimation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ei_reel_js_1 = require("../../src/calculators/ei-reel.js");
const config_1 = require("@wymby/config");
const P = config_1.FISCAL_PARAMS_2026;
const BASE_INPUT = {
    RECETTES_PRO_RETENUES: 60_000,
    CHARGES_DECAISSEES: 15_000,
    CHARGES_DEDUCTIBLES: 15_000,
    TVA_NETTE_DUE: 0,
    nombre_parts_fiscales: 1,
};
(0, vitest_1.describe)("calculerEIReel — BIC IR", () => {
    (0, vitest_1.it)("Résultat comptable = recettes - charges déductibles", () => {
        const result = (0, ei_reel_js_1.calculerEIReel)({ ...BASE_INPUT, type_ei: "BIC_IR" }, P);
        const rc = result.intermediaires.RESULTAT_COMPTABLE;
        (0, vitest_1.expect)(rc).toBeCloseTo(BASE_INPUT.RECETTES_PRO_RETENUES - BASE_INPUT.CHARGES_DEDUCTIBLES, 0);
    });
    (0, vitest_1.it)("Sans autres revenus foyer : fiabilité = estimation", () => {
        const result = (0, ei_reel_js_1.calculerEIReel)({ ...BASE_INPUT, type_ei: "BIC_IR" }, P);
        (0, vitest_1.expect)(result.niveau_fiabilite).toBe("estimation");
    });
    (0, vitest_1.it)("Avec autres revenus foyer : fiabilité au moins partiel", () => {
        const result = (0, ei_reel_js_1.calculerEIReel)({ ...BASE_INPUT, type_ei: "BIC_IR", autres_revenus_foyer: 20_000 }, P);
        // ASU 2026 reform has an open TODO ambiguity → fiabilité stays at "estimation" or "partiel"
        // It must not be "complet" until the ASU rules are fully confirmed.
        (0, vitest_1.expect)(result.niveau_fiabilite).not.toBe("complet");
    });
    (0, vitest_1.it)("ACRE réduit les cotisations nettes", () => {
        const sans = (0, ei_reel_js_1.calculerEIReel)({ ...BASE_INPUT, type_ei: "BIC_IR" }, P);
        const avec = (0, ei_reel_js_1.calculerEIReel)({ ...BASE_INPUT, type_ei: "BIC_IR", acre_active: true, date_creation: new Date("2026-01-01") }, P);
        (0, vitest_1.expect)(avec.intermediaires.COTISATIONS_SOCIALES_NETTES).toBeLessThan(sans.intermediaires.COTISATIONS_SOCIALES_NETTES);
    });
    (0, vitest_1.it)("Résultat fiscal négatif : cotisations minimales TNS appliquées", () => {
        const result = (0, ei_reel_js_1.calculerEIReel)({
            RECETTES_PRO_RETENUES: 5_000,
            CHARGES_DECAISSEES: 30_000,
            CHARGES_DEDUCTIBLES: 30_000,
            TVA_NETTE_DUE: 0,
            type_ei: "BIC_IR",
            nombre_parts_fiscales: 1,
            autres_revenus_foyer: 0,
        }, P);
        const minimum = P.social.CFG_COTISATIONS_MINIMALES_TNS_SSI.total_minimal_hors_cfp;
        (0, vitest_1.expect)(result.intermediaires.COTISATIONS_SOCIALES_BRUTES).toBeGreaterThanOrEqual(minimum);
        (0, vitest_1.expect)(result.avertissements.some((a) => a.toLowerCase().includes("minimal"))).toBe(true);
    });
});
(0, vitest_1.describe)("calculerEIReel — BIC IS", () => {
    (0, vitest_1.it)("IS calculé sur le résultat après rémunération dirigeant", () => {
        const result = (0, ei_reel_js_1.calculerEIReel)({
            ...BASE_INPUT,
            type_ei: "BIC_IS",
            remuneration_dirigeant: 20_000,
            autres_revenus_foyer: 0,
        }, P);
        // Résultat comptable = recettes - charges - rémunération
        const rc_attendu = BASE_INPUT.RECETTES_PRO_RETENUES -
            BASE_INPUT.CHARGES_DEDUCTIBLES -
            20_000;
        (0, vitest_1.expect)(result.intermediaires.RESULTAT_COMPTABLE).toBeCloseTo(rc_attendu, 0);
        (0, vitest_1.expect)(result.intermediaires.IS_DU_SCENARIO).toBeGreaterThan(0);
        (0, vitest_1.expect)(result.intermediaires.IR_ATTRIBUABLE_SCENARIO).toBeGreaterThanOrEqual(0);
    });
    (0, vitest_1.it)("ARCE : SUPER_NET ≠ NET_APRES_IR quand droits ARE présents", () => {
        const DROITS = 8_000;
        const result = (0, ei_reel_js_1.calculerEIReel)({
            ...BASE_INPUT,
            type_ei: "BIC_IS",
            remuneration_dirigeant: 25_000,
            autres_revenus_foyer: 0,
            droits_are_restants: DROITS,
        }, P);
        const arce = result.intermediaires.AIDE_ARCE_TRESORERIE ?? 0;
        const expected_arce = DROITS * P.aides.CFG_TAUX_ARCE;
        (0, vitest_1.expect)(arce).toBeCloseTo(expected_arce, 0);
        (0, vitest_1.expect)(result.intermediaires.SUPER_NET).toBeCloseTo((result.intermediaires.NET_APRES_IR ?? 0) + arce, 0);
    });
});
(0, vitest_1.describe)("calculerEIReel — BNC IR", () => {
    (0, vitest_1.it)("Mêmes règles que BIC IR pour résultat fiscal", () => {
        const result_bic = (0, ei_reel_js_1.calculerEIReel)({ ...BASE_INPUT, type_ei: "BIC_IR", autres_revenus_foyer: 0 }, P);
        const result_bnc = (0, ei_reel_js_1.calculerEIReel)({ ...BASE_INPUT, type_ei: "BNC_IR", autres_revenus_foyer: 0 }, P);
        // Résultat comptable identique (même charges)
        (0, vitest_1.expect)(result_bnc.intermediaires.RESULTAT_COMPTABLE).toBeCloseTo(result_bic.intermediaires.RESULTAT_COMPTABLE, 0);
    });
    (0, vitest_1.it)("Charges nulles : avertissement émis et fiabilité dégradée", () => {
        const result = (0, ei_reel_js_1.calculerEIReel)({
            RECETTES_PRO_RETENUES: 40_000,
            CHARGES_DECAISSEES: 0,
            CHARGES_DEDUCTIBLES: 0,
            TVA_NETTE_DUE: 0,
            type_ei: "BNC_IR",
            nombre_parts_fiscales: 1,
            // Sans autres_revenus_foyer → IR mode estimation → fiabilité "estimation"
        }, P);
        (0, vitest_1.expect)(result.avertissements.some((a) => a.toLowerCase().includes("charges nulles"))).toBe(true);
        // Fiabilité dégradée (partiel ou estimation selon les données manquantes)
        (0, vitest_1.expect)(result.niveau_fiabilite).not.toBe("complet");
    });
});
//# sourceMappingURL=ei-reel.test.js.map