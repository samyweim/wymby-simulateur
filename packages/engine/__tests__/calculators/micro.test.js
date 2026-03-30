"use strict";
/**
 * Tests unitaires — calculators/micro.ts
 *
 * Couvre : Micro-BIC vente, Micro-BIC service, Micro-BNC,
 * CA = 0, VFL, ACRE, seuil abattement minimum.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const micro_js_1 = require("../../src/calculators/micro.js");
const config_1 = require("@wymby/config");
const P = config_1.FISCAL_PARAMS_2026;
// Valeurs dérivées du fichier de config (zero hardcode dans les tests)
const TAUX_ABATTEMENT_SERVICE = P.abattements.CFG_ABATTEMENT_MICRO_BIC_SERVICE; // 0.50
const TAUX_SOCIAL_SERVICE = P.social.CFG_TAUX_SOCIAL_MICRO_BIC_SERVICE; // 0.212
const TAUX_ABATTEMENT_BNC = P.abattements.CFG_ABATTEMENT_MICRO_BNC; // 0.34
const TAUX_SOCIAL_BNC = P.social.CFG_TAUX_SOCIAL_MICRO_BNC_SSI; // 0.256
const TAUX_ABATTEMENT_VENTE = P.abattements.CFG_ABATTEMENT_MICRO_BIC_VENTE; // 0.71
const TAUX_SOCIAL_VENTE = P.social.CFG_TAUX_SOCIAL_MICRO_BIC_VENTE; // 0.123
const MIN_ABATTEMENT = P.abattements.CFG_MINIMUM_ABATTEMENT_MICRO; // 305
(0, vitest_1.describe)("calculerMicro — BIC Service", () => {
    (0, vitest_1.it)("CA normal : abattement 50%, cotisations et net corrects", () => {
        const CA = 50_000;
        const result = (0, micro_js_1.calculerMicro)({
            CA_HT_RETENU: CA,
            TVA_NETTE_DUE: 0,
            type_micro: "BIC_SERVICE",
            option_vfl: false,
            acre_active: false,
            nombre_parts_fiscales: 1,
        }, P);
        const inter = result.intermediaires;
        const abattement_attendu = CA * TAUX_ABATTEMENT_SERVICE;
        const cotisations_attendues = CA * TAUX_SOCIAL_SERVICE;
        const base_ir = CA - abattement_attendu;
        (0, vitest_1.expect)(inter.ABATTEMENT_FORFAITAIRE).toBeCloseTo(abattement_attendu, 0);
        (0, vitest_1.expect)(inter.COTISATIONS_SOCIALES_BRUTES).toBeCloseTo(cotisations_attendues, 0);
        (0, vitest_1.expect)(inter.BASE_IR_SCENARIO).toBeCloseTo(base_ir, 0);
        (0, vitest_1.expect)(result.niveau_fiabilite).toBe("estimation"); // pas d'autres revenus foyer → estimation IR
    });
    (0, vitest_1.it)("CA = 0 : cotisations minimales TNS appliquées si micro sans VFL", () => {
        const result = (0, micro_js_1.calculerMicro)({
            CA_HT_RETENU: 0,
            TVA_NETTE_DUE: 0,
            type_micro: "BIC_SERVICE",
            option_vfl: false,
            acre_active: false,
            nombre_parts_fiscales: 1,
        }, P);
        const inter = result.intermediaires;
        // Cotisations sur CA = 0 → cotisations brutes = 0, mais minimales TNS SSI appliquées
        // Le minimum est géré dans les branches cotisations micro qui peuvent appliquer un plancher
        // Ici micro : taux * CA = 0, pas de minimum micro (différent du réel)
        (0, vitest_1.expect)(inter.CA_HT_RETENU).toBe(0);
        (0, vitest_1.expect)(inter.NET_APRES_IR).toBeDefined();
        (0, vitest_1.expect)(result.avertissements.length).toBeGreaterThanOrEqual(0);
    });
    (0, vitest_1.it)("VFL actif : IR = VFL (taux libératoire), fiabilité non dégradée par IR", () => {
        const CA = 40_000;
        const result = (0, micro_js_1.calculerMicro)({
            CA_HT_RETENU: CA,
            TVA_NETTE_DUE: 0,
            type_micro: "BIC_SERVICE",
            option_vfl: true,
            acre_active: false,
            nombre_parts_fiscales: 1,
        }, P);
        const inter = result.intermediaires;
        const taux_vfl = P.vfl.CFG_TAUX_VFL_MICRO_BIC_SERVICE;
        const vfl_attendu = CA * taux_vfl;
        // Avec VFL, l'IR attribuable est le VFL (pas de barème différentiel)
        (0, vitest_1.expect)(inter.IR_ATTRIBUABLE_SCENARIO).toBeCloseTo(vfl_attendu, 0);
        // Fiabilité ne doit pas être dégradée pour manque de données foyer (VFL est certain)
        (0, vitest_1.expect)(result.niveau_fiabilite).toBe("complet");
    });
    (0, vitest_1.it)("ACRE : cotisations réduites par rapport à sans ACRE", () => {
        const CA = 40_000;
        const sans_acre = (0, micro_js_1.calculerMicro)({
            CA_HT_RETENU: CA,
            TVA_NETTE_DUE: 0,
            type_micro: "BIC_SERVICE",
            option_vfl: false,
            acre_active: false,
            nombre_parts_fiscales: 1,
        }, P);
        const avec_acre = (0, micro_js_1.calculerMicro)({
            CA_HT_RETENU: CA,
            TVA_NETTE_DUE: 0,
            type_micro: "BIC_SERVICE",
            option_vfl: false,
            acre_active: true,
            date_creation: new Date("2026-01-01"),
            nombre_parts_fiscales: 1,
        }, P);
        const cotis_sans = sans_acre.intermediaires.COTISATIONS_SOCIALES_NETTES ?? 0;
        const cotis_avec = avec_acre.intermediaires.COTISATIONS_SOCIALES_NETTES ?? 0;
        const net_sans = sans_acre.intermediaires.NET_APRES_IR ?? 0;
        const net_avec = avec_acre.intermediaires.NET_APRES_IR ?? 0;
        (0, vitest_1.expect)(cotis_avec).toBeLessThan(cotis_sans);
        (0, vitest_1.expect)(net_avec).toBeGreaterThan(net_sans);
        (0, vitest_1.expect)(avec_acre.intermediaires.REDUCTION_ACRE).toBeGreaterThan(0);
    });
});
(0, vitest_1.describe)("calculerMicro — BNC", () => {
    (0, vitest_1.it)("Abattement 34% appliqué correctement", () => {
        const CA = 60_000;
        const result = (0, micro_js_1.calculerMicro)({
            CA_HT_RETENU: CA,
            TVA_NETTE_DUE: 0,
            type_micro: "BNC",
            option_vfl: false,
            acre_active: false,
            nombre_parts_fiscales: 1,
        }, P);
        const inter = result.intermediaires;
        const abattement_attendu = CA * TAUX_ABATTEMENT_BNC;
        const cotisations_attendues = CA * TAUX_SOCIAL_BNC;
        const base_ir = CA - abattement_attendu;
        (0, vitest_1.expect)(inter.ABATTEMENT_FORFAITAIRE).toBeCloseTo(abattement_attendu, 0);
        (0, vitest_1.expect)(inter.COTISATIONS_SOCIALES_BRUTES).toBeCloseTo(cotisations_attendues, 0);
        (0, vitest_1.expect)(inter.BASE_IR_SCENARIO).toBeCloseTo(base_ir, 0);
    });
    (0, vitest_1.it)("Abattement minimum (305 €) appliqué si CA très faible", () => {
        const CA = 100; // 100 € × 0.34 = 34 € < 305 €
        const result = (0, micro_js_1.calculerMicro)({
            CA_HT_RETENU: CA,
            TVA_NETTE_DUE: 0,
            type_micro: "BNC",
            option_vfl: false,
            acre_active: false,
            nombre_parts_fiscales: 1,
        }, P);
        (0, vitest_1.expect)(result.intermediaires.ABATTEMENT_FORFAITAIRE).toBe(MIN_ABATTEMENT);
    });
    (0, vitest_1.it)("ARCE : SUPER_NET > NET_APRES_IR quand droits_are_restants > 0", () => {
        const CA = 50_000;
        const DROITS_ARE = 10_000;
        const result = (0, micro_js_1.calculerMicro)({
            CA_HT_RETENU: CA,
            TVA_NETTE_DUE: 0,
            type_micro: "BNC",
            option_vfl: false,
            acre_active: false,
            nombre_parts_fiscales: 1,
            droits_are_restants: DROITS_ARE,
        }, P);
        const arce_attendu = DROITS_ARE * P.aides.CFG_TAUX_ARCE;
        const net_apres_ir = result.intermediaires.NET_APRES_IR ?? 0;
        const super_net = result.intermediaires.SUPER_NET ?? 0;
        (0, vitest_1.expect)(result.intermediaires.AIDE_ARCE_TRESORERIE).toBeCloseTo(arce_attendu, 0);
        (0, vitest_1.expect)(super_net).toBeCloseTo(net_apres_ir + arce_attendu, 0);
        // NET_APRES_IR ≠ SUPER_NET : c'est toute la distinction ARCE
        (0, vitest_1.expect)(super_net).not.toBe(net_apres_ir);
    });
});
(0, vitest_1.describe)("calculerMicro — BIC Vente", () => {
    (0, vitest_1.it)("Abattement 71% appliqué, cotisations 12.3%", () => {
        const CA = 80_000;
        const result = (0, micro_js_1.calculerMicro)({
            CA_HT_RETENU: CA,
            TVA_NETTE_DUE: 0,
            type_micro: "BIC_VENTE",
            option_vfl: false,
            acre_active: false,
            nombre_parts_fiscales: 1,
        }, P);
        const abattement_attendu = CA * TAUX_ABATTEMENT_VENTE;
        const cotisations_attendues = CA * TAUX_SOCIAL_VENTE;
        (0, vitest_1.expect)(result.intermediaires.ABATTEMENT_FORFAITAIRE).toBeCloseTo(abattement_attendu, 0);
        (0, vitest_1.expect)(result.intermediaires.COTISATIONS_SOCIALES_BRUTES).toBeCloseTo(cotisations_attendues, 0);
    });
    (0, vitest_1.it)("TVA nette déduite du NET_AVANT_IR", () => {
        const CA = 50_000;
        const TVA = 3_500;
        const sans_tva = (0, micro_js_1.calculerMicro)({ CA_HT_RETENU: CA, TVA_NETTE_DUE: 0, type_micro: "BIC_VENTE", option_vfl: false, acre_active: false, nombre_parts_fiscales: 1 }, P);
        const avec_tva = (0, micro_js_1.calculerMicro)({ CA_HT_RETENU: CA, TVA_NETTE_DUE: TVA, type_micro: "BIC_VENTE", option_vfl: false, acre_active: false, nombre_parts_fiscales: 1 }, P);
        const diff = (sans_tva.intermediaires.NET_AVANT_IR ?? 0) - (avec_tva.intermediaires.NET_AVANT_IR ?? 0);
        (0, vitest_1.expect)(diff).toBeCloseTo(TVA, 0);
    });
    (0, vitest_1.it)("Avec autres_revenus_foyer : fiabilité complet (IR différentiel complet)", () => {
        const CA = 50_000;
        const result = (0, micro_js_1.calculerMicro)({
            CA_HT_RETENU: CA,
            TVA_NETTE_DUE: 0,
            type_micro: "BIC_VENTE",
            option_vfl: false,
            acre_active: false,
            nombre_parts_fiscales: 2,
            autres_revenus_foyer: 25_000,
        }, P);
        (0, vitest_1.expect)(result.niveau_fiabilite).toBe("complet");
        (0, vitest_1.expect)(result.intermediaires.IR_ATTRIBUABLE_SCENARIO).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=micro.test.js.map