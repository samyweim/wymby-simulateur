import type { WizardState } from "../types.js";
import { resolveZoneFromCodePostal } from "../../data/zones_cp.js";
import { shouldShow } from "../visibility.js";
import "./Step.css";

interface Props {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}

export function Step3Aides({ state, onChange }: Props) {
  return (
    <div className="step">
      <div className="step-header">
        <h2>Aides et situations particulieres</h2>
        <p>Ces dispositifs peuvent reduire significativement vos charges la premiere annee.</p>
      </div>

      <div className="step-fields">
        <div className="field">
          <label>Etes-vous en train de creer ou reprendre une activite ?</label>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${state.est_creation === true ? "active" : ""}`}
              onClick={() => onChange({ est_creation: true, est_deja_en_activite: false })}
            >
              Oui
            </button>
            <button
              type="button"
              className={`toggle-btn ${state.est_creation === false ? "active" : ""}`}
              onClick={() => onChange({ est_creation: false })}
            >
              Non
            </button>
          </div>
        </div>

        <div className="field">
          <label>Percevez-vous des allocations chomage (ARE) ?</label>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${state.percoit_chomage === true ? "active" : ""}`}
              onClick={() => onChange({ percoit_chomage: true })}
            >
              Oui
            </button>
            <button
              type="button"
              className={`toggle-btn ${state.percoit_chomage === false ? "active" : ""}`}
              onClick={() => onChange({ percoit_chomage: false, droits_are_restants: "" })}
            >
              Non
            </button>
          </div>
        </div>

        {shouldShow("droits_are", state) && (
          <div className="field field-indent">
            <label>Droits ARE restants</label>
            <div className="input-suffix-wrap">
              <input
                type="number"
                min="0"
                placeholder="ex. 18 000"
                value={state.droits_are_restants}
                onChange={(e) => onChange({ droits_are_restants: e.target.value })}
              />
              <span className="input-suffix">€</span>
            </div>
            <span className="hint">Utilise pour estimer l'ARCE comme flux de tresorerie distinct.</span>
          </div>
        )}

        <div className="field">
          <label>Code postal de votre lieu d'activite principal</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={5}
            pattern="\d{5}"
            placeholder="ex. 75011"
            value={state.code_postal}
            onChange={(e) =>
              onChange({ code_postal: e.target.value.replace(/\D/g, "").slice(0, 5) })
            }
          />
          {state.code_postal.length === 5 && (() => {
            const zone = resolveZoneFromCodePostal(state.code_postal);
            if (zone === "aucune") return null;
            return (
              <div className="field-zone-detected">
                Zone detectee : <strong>{zone}</strong> — exoneration applicable a votre dossier.
              </div>
            );
          })()}
          <span className="hint">
            Utilise pour detecter automatiquement une zone d'exoneration fiscale (ZFRR, QPV…).
          </span>
        </div>

        {shouldShow("envisage_associes", state) && (
          <div className="field">
            <label>Envisagez-vous d'avoir des associes ou des salaries ?</label>
            <div className="toggle-group">
              <button
                type="button"
                className={`toggle-btn ${state.envisage_associes === true ? "active" : ""}`}
                onClick={() => onChange({ envisage_associes: true })}
              >
                Oui
              </button>
              <button
                type="button"
                className={`toggle-btn ${state.envisage_associes === false ? "active" : ""}`}
                onClick={() => onChange({ envisage_associes: false })}
              >
                Non / Pas encore
              </button>
            </div>
            <span className="hint">
              Cette information permet d'inclure les structures en societe dans la comparaison.
            </span>
          </div>
        )}

        {shouldShow("tva_question", state) && (
          <div className="field">
            <label>Etes-vous deja soumis a la TVA ?</label>
            <div className="toggle-group">
              <button
                type="button"
                className={`toggle-btn ${state.tva_deja_applicable === true ? "active" : ""}`}
                onClick={() => onChange({ tva_deja_applicable: true })}
              >
                Oui
              </button>
              <button
                type="button"
                className={`toggle-btn ${state.tva_deja_applicable === false ? "active" : ""}`}
                onClick={() => onChange({ tva_deja_applicable: false })}
              >
                Non / Franchise de TVA
              </button>
            </div>
            <span className="hint">
              La TVA n'est demandee que si vous exercez deja etes potentiellement deja assujetti.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
