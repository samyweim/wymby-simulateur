import type { WizardState } from "../types.js";
import { shouldShow } from "../visibility.js";
import "./Step.css";

interface Props {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}

const CERTITUDES = [
  { value: "certain", label: "Je suis sur·e" },
  { value: "estimé", label: "C'est une estimation" },
  { value: "faible", label: "Je ne sais pas encore" },
] as const;

export function Step1Chiffres({ state, onChange }: Props) {
  return (
    <div className="step">
      <div className="step-header">
        <h2>Vos revenus professionnels</h2>
        <p>Les montants annuels estimes pour l'exercice 2026.</p>
      </div>

      <div className="step-fields">
        <div className="field">
          <label>Chiffre d'affaires annuel prevu</label>
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
              >
                HT
              </button>
              <button
                type="button"
                className={`toggle-btn ${state.mode_ca === "TTC" ? "active" : ""}`}
                onClick={() => onChange({ mode_ca: "TTC" })}
              >
                TTC
              </button>
            </div>
          </div>
          <span className="hint">
            Si vous n'etes pas encore assujetti a la TVA, saisissez le montant encaisse.
          </span>
        </div>

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

        <div className="field">
          <label>Avez-vous des depenses professionnelles a deduire ?</label>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${state.a_des_charges === true ? "active" : ""}`}
              onClick={() => onChange({ a_des_charges: true })}
            >
              Oui
            </button>
            <button
              type="button"
              className={`toggle-btn ${state.a_des_charges === false ? "active" : ""}`}
              onClick={() =>
                onChange({
                  a_des_charges: false,
                  charges_annuelles: "",
                  charges_locaux: "",
                  charges_materiel: "",
                  charges_personnel: "",
                  charges_autres: "",
                })
              }
            >
              Non / je ne sais pas
            </button>
          </div>
        </div>

        {shouldShow("charges_detail", state) && (() => {
          const isSante = ["sante_medecin", "sante_paramedicale"].includes(state.type_activite);
          const categories = isSante
            ? [
                {
                  key: "charges_locaux" as const,
                  label: "Loyer et charges du cabinet",
                  hint: "Loyer, electricite, assurance cabinet, charges locatives",
                },
                {
                  key: "charges_materiel" as const,
                  label: "Materiel et equipements",
                  hint: "Petit materiel medical, fournitures, instruments",
                },
                {
                  key: "charges_personnel" as const,
                  label: "Personnel salarie",
                  hint: "Secretaire medicale, aide-soignant, infirmier salarie…",
                },
                {
                  key: "charges_autres" as const,
                  label: "Autres frais professionnels",
                  hint: "Formations, deplacements, cotisations ordinales, documentation",
                },
              ]
            : [
                {
                  key: "charges_locaux" as const,
                  label: "Loyer et charges du local",
                  hint: "Bureau, coworking, domiciliation, loyer professionnel",
                },
                {
                  key: "charges_materiel" as const,
                  label: "Materiel et equipements",
                  hint: "Ordinateur, logiciels, mobilier — a amortir si valeur > 500 €",
                },
                {
                  key: "charges_personnel" as const,
                  label: "Sous-traitants et prestataires",
                  hint: "Honoraires verses a d'autres independants ou societes",
                },
                {
                  key: "charges_autres" as const,
                  label: "Autres frais professionnels",
                  hint: "Deplacements, telecommunications, formations, fournitures",
                },
              ];

          return (
            <div className="charges-detail">
              <p className="charges-detail-intro">Repartissez vos depenses par categorie :</p>
              {categories.map((cat) => (
                <div className="field field-sub" key={cat.key}>
                  <label>{cat.label}</label>
                  <div className="input-suffix-wrap">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={state[cat.key]}
                      onChange={(e) =>
                        onChange({ [cat.key]: e.target.value } as Partial<WizardState>)
                      }
                    />
                    <span className="input-suffix">€ / an</span>
                  </div>
                  <span className="hint">{cat.hint}</span>
                </div>
              ))}
            </div>
          );
        })()}

        {!shouldShow("charges_detail", state) && state.a_des_charges && (
          <div className="field field-indent">
            <label>Total des depenses professionnelles</label>
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

        <div className="field">
          <label>Avez-vous du materiel professionnel a amortir ?</label>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${state.a_des_amortissements === true ? "active" : ""}`}
              onClick={() => onChange({ a_des_amortissements: true })}
            >
              Oui
            </button>
            <button
              type="button"
              className={`toggle-btn ${state.a_des_amortissements === false ? "active" : ""}`}
              onClick={() => onChange({ a_des_amortissements: false, amortissements_annuels: "" })}
            >
              Non
            </button>
          </div>
          <span className="hint">
            Pertinent surtout pour les regimes reels ou les investissements materiels importants.
          </span>
        </div>

        {shouldShow("amortissements", state) && (
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
