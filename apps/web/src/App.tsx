import { useState } from "react";
import type { EngineOutput, EngineLog } from "@wymby/types";
import { WizardShell } from "./wizard/WizardShell.js";
import { ResultsPage } from "./results/ResultsPage.js";
import { FiscalDecisionMap } from "./presentation/FiscalDecisionMap.js";

export default function App() {
  const view =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("view")
      : null;
  const [output, setOutput] = useState<EngineOutput | null>(null);
  const [debugLogs, setDebugLogs] = useState<EngineLog[]>([]);

  if (view === "organigramme") {
    return <FiscalDecisionMap />;
  }

  if (output) {
    return (
      <ResultsPage
        output={output}
        debugLogs={debugLogs}
        onRestart={() => { setOutput(null); setDebugLogs([]); }}
      />
    );
  }

  return (
    <WizardShell
      onComplete={(out, logs) => {
        setOutput(out);
        setDebugLogs(logs);
      }}
    />
  );
}
