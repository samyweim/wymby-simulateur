import type { SecteurConventionnel, WizardState } from "../types.js";
import { shouldShow } from "../visibility.js";
import "./Step.css";

interface Props {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}

const ACTIVITES = [
  {
    value: "prestation" as const,
    title: "Prestation de service",
    desc: "Consulting, formation, IT, coaching, traduction, redaction…",
  },
  {
    value: "liberal_reglemente" as const,
    title: "Profession liberale reglementee",
    desc: "Avocat, architecte, expert-comptable, notaire, pharmacien…",
  },
  {
    value: "liberal_non_reglemente" as const,
    title: "Profession liberale non reglementee",
    desc: "Psychologue, coach, dieteticien, sophrologue, consultant RH…",
  },
  {
    value: "commerce" as const,
    title: "Commerce / Artisanat",
    desc: "Achat-revente, e-commerce, artisan fabricant, restauration…",
  },
  {
    value: "sante_medecin" as const,
    title: "Medecin",
    desc: "Medecin generaliste ou specialiste — secteur 1, 2 ou 3.",
  },
  {
    value: "sante_paramedicale" as const,
    title: "Paramedical / Sante",
    desc: "Kinesitherapeute, infirmier, orthophoniste, dentiste, sage-femme…",
  },
  {
    value: "artiste" as const,
    title: "Artiste-auteur",
    desc: "Auteur, musicien, plasticien, photographe, illustrateur…",
  },
  {
    value: "location" as const,
    title: "Location meublee",
    desc: "LMNP ou LMP — appartement, meuble de tourisme, colocation…",
  },
] as const;

export function Step0Profil({ state, onChange }: Props) {
  return (
    <div className="step">
      <div className="step-header">
        <h2>Votre activite</h2>
        <p>Quelques informations pour cibler les regimes qui vous correspondent.</p>
      </div>

      <div className="step-fields">
        <div className="field">
          <label>Quel type d'activite exercez-vous ?</label>
          <div className="radio-grid">
            {ACTIVITES.map((a) => (
              <label className="radio-card" key={a.value}>
                <input
                  type="radio"
                  name="type_activite"
                  value={a.value}
                  checked={state.type_activite === a.value}
                  onChange={() =>
                    onChange({
                      type_activite: a.value,
                      secteur_conventionnel: "",
                      envisage_associes: null,
                    })
                  }
                />
                <div className="radio-label">
                  <span className="radio-title">{a.title}</span>
                  <span className="radio-desc">{a.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {shouldShow("secteur_sante", state) && (
          <div className="field">
            <label>Votre secteur de conventionnement</label>
            <div className="radio-grid">
              {[
                {
                  value: "1",
                  title: "Secteur 1",
                  desc: "Honoraires opposables — aide CPAM maximale",
                },
                {
                  value: "2_optam",
                  title: "Secteur 2 OPTAM",
                  desc: "Depassements moderes — aide CPAM partielle",
                },
                {
                  value: "2_non_optam",
                  title: "Secteur 2 (sans OPTAM)",
                  desc: "Depassements libres — cotisations taux plein",
                },
                {
                  value: "3",
                  title: "Secteur 3 / Non conventionne",
                  desc: "Hors convention Assurance Maladie — tarifs entierement libres",
                },
              ].map((s) => (
                <label className="radio-card" key={s.value}>
                  <input
                    type="radio"
                    name="secteur_conventionnel"
                    value={s.value}
                    checked={state.secteur_conventionnel === s.value}
                    onChange={() =>
                      onChange({ secteur_conventionnel: s.value as SecteurConventionnel })
                    }
                  />
                  <div className="radio-label">
                    <span className="radio-title">{s.title}</span>
                    <span className="radio-desc">{s.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {shouldShow("secteur_sante", state) && (
          <div className="field-notice">
            Les regimes specifiques au secteur sante (cotisations CPAM, ASV, secteurs
            conventionnels) sont en cours d'integration. La simulation integre les regimes
            generaux en attendant les calculateurs sectoriels complets.
          </div>
        )}

        <div className="field">
          <label>Exercez-vous deja cette activite ?</label>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${state.est_deja_en_activite === false ? "active" : ""}`}
              onClick={() =>
                onChange({
                  est_deja_en_activite: false,
                  annee_debut_activite: "",
                  est_creation: true,
                })
              }
            >
              Non, je demarre
            </button>
            <button
              type="button"
              className={`toggle-btn ${state.est_deja_en_activite === true ? "active" : ""}`}
              onClick={() =>
                onChange({
                  est_deja_en_activite: true,
                  est_creation: false,
                })
              }
            >
              Oui, depuis…
            </button>
          </div>
          {state.est_deja_en_activite && (
            <input
              type="number"
              placeholder="Annee de debut (ex. 2022)"
              min={2000}
              max={2026}
              value={state.annee_debut_activite}
              onChange={(e) => onChange({ annee_debut_activite: e.target.value })}
              style={{ marginTop: "0.5rem", width: "12rem" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
