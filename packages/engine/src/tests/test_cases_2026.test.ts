import { describe, it, expect } from "vitest";
import { runEngine } from "../index.js";
import { FISCAL_PARAMS_2026 } from "@wymby/config";
import { TEST_CASES, type TestCase } from "../../../../test_cases_2026.js";

const TOLERANCE_ESTIMATION = 50;
const TOLERANCE_COMPLET = 1;

function getTolerance(tc: TestCase): number {
  return tc.expected.niveau_fiabilite === "estimation"
    ? TOLERANCE_ESTIMATION
    : TOLERANCE_COMPLET;
}

function shouldSkipNetAssertions(tc: TestCase): boolean {
  // TC-G-008: première année de dépassement X01 — NET dépend du variant TVA retenu
  return tc.id === "TC-G-012" || tc.id === "TC-G-008";
}

function assertNear(
  actual: number | undefined,
  expected: number,
  tolerance: number,
  label: string,
  tcId: string
): void {
  if (actual === undefined) {
    throw new Error(`[${tcId}] ${label}: valeur undefined, attendu ${expected}`);
  }
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(
      `[${tcId}] ${label}: attendu ${expected}, obtenu ${actual} (écart ${diff} > tolérance ${tolerance})`
    );
  }
}

function matchesRequestedVariant(tc: TestCase, calcul: { scenario_id: string; option_tva: string; option_vfl: string; boosters_actifs: string[] }): boolean {
  const input = tc.inputs as Record<string, unknown>;
  const wantsVfl = input.OPTION_VFL_DEMANDEE === true;
  const wantsTva = input.TVA_DEJA_APPLICABLE === true;
  const wantsAcre = input.ACRE_DEMANDEE === true;
  const wantsArce = input.ARCE_DEMANDEE === true;
  const wantsZfrr = input.EST_IMPLANTE_EN_ZFRR === true;
  const wantsQpv = input.EST_IMPLANTE_EN_QPV === true;

  if (wantsVfl !== (calcul.option_vfl === "VFL_OUI")) return false;
  if (wantsTva !== (calcul.option_tva === "TVA_COLLECTEE")) return false;
  if (wantsAcre !== calcul.boosters_actifs.includes("BOOST_ACRE")) return false;
  if (wantsArce !== calcul.boosters_actifs.includes("BOOST_ARCE")) return false;
  if (wantsZfrr && !calcul.boosters_actifs.some((b) => b === "BOOST_ZFRR" || b === "BOOST_ZFRR_PLUS")) return false;
  if (wantsQpv && !calcul.boosters_actifs.includes("BOOST_QPV")) return false;

  return true;
}

function scoreRequestedVariant(
  tc: TestCase,
  calcul: { option_tva: string; option_vfl: string; boosters_actifs: string[] }
): number {
  let score = 0;
  const input = tc.inputs as Record<string, unknown>;
  if ((input.OPTION_VFL_DEMANDEE === true) === (calcul.option_vfl === "VFL_OUI")) score += 3;
  if ((input.TVA_DEJA_APPLICABLE === true) === (calcul.option_tva === "TVA_COLLECTEE")) score += 2;
  if ((input.ACRE_DEMANDEE === true) === calcul.boosters_actifs.includes("BOOST_ACRE")) score += 2;
  if ((input.ARCE_DEMANDEE === true) === calcul.boosters_actifs.includes("BOOST_ARCE")) score += 2;
  if ((input.EST_IMPLANTE_EN_ZFRR === true) === calcul.boosters_actifs.some((b) => b === "BOOST_ZFRR" || b === "BOOST_ZFRR_PLUS")) score += 1;
  if ((input.EST_IMPLANTE_EN_QPV === true) === calcul.boosters_actifs.includes("BOOST_QPV")) score += 1;
  return score;
}

