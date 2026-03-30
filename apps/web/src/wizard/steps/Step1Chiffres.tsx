import type { WizardState } from "../types.js";
import { shouldShow } from "../visibility.js";
import { FISCAL_PARAMS_2026 } from "@wymby/config";
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

const GENERAL_CHARGE_CATEGORIES = [
  {
    key: "charges_locaux" as const,
    label: "Loyer et charges du local",
    hint: "Bureau, coworking, domiciliation, loyer professionnel",
  },
  {
    key: "charges_materiel" as const,
    label: "Matériel et équipements",
    hint: `Ordinateur, logiciels, mobilier, à amortir si valeur > ${FISCAL_PARAMS_2026.comptabilite.CFG_SEUIL_IMMOBILISATION_MATERIEL_MIN} €`,
  },
  {
    key: "charges_personnel" as const,
    label: "Sous-traitants et prestataires",
    hint: "Honoraires versés à d'autres indépendants ou sociétés",
  },
  {
    key: "charges_autres" as const,
    label: "Autres frais professionnels",
    hint: "Fournitures, abonnements, documentation, frais divers",
  },
  {
    key: "charges_repas" as const,
    label: "Alimentation (repas professionnels)",
    hint: "Repas seul en déplacement ou repas client dans la limite légale",
  },
  {
    key: "charges_deplacement_transport" as const,
    label: "Déplacements (transport, carburant, péages)",
    hint: "Kilométrage professionnel, billets de train, parking",
  },
  {
    key: "charges_telecom" as const,
    label: "Télécom (téléphone, internet)",
    hint: "Quote-part professionnelle de votre abonnement mobile et internet",
  },
  {
    key: "charges_rc_pro" as const,
    label: "Assurance RC Pro",
    hint: "Responsabilité civile professionnelle, obligatoire pour certaines professions",
  },
  {
    key: "charges_cotisations_pro" as const,
    label: "Cotisations professionnelles",
    hint: "Syndicats, ordres professionnels, associations métier",
  },
] as const;

const HEALTH_CHARGE_CATEGORIES = [
  {
    key: "charges_locaux" as const,
    label: "Loyer et charges du cabinet",
    hint: "Loyer, électricité, assurance cabinet, charges locatives",
  },
  {
    key: "charges_materiel" as const,
    label: "Petit matériel médical",
    hint: "Fournitures, instruments, consommables médicaux",
  },
  {
    key: "charges_deplacement_transport" as const,
    label: "Déplacements professionnels",
    hint: "Visites à domicile, déplacements entre cabinets",
  },
  {
    key: "charges_rc_pro" as const,
    label: "Assurance RC Pro médicale",
    hint: "Responsabilité civile professionnelle, montant annuel",
  },
  {
    key: "charges_cotisations_pro" as const,
    label: "Cotisations ordinales et syndicales",
    hint: "Ordre des médecins, syndicats médicaux",
  },
  {
    key: "charges_telecom" as const,
    label: "Télécom et logiciels",
    hint: "Logiciel de gestion médicale, téléphone, connexion",
  },
  {
    key: "charges_personnel" as const,
    label: "Personnel salarié",
    hint: "Secrétaire médicale, aide-soignant, collaborateur salarié",
  },
  {
    key: "charges_autres" as const,
    label: "Formation médicale continue",
    hint: "DPC, congrès, abonnements revues médicales",
  },
  {
    key: "charges_repas" as const,
    label: "Repas professionnels",
    hint: "Repas en déplacement ou liés à votre activité médicale",
  },
] as const;

