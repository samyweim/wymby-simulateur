"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const config_1 = require("@wymby/config");
const index_js_1 = require("../src/index.js");
const test_cases_2026_js_1 = require("../../../test_cases_2026.js");
const healthCases = test_cases_2026_js_1.TEST_CASES.filter((testCase) => testCase.segment === "sante");
function findScenario(output, testCase) {
    return output.calculs_par_scenario.find((scenario) => scenario.base_id === testCase.scenario_base);
}
function expectNearPercent(actual, expected, percent, label) {
    (0, vitest_1.expect)(actual, `${label} should be defined`).not.toBeUndefined();
    const tolerance = Math.max(1, Math.abs(expected) * percent);
    (0, vitest_1.expect)(Math.abs((actual ?? 0) - expected), label).toBeLessThanOrEqual(tolerance);
}
function expectNearAmount(actual, expected, tolerance, label) {
    (0, vitest_1.expect)(actual, `${label} should be defined`).not.toBeUndefined();
    (0, vitest_1.expect)(Math.abs((actual ?? 0) - expected), label).toBeLessThanOrEqual(tolerance);
}
(0, vitest_1.describe)("Health scenarios S01-S09", () => {
    for (const testCase of healthCases) {
        (0, vitest_1.it)(testCase.description, () => {
            const output = (0, index_js_1.runEngine)(testCase.inputs, config_1.FISCAL_PARAMS_2026);
            if (testCase.expected.scenarios_exclus?.includes(testCase.scenario_base)) {
                const excluded = output.scenarios_exclus.find((scenario) => scenario.base_id === testCase.scenario_base);
                (0, vitest_1.expect)(excluded, `${testCase.id} should be excluded`).toBeTruthy();
                return;
            }
            const scenario = findScenario(output, testCase);
            (0, vitest_1.expect)(scenario, `${testCase.id} should produce ${testCase.scenario_base}`).toBeTruthy();
            const inter = scenario?.intermediaires;
            (0, vitest_1.expect)(inter?.BASE_IR_SCENARIO).toBe(testCase.expected.BASE_IR_SCENARIO);
            expectNearPercent(inter?.COTISATIONS_SOCIALES_NETTES, testCase.expected.COTISATIONS_SOCIALES_NETTES, 0.05, `${testCase.id} cotisations`);
            if (testCase.expected.IR_ATTRIBUABLE_SCENARIO !== undefined) {
                expectNearAmount(inter?.IR_ATTRIBUABLE_SCENARIO, testCase.expected.IR_ATTRIBUABLE_SCENARIO, 200, `${testCase.id} IR`);
            }
            expectNearPercent(inter?.NET_APRES_IR, testCase.expected.NET_APRES_IR, 0.05, `${testCase.id} net apres IR`);
            if (testCase.expected.niveau_fiabilite) {
                (0, vitest_1.expect)(scenario?.niveau_fiabilite).toBe(testCase.expected.niveau_fiabilite);
            }
            if (testCase.expected.flags) {
                const flags = output.qualification.flags;
                for (const [flag, expected] of Object.entries(testCase.expected.flags)) {
                    (0, vitest_1.expect)(flags[flag], `${testCase.id} flag ${flag}`).toBe(expected);
                }
            }
            if (testCase.expected.avertissements) {
                const warnings = [
                    ...output.qualite_resultat.avertissements,
                    ...(scenario?.avertissements_scenario ?? []),
                ];
                for (const warning of testCase.expected.avertissements) {
                    (0, vitest_1.expect)(warnings.some((value) => value.includes(warning)), `${testCase.id} warning ${warning}`).toBe(true);
                }
            }
        });
    }
    (0, vitest_1.it)("excludes S_RSPM above the regulatory ceiling", () => {
        const output = (0, index_js_1.runEngine)({
            ANNEE_SIMULATION: "2026",
            SEGMENT_ACTIVITE: "sante",
            SOUS_SEGMENT_ACTIVITE: "medecin",
            CA_ENCAISSE_UTILISATEUR: 45_000,
            INPUT_MODE_CA: "HT",
            EST_PROFESSION_SANTE: true,
            EST_REMPLACANT: true,
            EST_CONVENTIONNE: true,
            EST_ELIGIBLE_AIDE_CPAM: true,
            SECTEUR_CONVENTIONNEL: "secteur_1",
            SITUATION_FAMILIALE: "celibataire",
            NOMBRE_PARTS_FISCALES: 1,
        }, config_1.FISCAL_PARAMS_2026);
        (0, vitest_1.expect)(output.calculs_par_scenario.some((scenario) => scenario.base_id === "S_RSPM")).toBe(false);
        const excluded = output.scenarios_exclus.find((scenario) => scenario.base_id === "S_RSPM");
        (0, vitest_1.expect)(excluded).toBeTruthy();
        (0, vitest_1.expect)(excluded?.motifs_exclusion).toContain("FLAG_RSPM_DEPASSEMENT_SEUIL");
        (0, vitest_1.expect)(excluded?.motifs_exclusion).toContain("BASCULE_PAMC_AU_1ER_JANVIER_N_PLUS_1");
    });
});
//# sourceMappingURL=health_scenarios.test.js.map