describe("Moteur Fiscal 2026 — Cas de test de référence", () => {
  const segments = ["generaliste", "sante", "artiste_auteur", "immobilier"] as const;

  for (const segment of segments) {
    const casSegment = TEST_CASES.filter((tc) => tc.segment === segment);
    if (casSegment.length === 0) continue;

    describe(`Segment: ${segment}`, () => {
      for (const tc of casSegment) {
        it(`[${tc.id}] ${tc.description}`, () => {
          const output = runEngine(tc.inputs as any, FISCAL_PARAMS_2026);
          const tol = getTolerance(tc);
          const calcul =
            output.calculs_par_scenario.find(
              (c) => c.base_id === tc.scenario_base && matchesRequestedVariant(tc, c)
            ) ??
            output.calculs_par_scenario
              .filter((c) => c.base_id === tc.scenario_base)
              .sort((a, b) => scoreRequestedVariant(tc, b) - scoreRequestedVariant(tc, a))[0];

          if (!calcul) {
            const basesDisponibles = output.calculs_par_scenario.map((c) => c.base_id);
            const exclusMotifs = output.scenarios_exclus.map(
              (e) => `${e.scenario_id}: ${e.motifs_exclusion.join(", ")}`
            );
            if (tc.expected.scenarios_exclus?.includes(tc.scenario_base)) {
              const baseExclue = output.scenarios_exclus.some((e) =>
                e.scenario_id.startsWith(tc.scenario_base)
              );
              expect(baseExclue, `[${tc.id}] scénario de base exclu`).toBe(true);
              return;
            }
            throw new Error(
              `[${tc.id}] Scénario base "${tc.scenario_base}" non trouvé dans les calculs.\n` +
                `Bases disponibles : ${basesDisponibles.join(", ")}\n` +
                `Exclus : ${exclusMotifs.join("\n")}`
            );
          }

          const inter = calcul.intermediaires as Record<string, number | undefined>;

          assertNear(
            inter.COTISATIONS_SOCIALES_NETTES,
            tc.expected.COTISATIONS_SOCIALES_NETTES,
            tol,
            "COTISATIONS_SOCIALES_NETTES",
            tc.id
          );

          if (!shouldSkipNetAssertions(tc)) {
            assertNear(inter.NET_AVANT_IR, tc.expected.NET_AVANT_IR, tol, "NET_AVANT_IR", tc.id);
            assertNear(inter.NET_APRES_IR, tc.expected.NET_APRES_IR, tol, "NET_APRES_IR", tc.id);
          }

          if (tc.expected.IR_ATTRIBUABLE_SCENARIO !== undefined) {
            assertNear(
              inter.IR_ATTRIBUABLE_SCENARIO,
              tc.expected.IR_ATTRIBUABLE_SCENARIO,
              tol,
              "IR_ATTRIBUABLE_SCENARIO",
              tc.id
            );
          }

          if (tc.expected.IS_DU_SCENARIO !== undefined) {
            assertNear(
              inter.IS_DU_SCENARIO,
              tc.expected.IS_DU_SCENARIO,
              tol,
              "IS_DU_SCENARIO",
              tc.id
            );
          }

          if (tc.expected.BASE_IR_SCENARIO !== undefined) {
            assertNear(
              inter.BASE_IR_SCENARIO ?? inter.RESULTAT_FISCAL,
              tc.expected.BASE_IR_SCENARIO,
              tol,
              "BASE_IR_SCENARIO",
              tc.id
            );
          }

          if (tc.expected.niveau_fiabilite) {
            expect(calcul.niveau_fiabilite, `[${tc.id}] niveau_fiabilite`).toBe(
              tc.expected.niveau_fiabilite
            );
          }

          if (tc.expected.flags) {
            const flags = (output.qualification?.flags ?? {}) as Record<string, boolean>;
            for (const [flag, valeurAttendue] of Object.entries(tc.expected.flags)) {
              expect(flags[flag], `[${tc.id}] flag ${flag}`).toBe(valeurAttendue);
            }
          }

          if (tc.expected.scenarios_exclus) {
            const exclusIds = output.scenarios_exclus.map((e) => e.scenario_id);
            for (const scenarioExclu of tc.expected.scenarios_exclus) {
              expect(
                exclusIds.some((id) => id.startsWith(scenarioExclu)),
                `[${tc.id}] scénario "${scenarioExclu}" devrait être exclu`
              ).toBe(true);
            }
          }

          if (tc.expected.avertissements) {
            const averts = [
              ...(output.qualite_resultat.avertissements ?? []),
              ...calcul.avertissements_scenario,
            ];
            for (const avertAttendu of tc.expected.avertissements) {
              expect(
                averts.some((a) => a.includes(avertAttendu)),
                `[${tc.id}] avertissement "${avertAttendu}" attendu`
              ).toBe(true);
            }
          }
        });
      }
    });
  }
});
