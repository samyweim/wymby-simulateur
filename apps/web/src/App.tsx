import { useState } from "react";
import type { EngineOutput } from "@wymby/types";
import { WizardShell } from "./wizard/WizardShell.js";
import { ResultsPage } from "./results/ResultsPage.js";

export default function App() {
  const [output, setOutput] = useState<EngineOutput | null>(null);

  if (output) {
    return <ResultsPage output={output} onRestart={() => setOutput(null)} />;
  }

  return <WizardShell onComplete={setOutput} />;
}
