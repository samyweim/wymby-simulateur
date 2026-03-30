"use strict";
/**
 * Tests unitaires — calculators/cotisations-tns.ts
 *
 * Couvre : ASU 2026 (plancher/plafond/abattement), cotisations branches TNS,
 * cotisations minimales (résultat nul), ACRE hors micro dégressif.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const config_1 = require("@wymby/config");
const cotisModule = await import("../../src/calculators/cotisations-tns.js");
const { f_assiette_sociale_ASU, f_cotisations_tns_bic, f_acre_hors_micro } = cotisModule;
const P = config_1.FISCAL_PARAMS_2026;
const PASS = P.referentiels.CFG_PASS_2026; // 48_060
(0, vitest_1.describe)("f_assiette_sociale_ASU — Assiette Sociale Unique 2026", () => {
    (0, vitest_1.it)("Revenu nul : assiette = plancher ASU", () => {
        const result = f_assiette_sociale_ASU(0, P);
        const plancher = P.social.CFG_REGLES_ASSIETTE_SOCIALE_UNIQUE_IR.plancher.valeur_2026;
        (0, vitest_1.expect)(result.assiette).toBeCloseTo(plancher, 0);
        (0, vitest_1.expect)(result.hypothese).toBeDefined(); // plancher appliqué → hypothèse émise
    });
    (0, vitest_1.it)("Revenu normal : assiette = revenu × abattement (74%)", () => {
        const revenu = 50_000;
        const result = f_assiette_sociale_ASU(revenu, P);
        const abattement = P.social.CFG_REGLES_ASSIETTE_SOCIALE_UNIQUE_IR.abattement_forfaitaire;
        const assiette_attendue = revenu * (1 - abattement);
        (0, vitest_1.expect)(result.assiette).toBeCloseTo(assiette_attendue, 0);
    });
    (0, vitest_1.it)("Revenu très élevé : assiette plafonnée à 130% PASS", () => {
        const revenu = 500_000;
        const result = f_assiette_sociale_ASU(revenu, P);
        const plafond = P.social.CFG_REGLES_ASSIETTE_SOCIALE_UNIQUE_IR.plafond.valeur_2026;
        (0, vitest_1.expect)(result.assiette).toBeCloseTo(plafond, 0);
    });
});
(0, vitest_1.describe)("f_cotisations_tns_bic — Calcul branches TNS", () => {
    (0, vitest_1.it)("Assiette nulle : cotisations minimales appliquées avec avertissement", () => {
        const result = f_cotisations_tns_bic(0, P);
        const minimum = P.social.CFG_COTISATIONS_MINIMALES_TNS_SSI.total_minimal_hors_cfp;
        (0, vitest_1.expect)(result.cotisations_brutes).toBeGreaterThanOrEqual(minimum);
        (0, vitest_1.expect)(result.cotisations_minimales_appliquees).toBe(true);
        (0, vitest_1.expect)(result.avertissement_minimales).toBeDefined();
    });
    (0, vitest_1.it)("Assiette normale : cotisations proportionnelles croissantes avec l'assiette", () => {
        const cotis_30k = f_cotisations_tns_bic(30_000, P);
        const cotis_60k = f_cotisations_tns_bic(60_000, P);
        (0, vitest_1.expect)(cotis_60k.cotisations_brutes).toBeGreaterThan(cotis_30k.cotisations_brutes);
    });
    (0, vitest_1.it)("Assiette = PASS : cotisations dans une fourchette raisonnable (30-50%)", () => {
        const result = f_cotisations_tns_bic(PASS, P);
        const taux_effectif = result.cotisations_brutes / PASS;
        // TNS : environ 35-45% de cotisations sur PASS
        (0, vitest_1.expect)(taux_effectif).toBeGreaterThan(0.25);
        (0, vitest_1.expect)(taux_effectif).toBeLessThan(0.55);
    });
    (0, vitest_1.it)("Résultat fiscal négatif → cotisations minimales TNS (1 135 €)", () => {
        // Assiette négative → 0 → minimales
        const result = f_cotisations_tns_bic(-5_000, P);
        const minimum = P.social.CFG_COTISATIONS_MINIMALES_TNS_SSI.total_minimal_hors_cfp;
        (0, vitest_1.expect)(result.cotisations_brutes).toBeGreaterThanOrEqual(minimum);
        (0, vitest_1.expect)(result.cotisations_minimales_appliquees).toBe(true);
    });
});
(0, vitest_1.describe)("f_acre_hors_micro — Réduction ACRE dégressive", () => {
    (0, vitest_1.it)("Avant 01/07/2026 : taux max = 50%", () => {
        const cotis = 10_000;
        const assiette = PASS * 0.5; // bien en dessous du seuil bas
        const dateAvant = new Date("2026-01-15");
        const reduction = f_acre_hors_micro(cotis, assiette, P, dateAvant);
        const taux_max = P.aides.CFG_TAUX_REDUCTION_ACRE_HORS_MICRO.taux_max_avant_01_07_2026; // 0.50
        (0, vitest_1.expect)(reduction).toBeCloseTo(cotis * taux_max, 0);
    });
    (0, vitest_1.it)("Après 01/07/2026 : taux max = 25%", () => {
        const cotis = 10_000;
        const assiette = PASS * 0.5;
        const dateApres = new Date("2026-09-01");
        const reduction = f_acre_hors_micro(cotis, assiette, P, dateApres);
        const taux_max = P.aides.CFG_TAUX_REDUCTION_ACRE_HORS_MICRO.taux_max_apres_01_07_2026; // 0.25
        (0, vitest_1.expect)(reduction).toBeCloseTo(cotis * taux_max, 0);
    });
    (0, vitest_1.it)("Sans date : taux avant 01/07/2026 appliqué par défaut", () => {
        const cotis = 8_000;
        const assiette = PASS * 0.4;
        const reduction_sans_date = f_acre_hors_micro(cotis, assiette, P, undefined);
        const taux_max = P.aides.CFG_TAUX_REDUCTION_ACRE_HORS_MICRO.taux_max_avant_01_07_2026;
        (0, vitest_1.expect)(reduction_sans_date).toBeCloseTo(cotis * taux_max, 0);
    });
    (0, vitest_1.it)("Assiette au-delà du seuil exonération totale : réduction dégressive", () => {
        const cotis = 20_000;
        const assiette_haute = PASS * 0.9; // proche du plafond → réduction réduite
        const assiette_basse = PASS * 0.3; // bien en dessous → réduction pleine
        const date = new Date("2026-01-01");
        const reduction_haute = f_acre_hors_micro(cotis, assiette_haute, P, date);
        const reduction_basse = f_acre_hors_micro(cotis, assiette_basse, P, date);
        // La réduction doit être plus faible pour une assiette haute (dégressive vers 0 à 100% PASS)
        (0, vitest_1.expect)(reduction_haute).toBeLessThanOrEqual(reduction_basse);
    });
});
//# sourceMappingURL=cotisations-tns.test.js.map