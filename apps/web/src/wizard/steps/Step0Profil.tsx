import type { SecteurConventionnel, StatutExerciceSante, WizardState } from "../types.js";
import { shouldShow } from "../visibility.js";
import "./Step.css";

interface Props {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}

const ACTIVITES = [
  {
    value: "prestation" as const,
    title: "BNC - conseil et prestations intellectuelles",
    desc: "Consultant en gestion, formateur, developpeur, data scientist, coach, marketing, psychologie, bien-etre non reglemente...",
  },
  {
    value: "liberal_reglemente" as const,
    title: "BNC - profession liberale reglementee",
    desc: "Avocat, architecte, expert-comptable, notaire, pharmacien...",
  },
  {
    value: "commerce" as const,
    title: "BIC - commerce, artisanat et services commerciaux",
    desc: "VTC, livreur, editeur SaaS, nettoyage, entretien, coiffure a domicile...",
  },
  {
    value: "sante_medecin" as const,
    title: "Medecin",
    desc: "BNC reglemente, exonere de TVA, PAMC. Secteur 1, 2 OPTAM, 2 sans OPTAM ou 3.",
  },
  {
    value: "sante_paramedicale" as const,
    title: "Sante reglementee",
    desc: "Infirmier liberal, kine, psychologue, orthophoniste, osteopathe...",
  },
  {
    value: "artiste" as const,
    title: "Artiste-auteur",
    desc: "Auteur, musicien, plasticien, photographe, illustrateur...",
  },
  {
    value: "location" as const,
    title: "Location meublee",
    desc: "LMNP ou LMP, appartement, meuble de tourisme, colocation...",
  },
] as const;

const ACTIVITE_GROUPS = [
  {
    label: "Generaliste",
    values: ["prestation", "liberal_reglemente", "commerce"],
  },
  {
    label: "Sante",
    values: ["sante_medecin", "sante_paramedicale"],
  },
  {
    label: "Immobilier",
    values: ["location"],
  },
  {
    label: "Artiste-auteur",
    values: ["artiste"],
  },
] as const;

