import { useState } from "react";
import type { EngineOutput, UserInput } from "@wymby/types";
import { WizardShell } from "./wizard/WizardShell.js";
import { ResultsPage } from "./results/ResultsPage.js";
import { FiscalDecisionMap } from "./presentation/FiscalDecisionMap.js";
import { DebugPage } from "./pages/DebugPage.js";

export default function App() {
  const locationInfo =
    typeof window !== "undefined"
      ? {
          view: new URLSearchParams(window.location.search).get("view"),
          pathname: window.location.pathname,
          hash: window.location.hash,
        }
      : { view: null, pathname: "", hash: "" };
  const [output, setOutput] = useState<EngineOutput | null>(null);
  const [rawInput, setRawInput] = useState<UserInput | null>(null);

  if (locationInfo.view === "organigramme") {
    return <FiscalDecisionMap />;
  }

  if (
    import.meta.env.DEV &&
    (
      locationInfo.view === "debug" ||
      locationInfo.pathname === "/debug" ||
      locationInfo.hash === "#/debug"
    )
  ) {
    return <DebugPage />;
  }

  if (output) {
    return (
      <ResultsPage
        output={output}
        rawInput={rawInput ?? undefined}
        onRestart={() => { setOutput(null); setRawInput(null); }}
      />
    );
  }

  return (
    <WizardShell
      onComplete={(out, _logs, input) => {
        setOutput(out);
        setRawInput(input);
      }}
    />
  );
}
