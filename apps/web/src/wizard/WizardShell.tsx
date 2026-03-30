import { useEffect, useState } from "react";
import type { EngineOutput, EngineLog } from "@wymby/types";
import { runEngineWithLogs } from "@wymby/engine";
import { ProgressBar } from "../components/ProgressBar.js";
import { CalculSkeleton } from "../components/CalculSkeleton.js";
import { Step0Profil } from "./steps/Step0Profil.js";
import { Step1Chiffres } from "./steps/Step1Chiffres.js";
import { Step2Foyer } from "./steps/Step2Foyer.js";
import { Step3Aides } from "./steps/Step3Aides.js";
import { mapWizardToUserInput } from "./mapper.js";
import { WIZARD_INITIAL_STATE } from "./types.js";
import type { WizardState } from "./types.js";
import "./WizardShell.css";

interface Props {
  onComplete: (output: EngineOutput, logs: EngineLog[]) => void;
}

const STEP_LABELS = ["Activité", "Revenus", "Situation", "Aides"];
const STORAGE_KEY = "wymby_wizard_state";

function canAdvance(step: number, state: WizardState): boolean {
  if (step === 0) {
    const santeOk =
      !["sante_medecin", "sante_paramedicale"].includes(state.type_activite) ||
      state.secteur_conventionnel !== "";
    const activiteOk =
      state.est_deja_en_activite !== true ||
      (state.mois_debut_activite !== "" && state.annee_debut_activite !== "");
    return state.type_activite !== "" && santeOk && activiteOk;
  }
  if (step === 1) return state.ca_annuel !== "" && parseFloat(state.ca_annuel) >= 0;
  if (step === 2) return state.situation_familiale !== "";
  return true;
}

function getResumeStep(state: WizardState): number {
  if (canAdvance(2, state)) return 3;
  if (canAdvance(1, state)) return 2;
  if (canAdvance(0, state)) return 1;
  return 0;
}

export function WizardShell({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(WIZARD_INITIAL_STATE);
  const [savedState, setSavedState] = useState<WizardState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as WizardState;
      setSavedState(parsed);
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
      setSavedState(null);
      setState(WIZARD_INITIAL_STATE);
    }
  }, []);

  function patch(p: Partial<WizardState>) {
    setState((prev) => {
      const newState = { ...prev, ...p };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  }

  function handleResume() {
    if (!savedState) return;
    setState(savedState);
    setStep(getResumeStep(savedState));
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));
    setSavedState(null);
  }

  function handleResetSaved() {
    sessionStorage.removeItem(STORAGE_KEY);
    setSavedState(null);
    setState(WIZARD_INITIAL_STATE);
    setStep(0);
  }

  async function handleNext() {
    if (step < 3) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const input = mapWizardToUserInput(state);
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      const [output, logs] = runEngineWithLogs(input);
      sessionStorage.removeItem(STORAGE_KEY);
      onComplete(output, logs);
    } catch (e) {
      setError("Une erreur est survenue lors du calcul. " + String(e));
    } finally {
      setLoading(false);
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
          {savedState && step === 0 && (
            <div className="wizard-resume-banner card">
              <div>
                <strong>Reprendre la simulation précédente</strong>
                <p>Nous avons retrouvé une saisie en cours dans cette session.</p>
              </div>
              <div className="wizard-resume-actions">
                <button type="button" className="btn btn-primary" onClick={handleResume}>
                  Reprendre
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleResetSaved}>
                  Recommencer
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <CalculSkeleton />
          ) : (
            <>
              {step === 0 && <Step0Profil state={state} onChange={patch} />}
              {step === 1 && <Step1Chiffres state={state} onChange={patch} />}
              {step === 2 && <Step2Foyer state={state} onChange={patch} />}
              {step === 3 && <Step3Aides state={state} onChange={patch} />}
            </>
          )}

          {error && <div className="wizard-error">{error}</div>}
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
              {loading ? "Calcul en cours…" : step < 3 ? "Continuer →" : "Calculer →"}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