const AMORTISSEMENT_CATEGORIES = [
  {
    key: "amort_informatique" as const,
    label: "Matériel informatique",
    hint: "Ordinateurs, écrans, imprimantes, durée d'amortissement : 3 ans",
  },
  {
    key: "amort_vehicule" as const,
    label: "Véhicule professionnel",
    hint: "Quote-part professionnelle du véhicule, durée : 4 à 5 ans",
  },
  {
    key: "amort_mobilier" as const,
    label: "Mobilier et équipements de bureau",
    hint: "Bureaux, fauteuils, étagères, durée : 5 à 10 ans",
  },
  {
    key: "amort_logiciels" as const,
    label: "Logiciels et licences (> 1 an)",
    hint: "Logiciels achetés hors abonnements, durée : 1 à 3 ans",
  },
] as const;

function getTotal(values: Array<string>): number {
  return values
    .map((value) => parseFloat(value) || 0)
    .reduce((sum, value) => sum + value, 0);
}

export function Step1Chiffres({ state, onChange }: Props) {
  const isSante = ["sante_medecin", "sante_paramedicale"].includes(state.type_activite);
  const chargeCategories = isSante ? HEALTH_CHARGE_CATEGORIES : GENERAL_CHARGE_CATEGORIES;
  const totalCharges = getTotal([
    state.charges_locaux,
    state.charges_materiel,
    state.charges_personnel,
    state.charges_autres,
    state.charges_repas,
    state.charges_deplacement_transport,
    state.charges_telecom,
    state.charges_rc_pro,
    state.charges_cotisations_pro,
  ]);
  const totalAmortissements = getTotal([
    state.amort_informatique,
    state.amort_vehicule,
    state.amort_mobilier,
    state.amort_logiciels,
  ]);

  return (
    <div className="step">
      <div className="step-header">
        <h2>Vos revenus professionnels</h2>
        <p>Les montants annuels estimés pour l'exercice 2026.</p>
      </div>

      <div className="step-fields">
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
            Si vous n'êtes pas encore assujetti à la TVA, saisissez le montant encaissé.
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
          <label>Avez-vous des dépenses professionnelles à déduire ?</label>
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
                  charges_repas: "",
                  charges_deplacement_transport: "",
                  charges_telecom: "",
                  charges_rc_pro: "",
                  charges_cotisations_pro: "",
                })
              }
            >
              Non / je ne sais pas
            </button>
          </div>
        </div>

        {shouldShow("charges_detail", state) && (
          <div className="charges-detail">
            <p className="charges-detail-intro">Répartissez vos dépenses par catégorie :</p>
            {chargeCategories.map((cat) => (
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

            <div className="charges-total">
              Total annuel estimé :{" "}
              <strong>{totalCharges.toLocaleString("fr-FR")} €</strong>
            </div>
          </div>
        )}

        {!shouldShow("charges_detail", state) && state.a_des_charges && (
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

        <div className="field">
          <label>Avez-vous du matériel professionnel à amortir ?</label>
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
              onClick={() =>
                onChange({
                  a_des_amortissements: false,
                  amortissements_annuels: "",
                  amort_informatique: "",
                  amort_vehicule: "",
                  amort_mobilier: "",
                  amort_logiciels: "",
                })
              }
            >
              Non
            </button>
          </div>
          <span className="hint">
            Pertinent surtout pour les régimes réels ou les investissements matériels importants.
          </span>
        </div>

        {shouldShow("amortissements", state) && (
          <div className="charges-detail">
            <p className="charges-detail-intro">
              Répartissez vos dotations aux amortissements par catégorie :
            </p>
            {AMORTISSEMENT_CATEGORIES.map((cat) => (
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

            {totalAmortissements === 0 && (
              <div className="field field-sub">
                <label>Autres amortissements annuels</label>
                <div className="input-suffix-wrap">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={state.amortissements_annuels}
                    onChange={(e) => onChange({ amortissements_annuels: e.target.value })}
                  />
                  <span className="input-suffix">€ / an</span>
                </div>
                <span className="hint">
                  À utiliser uniquement si vous préférez saisir un total plutôt qu'un détail.
                </span>
              </div>
            )}

            <div className="charges-total">
              Total amortissements annuels :{" "}
              <strong>
                {totalAmortissements.toLocaleString("fr-FR")} €
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
