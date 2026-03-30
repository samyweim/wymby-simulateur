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
    desc: "Consulting, formation, IT, coaching, traduction, rédaction…",
  },
  {
    value: "liberal_reglemente" as const,
    title: "Profession libérale réglementée",
    desc: "Avocat, architecte, expert-comptable, notaire, pharmacien…",
  },
  {
    value: "liberal_non_reglemente" as const,
    title: "Profession libérale non réglementée",
    desc: "Psychologue, coach, diététicien, sophrologue, consultant RH…",
  },
  {
    value: "commerce" as const,
    title: "Commerce / Artisanat",
    desc: "Achat-revente, e-commerce, artisan fabricant, restauration…",
  },
  {
    value: "sante_medecin" as const,
    title: "Médecin",
    desc: "Médecin généraliste ou spécialiste, en secteur 1, 2 ou 3.",
  },
  {
    value: "sante_paramedicale" as const,
    title: "Paramédical / Santé",
    desc: "Kinésithérapeute, infirmier, orthophoniste, dentiste, sage-femme…",
  },
  {
    value: "artiste" as const,
    title: "Artiste-auteur",
    desc: "Auteur, musicien, plasticien, photographe, illustrateur…",
  },
  {
    value: "location" as const,
    title: "Location meublée",
    desc: "LMNP ou LMP, appartement, meublé de tourisme, colocation…",
  },
] as const;

const MONTHS = [
  { value: "01", label: "Janvier" },
  { value: "02", label: "Février" },
  { value: "03", label: "Mars" },
  { value: "04", label: "Avril" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Juin" },
  { value: "07", label: "Juillet" },
  { value: "08", label: "Août" },
  { value: "09", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
] as const;

const YEARS = Array.from({ length: 12 }, (_, index) => String(2026 - index));

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
                  desc: "Honoraires opposables, aide CPAM maximale",
                },
                {
                  value: "2_optam",
                  title: "Secteur 2 OPTAM",
                  desc: "Dépassements modérés, aide CPAM partielle",
                },
                {
                  value: "2_non_optam",
                  title: "Secteur 2 (sans OPTAM)",
                  desc: "Dépassements libres, cotisations au taux plein",
                },
                {
                  value: "3",
                  title: "Secteur 3 / Non conventionné",
                  desc: "Hors convention Assurance Maladie, tarifs entièrement libres",
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
            Les régimes spécifiques au secteur santé (cotisations CPAM, ASV, secteurs
            conventionnels) sont en cours d’intégration. La simulation utilise encore les
            régimes généraux en attendant les calculateurs sectoriels complets.
          </div>
        )}

        <div className="field">
          <label>Exercez-vous déjà cette activité ?</label>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${state.est_deja_en_activite === false ? "active" : ""}`}
              onClick={() =>
                onChange({
                  est_deja_en_activite: false,
                  mois_debut_activite: "",
                  annee_debut_activite: "",
                })
              }
            >
              Non, je démarre
            </button>
            <button
              type="button"
              className={`toggle-btn ${state.est_deja_en_activite === true ? "active" : ""}`}
              onClick={() =>
                onChange({
                  est_deja_en_activite: true,
                })
              }
            >
              Oui, depuis…
            </button>
          </div>

          {state.est_deja_en_activite && (
            <div className="start-date-row">
              <span className="start-date-label">Depuis :</span>
              <div className="start-date-selects">
                <select
                  value={state.mois_debut_activite}
                  onChange={(e) => onChange({ mois_debut_activite: e.target.value })}
                >
                  <option value="">Mois</option>
                  {MONTHS.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
                <select
                  value={state.annee_debut_activite}
                  onChange={(e) => onChange({ annee_debut_activite: e.target.value })}
                >
                  <option value="">Année</option>
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
