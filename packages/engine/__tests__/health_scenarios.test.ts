import { describe, expect, it } from "vitest";
import type { DetailCalculScenario, IntermediairesCalcul, UserInput } from "@wymby/types";
import { FISCAL_PARAMS_2026 } from "@wymby/config";
import { runEngine } from "../src/index.js";
import { TEST_CASES, type TestCase } from "../../../test_cases_2026.js";

const healthCases = TEST_CASES.filter((testCase) => testCase.segment === "sante");

function findScenario(output: ReturnType<typeof runEngine>, testCase: TestCase): DetailCalculScenario | undefined {
  return output.calculs_par_scenario.find((scenario) => scenario.base_id === testCase.scenario_base);
}

function expectNearPercent(actual: number | undefined, expected: number, percent: number, label: string): void {
  expect(actual, `${label} should be defined`).not.toBeUndefined();
  const tolerance = Math.max(1, Math.abs(expected) * percent);
  expect(Math.abs((actual ?? 0) - expected), label).toBeLessThanOrEqual(tolerance);
}

function expectNearAmount(actual: number | undefined, expected: number, tolerance: number, label: string): void {
  expect(actual, `${label} should be defined`).not.toBeUndefined();
  expect(Math.abs((actual ?? 0) - expected), label).toBeLessThanOrEqual(tolerance);
}

describe("Health scenarios S01-S09", () => {
  for (const testCase of healthCases) {
    it(testCase.description, () => {
      const output = runEngine(testCase.inputs as UserInput, FISCAL_PARAMS_2026);

      if (testCase.expected.scenarios_exclus?.includes(testCase.scenario_base)) {
        const excluded = output.scenarios_exclus.find((scenario) => scenario.base_id === testCase.scenario_base);
        expect(excluded, `${testCase.id} should be excluded`).toBeTruthy();
        return;
      }

      const scenario = findScenario(output, testCase);
      expect(scenario, `${testCase.id} should produce ${testCase.scenario_base}`).toBeTruthy();

      const inter = scenario?.intermediaires as IntermediairesCalcul | undefined;
      expect(inter?.BASE_IR_SCENARIO).toBe(testCase.expected.BASE_IR_SCENARIO);

      expectNearPercent(
        inter?.COTISATIONS_SOCIALES_NETTES,
        testCase.expected.COTISATIONS_SOCIALES_NETTES,
        0.05,
        `${testCase.id} cotisations`
      );

      if (testCase.expected.IR_ATTRIBUABLE_SCENARIO !== undefined) {
        expectNearAmount(
          inter?.IR_ATTRIBUABLE_SCENARIO,
          testCase.expected.IR_ATTRIBUABLE_SCENARIO,
          200,
          `${testCase.id} IR`
        );
      }

      expectNearPercent(
        inter?.NET_APRES_IR,
        testCase.expected.NET_APRES_IR,
        0.05,
        `${testCase.id} net apres IR`
      );

      if (testCase.expected.niveau_fiabilite) {
        expect(scenario?.niveau_fiabilite).toBe(testCase.expected.niveau_fiabilite);
      }

      if (testCase.expected.flags) {
        const flags = output.qualification.flags as Record<string, boolean>;
        for (const [flag, expected] of Object.entries(testCase.expected.flags)) {
          expect(flags[flag], `${testCase.id} flag ${flag}`).toBe(expected);
        }
      }

      if (testCase.expected.avertissements) {
        const warnings = [
          ...output.qualite_resultat.avertissements,
          ...(scenario?.avertissements_scenario ?? []),
        ];
        for (const warning of testCase.expected.avertissements) {
          expect(
            warnings.some((value) => value.includes(warning)),
            `${testCase.id} warning ${warning}`
          ).toBe(true);
        }
      }
    });
  }

  it("excludes S_RSPM above the regulatory ceiling", () => {
    const output = runEngine(
      {
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
      } as UserInput,
      FISCAL_PARAMS_2026
    );

    expect(output.calculs_par_scenario.some((scenario) => scenario.base_id === "S_RSPM")).toBe(false);
    const excluded = output.scenarios_exclus.find((scenario) => scenario.base_id === "S_RSPM");
    expect(excluded).toBeTruthy();
    expect(excluded?.motifs_exclusion).toContain("FLAG_RSPM_DEPASSEMENT_SEUIL");
    expect(excluded?.motifs_exclusion).toContain("BASCULE_PAMC_AU_1ER_JANVIER_N_PLUS_1");
  });
});
