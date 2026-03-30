import type { WizardState } from "../types.js";
import { shouldShow } from "../visibility.js";
import "./Step.css";

interface Props {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}

export function Step2Foyer({ state, onChange }: Props) {
  return (
    <div className="step">
      <div className="step-header">
        <h2>Votre situation personnelle</h2>
        <p>Ces informations permettent de calculer votre impôt sur le revenu avec précision.</p>
      </div>

      <div className="step-fields">
        {/* Situation familiale */}
        <div className="field">
          <label>Situation familiale</label>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${state.situation_familiale === "seul" ? "active" : ""}`}
              onClick={() => onChange({ situation_familiale: "seul" })}
            >Célibataire / divorcé·e</button>
            <button
              type="button"
              className={`toggle-btn ${state.situation_familiale === "en_couple" ? "active" : ""}`}
              onClick={() => onChange({ situation_familiale: "en_couple" })}
            >Marié·e ou pacsé·e</button>
          </div>
        </div>

        {/* Enfants */}
        <div className="field">
          <label>Nombre d'enfants à charge</label>
          <div className="toggle-group">
            {[0, 1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                className={`toggle-btn ${state.nb_enfants === n ? "active" : ""}`}
                onClick={() => onChange({ nb_enfants: n })}
              >
                {n === 3 ? "3 ou plus" : n.toString()}
              </button>
            ))}
          </div>
          <span className="hint">Chaque enfant réduit votre impôt via le quotient familial.</span>
        </div>

        {/* Autres revenus */}
        <div className="field">
          <label>Votre foyer a-t-il d'autres revenus en 2026 ?</label>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${state.a_autres_revenus === true ? "active" : ""}`}
              onClick={() => onChange({ a_autres_revenus: true })}
            >Oui</button>
            <button
              type="button"
              className={`toggle-btn ${state.a_autres_revenus === false ? "active" : ""}`}
              onClick={() => onChange({ a_autres_revenus: false, autres_revenus_foyer: "" })}
            >Non</button>
          </div>
          <span className="hint">Salaire du conjoint, revenus locatifs, revenus de capitaux…</span>
        </div>

        {state.a_autres_revenus && (
          <div className="field field-indent">
            <label>Autres revenus imposables du foyer (hors votre activité)</label>
            <div className="input-suffix-wrap">
              <input
                type="number"
                min="0"
                placeholder="ex. 35 000"
                value={state.autres_revenus_foyer}
                onChange={(e) => onChange({ autres_revenus_foyer: e.target.value })}
              />
              <span className="input-suffix">€ / an</span>
            </div>
          </div>
        )}

        {/* RFR N-2 */}
        <div className="field">
          <label>Connaissez-vous votre revenu fiscal de référence 2024 ?</label>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${state.connait_rfr === true ? "active" : ""}`}
              onClick={() => onChange({ connait_rfr: true })}
            >Oui, je l'ai</button>
            <button
              type="button"
              className={`toggle-btn ${state.connait_rfr === false ? "active" : ""}`}
              onClick={() => onChange({ connait_rfr: false, rfr_n2: "" })}
            >Non / je ne sais pas</button>
          </div>
          <span className="hint">
            Il figure sur votre avis d'imposition 2024 (revenus 2023). Nécessaire pour valider l'option
            versement libératoire.
          </span>
        </div>

        {shouldShow("rfr_n2", state) && (
          <div className="field field-indent">
            <label>Revenu fiscal de référence 2024</label>
            <div className="input-suffix-wrap">
              <input
                type="number"
                min="0"
                placeholder="ex. 42 000"
                value={state.rfr_n2}
                onChange={(e) => onChange({ rfr_n2: e.target.value })}
              />
              <span className="input-suffix">€</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
