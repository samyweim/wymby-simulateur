import type { WizardState } from "../types.js";
import "./Step.css";

interface Props {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}

const ACTIVITES = [
  { value: "prestation", title: "Prestation de service", desc: "Consulting, formation, informatique…" },
  { value: "liberal", title: "Profession libérale", desc: "Avocat, architecte, expert-comptable…" },
  { value: "vente", title: "Vente de marchandises", desc: "Commerce, artisanat, e-commerce…" },
  { value: "sante", title: "Santé", desc: "Médecin, kiné, infirmier, dentiste…" },
  { value: "artiste", title: "Artiste-auteur", desc: "Auteur, musicien, plasticien…" },
  { value: "location", title: "Location meublée", desc: "LMNP / LMP" },
] as const;

const FORMES = [
  { value: "non_decide", title: "Pas encore décidé", desc: "Le simulateur propose le meilleur" },
  { value: "EI", title: "EI / Auto-entrepreneur", desc: "Entreprise individuelle" },
  { value: "EURL", title: "EURL", desc: "Société à responsabilité limitée — 1 associé" },
  { value: "SASU", title: "SASU", desc: "Société par actions simplifiée — 1 associé" },
] as const;

export function Step0Profil({ state, onChange }: Props) {
  return (
    <div className="step">
      <div className="step-header">
        <h2>Votre activité</h2>
        <p>Quelques informations pour cibler les régimes qui vous correspondent.</p>
      </div>

      <div className="step-fields">
        <div className="field">
          <label>Quel type d'activité exercez-vous ?</label>
          <div className="radio-grid">
            {ACTIVITES.map((a) => (
              <label className="radio-card" key={a.value}>
                <input
                  type="radio"
                  name="type_activite"
                  value={a.value}
                  checked={state.type_activite === a.value}
                  onChange={() => onChange({ type_activite: a.value })}
                />
                <div className="radio-label">
                  <span className="radio-title">{a.title}</span>
                  <span className="radio-desc">{a.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Sous quelle forme envisagez-vous d'exercer ?</label>
          <div className="radio-grid">
            {FORMES.map((f) => (
              <label className="radio-card" key={f.value}>
                <input
                  type="radio"
                  name="forme_envisagee"
                  value={f.value}
                  checked={state.forme_envisagee === f.value}
                  onChange={() => onChange({ forme_envisagee: f.value })}
                />
                <div className="radio-label">
                  <span className="radio-title">{f.title}</span>
                  <span className="radio-desc">{f.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Date de début d'activité</label>
          <input
            type="date"
            value={state.date_creation}
            onChange={(e) => onChange({ date_creation: e.target.value })}
            placeholder="Laisser vide si vous démarrez maintenant"
          />
          <span className="hint">Laisser vide si vous commencez aujourd'hui ou très prochainement.</span>
        </div>
      </div>
    </div>
  );
}
