import { useMemo, useState } from "react";
import type { EngineOutput, EngineLog, DetailCalculScenario, IntermediairesCalcul, UserInput } from "@wymby/types";
import { FISCAL_PARAMS_2026 } from "@wymby/config";
import { runEngineWithLogs } from "@wymby/engine";
import { DebugPanel } from "../components/DebugPanel.js";
import { TEST_CASES, type TestCase } from "@test-cases";

type RunResult = {
  testCase: TestCase;
  output: EngineOutput;
  logs: EngineLog[];
  scenario?: DetailCalculScenario;
  checks: Array<{
    metric: string;
    expected: string;
    got: string;
    delta: string;
    ok: boolean;
  }>;
};

function formatAmount(value: number | undefined): string {
  if (value === undefined) return "—";
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)} €`;
}

function getTolerance(testCase: TestCase, metric: string, expectedValue: number): number {
  if (metric === "IR_ATTRIBUABLE_SCENARIO" && testCase.expected.niveau_fiabilite === "estimation") {
    return 200;
  }
  if (testCase.expected.niveau_fiabilite === "estimation") {
    return Math.max(1, expectedValue * 0.05);
  }
  return 1;
}

function evaluateCase(testCase: TestCase): RunResult {
  const [output, logs] = runEngineWithLogs(testCase.inputs as UserInput, FISCAL_PARAMS_2026);
  const scenario = output.calculs_par_scenario.find((entry) => entry.base_id === testCase.scenario_base);
  const checks: RunResult["checks"] = [];

  const expectedPairs: Array<[string, number | undefined]> = [
    ["COTISATIONS_SOCIALES_NETTES", testCase.expected.COTISATIONS_SOCIALES_NETTES],
    ["NET_AVANT_IR", testCase.expected.NET_AVANT_IR],
    ["NET_APRES_IR", testCase.expected.NET_APRES_IR],
    ["IR_ATTRIBUABLE_SCENARIO", testCase.expected.IR_ATTRIBUABLE_SCENARIO],
    ["BASE_IR_SCENARIO", testCase.expected.BASE_IR_SCENARIO],
  ];

  for (const [metric, expectedValue] of expectedPairs) {
    if (expectedValue === undefined) continue;
    const actualValue = scenario?.intermediaires[metric as keyof IntermediairesCalcul];
    const actualNumber = typeof actualValue === "number" ? actualValue : undefined;
    const delta = actualNumber === undefined ? Number.POSITIVE_INFINITY : actualNumber - expectedValue;
    const tolerance = getTolerance(testCase, metric, expectedValue);
    checks.push({
      metric,
      expected: formatAmount(expectedValue),
      got: formatAmount(actualNumber),
      delta: actualNumber === undefined ? "—" : formatAmount(delta),
      ok: actualNumber !== undefined && Math.abs(delta) <= tolerance,
    });
  }

  checks.push({
    metric: "niveau_fiabilite",
    expected: testCase.expected.niveau_fiabilite ?? "—",
    got: scenario?.niveau_fiabilite ?? "absent",
    delta: "—",
    ok:
      (testCase.expected.niveau_fiabilite ?? scenario?.niveau_fiabilite ?? "—") ===
      (scenario?.niveau_fiabilite ?? "absent"),
  });

  return { testCase, output, logs, scenario, checks };
}

export function DebugPage() {
  const groupedCases = useMemo(() => {
    return TEST_CASES.reduce<Record<string, TestCase[]>>((acc, testCase) => {
      acc[testCase.segment] ??= [];
      acc[testCase.segment].push(testCase);
      return acc;
    }, {});
  }, []);
  const [selectedId, setSelectedId] = useState(TEST_CASES[0]?.id ?? "");
  const [singleRun, setSingleRun] = useState<RunResult | null>(null);
  const [batchRuns, setBatchRuns] = useState<RunResult[] | null>(null);

  const selectedCase = TEST_CASES.find((testCase) => testCase.id === selectedId) ?? TEST_CASES[0];

  return (
    <div style={{ padding: "2rem", fontFamily: "Georgia, serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>Debug moteur fiscal</h1>
          <p style={{ marginTop: "0.5rem" }}>
            Vérification visuelle des cas de référence 2026 directement dans le navigateur.
          </p>
        </div>
        <a href="?" style={{ color: "#555" }}>
          Retour
        </a>
      </div>

      <section style={{ marginTop: "2rem", padding: "1rem", border: "1px solid #ddd", borderRadius: 12 }}>
        <label htmlFor="debug-test-case" style={{ display: "block", marginBottom: "0.5rem" }}>
          Cas de test
        </label>
        <select
          id="debug-test-case"
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          style={{ width: "100%", padding: "0.75rem", marginBottom: "1rem" }}
        >
          {Object.entries(groupedCases).map(([segment, cases]) => (
            <optgroup key={segment} label={segment}>
              {cases.map((testCase) => (
                <option key={testCase.id} value={testCase.id}>
                  {`${testCase.id} — ${testCase.description}`}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button type="button" onClick={() => selectedCase && setSingleRun(evaluateCase(selectedCase))}>
            Lancer ce cas
          </button>
          <button type="button" onClick={() => setBatchRuns(TEST_CASES.map(evaluateCase))}>
            Lancer tous les cas
          </button>
        </div>
      </section>

      {singleRun && (
        <section style={{ marginTop: "2rem" }}>
          <h2>{singleRun.testCase.id}</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Metric", "Expected", "Got", "Δ", "Status"].map((label) => (
                  <th key={label} style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "0.5rem" }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {singleRun.checks.map((check) => (
                <tr key={check.metric}>
                  <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>{check.metric}</td>
                  <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>{check.expected}</td>
                  <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>{check.got}</td>
                  <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>{check.delta}</td>
                  <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>{check.ok ? "✅" : "❌"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <details style={{ marginTop: "1rem" }} open>
            <summary>Scénarios calculés</summary>
            <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
              {singleRun.output.calculs_par_scenario.map((scenario) => (
                <details key={scenario.scenario_id}>
                  <summary>
                    {scenario.base_id} — {formatAmount(scenario.intermediaires.NET_APRES_IR)} —{" "}
                    {scenario.niveau_fiabilite}
                  </summary>
                  <pre style={{ whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(
                      {
                        avertissements_scenario: scenario.avertissements_scenario,
                        intermediaires: scenario.intermediaires,
                      },
                      null,
                      2
                    )}
                  </pre>
                </details>
              ))}
            </div>
          </details>

          <DebugPanel inputs={singleRun.output.inputs_normalises} logs={singleRun.logs} />
        </section>
      )}

      {batchRuns && (
        <section style={{ marginTop: "2rem" }}>
          <h2>Batch run</h2>
          <p>
            {batchRuns.filter((run) => run.checks.every((check) => check.ok)).length} / {batchRuns.length} cas validés
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["ID", "Description", "Status", "Failing metrics"].map((label) => (
                  <th key={label} style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "0.5rem" }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {batchRuns.map((run) => {
                const failing = run.checks.filter((check) => !check.ok).map((check) => check.metric);
                return (
                  <tr key={run.testCase.id}>
                    <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>{run.testCase.id}</td>
                    <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>{run.testCase.description}</td>
                    <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>
                      {failing.length === 0 ? "✅" : "❌"}
                    </td>
                    <td style={{ padding: "0.5rem", borderBottom: "1px solid #eee" }}>
                      {failing.length === 0 ? "—" : failing.join(", ")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
