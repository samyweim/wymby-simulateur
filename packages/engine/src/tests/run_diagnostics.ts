import { runEngineWithLogs } from "../index.js";
import { FISCAL_PARAMS_2026 } from "@wymby/config";
import { TEST_CASES } from "../../../../test_cases_2026.js";
import { formatEngineLogs, filterLogs } from "../log-formatter.js";
import type { LogLevel } from "../logger.js";

const args = process.argv.slice(2);
const tcId = args.find((a) => a.startsWith("TC-"));
const traceMode = args.includes("--trace");
const level: LogLevel = traceMode ? "trace" : "debug";

const casAExecuter = tcId ? TEST_CASES.filter((tc) => tc.id === tcId) : TEST_CASES;

if (casAExecuter.length === 0) {
  console.error(`Cas de test "${tcId}" non trouvé.`);
  process.exit(1);
}

for (const tc of casAExecuter) {
  console.log(`\n${"═".repeat(72)}`);
  console.log(`🧪 ${tc.id} — ${tc.description}`);
  console.log(`   Scénario base : ${tc.scenario_base}`);
  console.log(`   Fiabilité attendue : ${tc.expected.niveau_fiabilite}`);
  console.log(`${"─".repeat(72)}`);

  const [output, logs] = runEngineWithLogs(tc.inputs as any, FISCAL_PARAMS_2026);
  console.log(formatEngineLogs(filterLogs(logs, level)));

  const calcul = output.calculs_par_scenario.find((c) => c.base_id === tc.scenario_base);
  if (!calcul) {
    console.log(`❌ Scénario "${tc.scenario_base}" absent des calculs.`);
    const exclus = output.scenarios_exclus.find((e) => e.scenario_id.startsWith(tc.scenario_base));
    if (exclus) {
      console.log(`   Exclus pour : ${exclus.motifs_exclusion.join(", ")}`);
    }
    continue;
  }

  const inter = calcul.intermediaires as Record<string, number | undefined>;
  const tol = tc.expected.niveau_fiabilite === "estimation" ? 50 : 1;

  const comparer = (
    label: string,
    obtenu: number | undefined,
    attendu: number | undefined
  ): void => {
    if (attendu === undefined) return;
    const diff = Math.abs((obtenu ?? 0) - attendu);
    const ok = diff <= tol;
    const icon = ok ? "✅" : "❌";
    const ecart = ok || obtenu === undefined ? "" : ` (écart: ${Math.round(obtenu - attendu)}€)`;
    console.log(
      `   ${icon} ${label.padEnd(35)} obtenu: ${String(Math.round(obtenu ?? 0)).padStart(8)}€   attendu: ${String(attendu).padStart(8)}€${ecart}`
    );
  };

  console.log(`\n📊 Comparaison des résultats (tolérance ±${tol}€) :`);
  comparer("COTISATIONS_SOCIALES_NETTES", inter.COTISATIONS_SOCIALES_NETTES, tc.expected.COTISATIONS_SOCIALES_NETTES);
  comparer("NET_AVANT_IR", inter.NET_AVANT_IR, tc.expected.NET_AVANT_IR);
  comparer("NET_APRES_IR", inter.NET_APRES_IR, tc.expected.NET_APRES_IR);
  comparer("IR_ATTRIBUABLE_SCENARIO", inter.IR_ATTRIBUABLE_SCENARIO, tc.expected.IR_ATTRIBUABLE_SCENARIO);
  comparer("IS_DU_SCENARIO", inter.IS_DU_SCENARIO, tc.expected.IS_DU_SCENARIO);
  comparer("BASE_IR_SCENARIO", inter.BASE_IR_SCENARIO ?? inter.RESULTAT_FISCAL, tc.expected.BASE_IR_SCENARIO);

  console.log(`\n📝 Notes de calcul :\n   ${tc.calcul_notes}`);
}
