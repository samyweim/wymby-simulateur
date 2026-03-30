import { useState } from "react";
import type { EngineOutput, EngineLog } from "@wymby/types";
import { WizardShell } from "./wizard/WizardShell.js";
import { ResultsPage } from "./results/ResultsPage.js";

export default function App() {
  const [output, setOutput] = useState<EngineOutput | null>(null);
  const [debugLogs, setDebugLogs] = useState<EngineLog[]>([]);

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