const MONTHS = [
  { value: "01", label: "Janvier" },
  { value: "02", label: "Fevrier" },
  { value: "03", label: "Mars" },
  { value: "04", label: "Avril" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Juin" },
  { value: "07", label: "Juillet" },
  { value: "08", label: "Aout" },
  { value: "09", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Decembre" },
] as const;

const YEARS = Array.from({ length: 12 }, (_, index) => String(2026 - index));

export function Step0Profil({ state, onChange }: Props) {
  const needsHealthSector = shouldShow("secteur_sante", state);
  const isParamedical = state.type_activite === "sante_paramedicale";
  const healthSectorCompleted = state.secteur_conventionnel !== "";

  return (
    <div className="step">
      <div className="step-header">
        <h2>Votre activite</h2>
        <p>Quelques informations pour cibler les regimes qui vous correspondent.</p>
      </div>

      <div className="step-fields">
        <div className="field">
          <label>Quel type d'activite exercez-vous ?</label>
          <div className="activite-groups">
            {ACTIVITE_GROUPS.map((group) => (
              <div key={group.label} className="activite-group">
                <span className="activite-group-label">{group.label}</span>
                <div className="activite-tiles">
                  {group.values.map((value) => {
                    const item = ACTIVITES.find((activity) => activity.value === value)!;

                    return (
                      <label className="radio-card" key={item.value}>
                        <input
                          type="radio"
                          name="type_activite"
                          value={item.value}
                          checked={state.type_activite === item.value}
                          onChange={() =>
                            onChange({
                              type_activite: item.value,
                              est_profession_sante:
                                item.value === "sante_medecin" ||
                                item.value === "sante_paramedicale",
                              a_numero_adeli:
                                item.value === "sante_medecin" || item.value === "sante_paramedicale"
                                  ? true
                                  : false,
                              secteur_conventionnel: "",
                              statut_exercice_sante: "",
                              charges_retrocession: "",
                              mode_retrocession: "euros",
                              envisage_associes: null,
                            })
                          }
                        />
                        <div className="radio-label">
                          <span className="radio-title">{item.title}</span>
                          <span className="radio-desc">
                            {item.value === "sante_paramedicale" && <strong>Numero RPPS requis</strong>}
                            {item.value === "sante_paramedicale" && <br />}
                            {item.desc}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {needsHealthSector && (
          <section
            className={`field field-substep ${
              healthSectorCompleted ? "field-substep-complete" : "field-substep-required"
            }`}
          >
            <div className="field-substep-head">
              <div>
                <label>Votre secteur de conventionnement</label>
              </div>
              <span
                className={`field-substep-status ${
                  healthSectorCompleted ? "is-complete" : "is-pending"
                }`}
              >
                {healthSectorCompleted ? "Complete" : "A completer"}
              </span>
            </div>

            <p className="field-substep-intro">
              On en a besoin pour appliquer les bons regimes sante, les aides CPAM et les
              cotisations correspondant a votre situation.
            </p>

            <div className="radio-grid radio-grid-emphasis">
              {(isParamedical
                ? [
                    {
                      value: "1",
                      title: "Conventionne secteur 1",
                      desc: "Convention PAMC avec aide CPAM possible",
                    },
                    {
                      value: "3",
                      title: "Non conventionne",
                      desc: "Hors convention Assurance Maladie",
                    },
                  ]
                : [
                    {
                      value: "1",
                      title: "Secteur 1",
                      desc: "Honoraires opposables, aide CPAM maximale",
                    },
                    {
                      value: "2_optam",
                      title: "Secteur 2 OPTAM",
                      desc: "Depassements moderes, aide CPAM partielle",
                    },
                    {
                      value: "2_non_optam",
                      title: "Secteur 2 (sans OPTAM)",
                      desc: "Depassements libres, cotisations au taux plein",
                    },
                    {
                      value: "3",
                      title: "Secteur 3 / Non conventionne",
                      desc: "Hors convention Assurance Maladie, tarifs entierement libres",
                    },
                  ]
              ).map((sector) => (
                <label className="radio-card" key={sector.value}>
                  <input
                    type="radio"
                    name="secteur_conventionnel"
                    value={sector.value}
                    checked={state.secteur_conventionnel === sector.value}
                    onChange={() =>
                      onChange({
                        secteur_conventionnel: sector.value as SecteurConventionnel,
                      })
                    }
                  />
                  <div className="radio-label">
                    <span className="radio-title">{sector.title}</span>
                    <span className="radio-desc">{sector.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </section>
        )}

        {shouldShow("statut_exercice_sante", state) && (
          <div className="field">
            <label>Votre statut d'exercice</label>
            <div className="radio-grid">
              {[
                {
                  value: "titulaire_installe",
                  title: "Titulaire installe",
                  desc: "Vous exercez a titre principal dans votre propre cabinet",
                },
                {
                  value: "remplacant",
                  title: "Remplacant",
                  desc: "Vous remplacez un praticien titulaire - regime RSPM possible",
                },
                {
                  value: "associe_groupe",
                  title: "Associe / groupe",
                  desc: "Exercice en cabinet de groupe ou societe d'exercice liberal",
                },
              ].map((status) => (
                <label className="radio-card" key={status.value}>
                  <input
                    type="radio"
                    name="statut_exercice_sante"
                    value={status.value}
                    checked={state.statut_exercice_sante === status.value}
                    onChange={() =>
                      onChange({
                        statut_exercice_sante: status.value as StatutExerciceSante,
                        charges_retrocession:
                          status.value === "remplacant" ? state.charges_retrocession : "",
                        mode_retrocession:
                          status.value === "remplacant" ? state.mode_retrocession : "euros",
                      })
                    }
                  />
                  <div className="radio-label">
                    <span className="radio-title">{status.title}</span>
                    <span className="radio-desc">{status.desc}</span>
                  </div>
                </label>
              ))}
            </div>
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
                  mois_debut_activite: "01",
                  annee_debut_activite: "",
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
                  mois_debut_activite: state.mois_debut_activite || "01",
                })
              }
            >
              Oui, depuis...
            </button>
          </div>

          {state.est_deja_en_activite && (
            <div className="start-date-row">
              <span className="start-date-label">Depuis :</span>
              <div className="start-date-selects">
                <select
                  value={state.mois_debut_activite}
                  onChange={(event) => onChange({ mois_debut_activite: event.target.value })}
                >
                  {MONTHS.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
                <select
                  value={state.annee_debut_activite}
                  onChange={(event) => onChange({ annee_debut_activite: event.target.value })}
                >
                  <option value="">Annee</option>
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <span className="hint">
                Si vous ne connaissez pas le mois exact, janvier est retenu par prudence pour
                cristalliser les aides de creation.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
