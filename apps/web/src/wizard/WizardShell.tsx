import { useState } from "react";
import type { EngineOutput } from "@wymby/types";
import { runEngine } from "@wymby/engine";
import { ProgressBar } from "../components/ProgressBar.js";
import { Step0Profil } from "./steps/Step0Profil.js";
import { Step1Chiffres } from "./steps/Step1Chiffres.js";
import { Step2Foyer } from "./steps/Step2Foyer.js";
import { Step3Aides } from "./steps/Step3Aides.js";
import { mapWizardToUserInput } from "./mapper.js";
import { WIZARD_INITIAL_STATE } from "./types.js";
import type { WizardState } from "./types.js";
import "./WizardShell.css";

interface Props {
  onComplete: (output: EngineOutput) => void;
}

const STEP_LABELS = ["Activité", "Revenus", "Situation", "Aides"];

function canAdvance(step: number, state: WizardState): boolean {
  if (step === 0) return state.type_activite !== "";
  if (step === 1) return state.ca_annuel !== "" && parseFloat(state.ca_annuel) >= 0;
  if (step === 2) return state.situation_familiale !== "";
  return true;
}

export function WizardShell({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(WIZARD_INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function patch(p: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...p }));
  }

  async function handleNext() {
    if (step < 3) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Submit
      setLoading(true);
      setError(null);
      try {
        const input = mapWizardToUserInput(state);
        // Le moteur est synchrone — on wrap dans un setTimeout pour laisser le DOM se mettre à jour
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        const output = runEngine(input);
        onComplete(output);
      } catch (e) {
        setError("Une erreur est survenue lors du calcul. " + String(e));
      } finally {
        setLoading(false);
      }
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const ok = canAdvance(step, state);

  return (
    <div className="wizard-page">
      <header className="wizard-header">
        <div className="container">
          <div className="wizard-brand">
            <span className="brand-name">WYMBY</span>
            <span className="brand-tagline">Simulateur fiscal indépendants 2026</span>
          </div>
          <ProgressBar step={step} total={4} labels={STEP_LABELS} />
        </div>
      </header>

      <main className="wizard-main">
        <div className="container wizard-content">
          {step === 0 && <Step0Profil state={state} onChange={patch} />}
          {step === 1 && <Step1Chiffres state={state} onChange={patch} />}
          {step === 2 && <Step2Foyer state={state} onChange={patch} />}
          {step === 3 && <Step3Aides state={state} onChange={patch} />}

          {error && (
            <div className="wizard-error">
              {error}
            </div>
          )}
        </div>
      </main>

      <footer className="wizard-footer">
        <div className="container wizard-footer-inner">
          {step > 0 ? (
            <button className="btn btn-secondary" onClick={handleBack} disabled={loading}>
              ← Retour
            </button>
          ) : (
            <span />
          )}

          <div className="wizard-footer-right">
            <span className="wizard-step-counter">{step + 1} / 4</span>
            <button
              className="btn btn-primary"
              onClick={handleNext}
              disabled={!ok || loading}
            >
              {loading
                ? "Calcul en cours…"
                : step < 3
                ? "Continuer →"
                : "Calculer →"}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
