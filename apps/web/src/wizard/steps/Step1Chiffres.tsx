import type { WizardState } from "../types.js";
import "./Step.css";

interface Props {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}

const CERTITUDES = [
  { value: "certain", label: "Je suis sûr·e" },
  { value: "estimé", label: "C'est une estimation" },
  { value: "faible", label: "Je ne sais pas encore" },
] as const;

export function Step1Chiffres({ state, onChange }: Props) {
  return (
    <div className="step">
      <div className="step-header">
        <h2>Vos revenus professionnels</h2>
        <p>Les montants annuels estimés pour l'exercice 2026.</p>
      </div>

      <div className="step-fields">
        {/* CA */}
        <div className="field">
          <label>Chiffre d'affaires annuel prévu</label>
          <div className="ca-row">
            <div className="input-suffix-wrap" style={{ flex: 1 }}>
              <input
                type="number"
                min="0"
                placeholder="ex. 60 000"
                value={state.ca_annuel}
                onChange={(e) => onChange({ ca_annuel: e.target.value })}
                autoFocus
              />
              <span className="input-suffix">€</span>
            </div>
            <div className="toggle-group" style={{ flexShrink: 0 }}>
              <button
                type="button"
                className={`toggle-btn ${state.mode_ca === "HT" ? "active" : ""}`}
                onClick={() => onChange({ mode_ca: "HT" })}
              >HT</button>
              <button
                type="button"
                className={`toggle-btn ${state.mode_ca === "TTC" ? "active" : ""}`}
                onClick={() => onChange({ mode_ca: "TTC" })}
              >TTC</button>
            </div>
          </div>
          <span className="hint">Si vous n'êtes pas encore assujetti à la TVA, saisissez le montant encaissé (pas de distinction HT/TTC).</span>
        </div>

        {/* Certitude */}
        <div className="field">
          <label>Quelle est votre certitude sur ce montant ?</label>
          <div className="toggle-group">
            {CERTITUDES.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`toggle-btn ${state.certitude_ca === c.value ? "active" : ""}`}
                onClick={() => onChange({ certitude_ca: c.value })}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Charges */}
        <div className="field">
          <label>Avez-vous des dépenses professionnelles à déduire ?</label>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${state.a_des_charges === true ? "active" : ""}`}
              onClick={() => onChange({ a_des_charges: true })}
            >Oui</button>
            <button
              type="button"
              className={`toggle-btn ${state.a_des_charges === false ? "active" : ""}`}
              onClick={() => onChange({ a_des_charges: false, charges_annuelles: "" })}
            >Non / je ne sais pas</button>
          </div>
          <span className="hint">Loyer du bureau, fournitures, logiciels, téléphone, déplacements professionnels…</span>
        </div>

        {state.a_des_charges && (
          <div className="field field-indent">
            <label>Total des dépenses professionnelles</label>
            <div className="input-suffix-wrap">
              <input
                type="number"
                min="0"
                placeholder="ex. 8 000"
                value={state.charges_annuelles}
                onChange={(e) => onChange({ charges_annuelles: e.target.value })}
              />
              <span className="input-suffix">€ / an</span>
            </div>
          </div>
        )}

        {/* Amortissements */}
        <div className="field">
          <label>Avez-vous du matériel professionnel à amortir ?</label>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${state.a_des_amortissements === true ? "active" : ""}`}
              onClick={() => onChange({ a_des_amortissements: true })}
            >Oui</button>
            <button
              type="button"
              className={`toggle-btn ${state.a_des_amortissements === false ? "active" : ""}`}
              onClick={() => onChange({ a_des_amortissements: false, amortissements_annuels: "" })}
            >Non</button>
          </div>
          <span className="hint">Ordinateur, véhicule, outillage — pertinent uniquement si vous êtes au régime réel.</span>
        </div>

        {state.a_des_amortissements && (
          <div className="field field-indent">
            <label>Dotations aux amortissements annuelles</label>
            <div className="input-suffix-wrap">
              <input
                type="number"
                min="0"
                placeholder="ex. 2 000"
                value={state.amortissements_annuels}
                onChange={(e) => onChange({ amortissements_annuels: e.target.value })}
              />
              <span className="input-suffix">€ / an</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
