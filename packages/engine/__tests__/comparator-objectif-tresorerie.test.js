"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const config_1 = require("@wymby/config");
const comparator_js_1 = require("../src/comparator.js");
function buildIntermediaires(overrides) {
    return {
        CA_HT_RETENU: 100_000,
        CA_TTC_RETENU: 100_000,
        TVA_COLLECTEE_THEORIQUE: 0,
        TVA_DEDUCTIBLE_RETENUE: 0,
        TVA_NETTE_DUE: 0,
        RECETTES_PRO_RETENUES: 100_000,
        ABATTEMENT_FORFAITAIRE: 0,
        CHARGES_DEDUCTIBLES: 0,
        DOTATIONS_AMORTISSEMENTS: 0,
        RESULTAT_COMPTABLE: 0,
        RESULTAT_FISCAL_AVANT_EXONERATIONS: 0,
        RESULTAT_FISCAL_APRES_EXONERATIONS: 0,
        ASSIETTE_SOCIALE_BRUTE: 0,
        ASSIETTE_SOCIALE_APRES_AIDES: 0,
        COTISATIONS_SOCIALES_BRUTES: 0,
        REDUCTION_ACRE: 0,
        AIDE_CPAM_IMPUTEE: 0,
        EXONERATION_SOCIALE_ZONE: 0,
        COTISATIONS_SOCIALES_NETTES: 0,
        REMUNERATION_DEDUCTIBLE: 0,
        REMUNERATION_NETTE_DIRIGEANT: 0,
        DIVIDENDES_DISTRIBUABLES: 0,
        DIVIDENDES_NETS_PERCUS: 0,
        BASE_IR_SCENARIO: 0,
        BASE_IR_FOYER_TOTALE: 0,
        IR_THEORIQUE_FOYER: 0,
        IR_ATTRIBUABLE_SCENARIO: 0,
        IS_DU_SCENARIO: 0,
        NET_AVANT_IR: 0,
        NET_APRES_IR: 0,
        COUT_TOTAL_SOCIAL_FISCAL: 0,
        SUPER_NET: 0,
        AIDE_ARCE_TRESORERIE: 0,
        ...overrides,
    };
}
function buildScenario(base_id, intermediaires) {
    return {
        scenario_id: `${base_id}__TEST`,
        base_id,
        option_tva: "TVA_FRANCHISE",
        option_vfl: "VFL_NON",
        boosters_actifs: [],
        intermediaires: buildIntermediaires(intermediaires),
        scores: {
            SCORE_COMPLEXITE_ADMIN: 0,
            SCORE_ROBUSTESSE: 0,
            DEPENDANCE_AIDES_RATIO: 0,
            SCORE_GLOBAL_SCENARIO: 0,
            TAUX_PRELEVEMENTS_GLOBAL: 0,
        },
        niveau_fiabilite: "complet",
        avertissements_scenario: [],
    };
}
function buildInput(objectif) {
    return {
        ANNEE_SIMULATION: 2026,
        SEGMENT_ACTIVITE: "generaliste",
        INPUT_MODE_CA: "HT",
        CA_ENCAISSE_UTILISATEUR: 100_000,
        SITUATION_FAMILIALE: "celibataire",
        OBJECTIF_TRESORERIE: objectif,
    };
}
(0, vitest_1.describe)("calculerScores - objectif tresorerie", () => {
    (0, vitest_1.it)("penalise un scenario IS complexe en mode flux_mensuel", () => {
        const isScenario = buildScenario("G_EURL_IS", {
            NET_APRES_IR: 75_000,
            COUT_TOTAL_SOCIAL_FISCAL: 25_000,
            REDUCTION_ACRE: 2_500,
            AIDE_ARCE_TRESORERIE: 5_000,
        });
        const eiScenario = buildScenario("G_EI_REEL_BNC_IR", {
            NET_APRES_IR: 55_000,
            COUT_TOTAL_SOCIAL_FISCAL: 45_000,
        });
        const isScores = (0, comparator_js_1.calculerScores)(isScenario, config_1.FISCAL_PARAMS_2026, buildInput("flux_mensuel"));
        const eiScores = (0, comparator_js_1.calculerScores)(eiScenario, config_1.FISCAL_PARAMS_2026, buildInput("flux_mensuel"));
        (0, vitest_1.expect)(isScores.SCORE_GLOBAL_SCENARIO).toBeLessThan(eiScores.SCORE_GLOBAL_SCENARIO);
    });
    (0, vitest_1.it)("favorise un scenario IS plus rentable en mode capitalisation", () => {
        const isScenario = buildScenario("G_EURL_IS", {
            NET_APRES_IR: 75_000,
            COUT_TOTAL_SOCIAL_FISCAL: 25_000,
            REDUCTION_ACRE: 2_500,
            AIDE_ARCE_TRESORERIE: 5_000,
        });
        const eiScenario = buildScenario("G_EI_REEL_BNC_IR", {
            NET_APRES_IR: 55_000,
            COUT_TOTAL_SOCIAL_FISCAL: 45_000,
        });
        const isScores = (0, comparator_js_1.calculerScores)(isScenario, config_1.FISCAL_PARAMS_2026, buildInput("capitalisation"));
        const eiScores = (0, comparator_js_1.calculerScores)(eiScenario, config_1.FISCAL_PARAMS_2026, buildInput("capitalisation"));
        (0, vitest_1.expect)(isScores.SCORE_GLOBAL_SCENARIO).toBeGreaterThan(eiScores.SCORE_GLOBAL_SCENARIO);
    });
    (0, vitest_1.it)("utilise les poids par defaut quand aucun objectif n'est fourni", () => {
        const scenario = buildScenario("G_EURL_IS", {
            NET_APRES_IR: 75_000,
            COUT_TOTAL_SOCIAL_FISCAL: 25_000,
            REDUCTION_ACRE: 2_500,
            AIDE_ARCE_TRESORERIE: 5_000,
        });
        const scores = (0, comparator_js_1.calculerScores)(scenario, config_1.FISCAL_PARAMS_2026, buildInput(undefined));
        const weights = config_1.FISCAL_PARAMS_2026.fiscal.CFG_POIDS_SCORE_GLOBAL.par_defaut;
        const netNormalise = 0.75;
        const complexiteNormalise = (4 - 1) / 4;
        const dependanceNormalise = 7_500 / 75_000;
        const robustesseNormalise = 0.75;
        const expected = weights.w_net * netNormalise -
            weights.w_complexite * complexiteNormalise -
            weights.w_dependance * dependanceNormalise +
            weights.w_robustesse * robustesseNormalise;
        (0, vitest_1.expect)(scores.SCORE_GLOBAL_SCENARIO).toBeCloseTo(expected, 8);
    });
});
//# sourceMappingURL=comparator-objectif-tresorerie.test.js.map