import { FISCAL_PARAMS_2026 } from "@wymby/config";
import type { WizardState } from "../types.js";
import { shouldShow } from "../visibility.js";
import "./Step.css";

interface Props {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}

const CERTITUDES = [
  { value: "certain", label: "Je suis sur(e)" },
  { value: "estimÃƒÂ©", label: "C'est une estimation" },
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
    label: "Materiel et equipements",
    hint: `Ordinateur, logiciels, mobilier, a amortir si valeur > ${FISCAL_PARAMS_2026.comptabilite.CFG_SEUIL_IMMOBILISATION_MATERIEL_MIN} EUR`,
  },
  {
    key: "charges_personnel" as const,
    label: "Sous-traitants et prestataires",
    hint: "Honoraires verses a d'autres independants ou societes",
  },
  {
    key: "charges_autres" as const,
    label: "Autres frais professionnels",
    hint: "Fournitures, abonnements, documentation, frais divers",
  },
  {
    key: "charges_repas" as const,
    label: "Alimentation (repas professionnels)",
    hint: "Repas seul en deplacement ou repas client dans la limite legale",
  },
  {
    key: "charges_deplacement_transport" as const,
    label: "Deplacements (transport, carburant, peages)",
    hint: "Kilometrage professionnel, billets de train, parking",
  },
  {
    key: "charges_telecom" as const,
    label: "Telecom (telephone, internet)",
    hint: "Quote-part professionnelle de votre abonnement mobile et internet",
  },
  {
    key: "charges_rc_pro" as const,
    label: "Assurance RC Pro",
    hint: "Responsabilite civile professionnelle, obligatoire pour certaines professions",
  },
  {
    key: "charges_cotisations_pro" as const,
    label: "Cotisations professionnelles",
    hint: "Syndicats, ordres professionnels, associations metier",
  },
] as const;

const HEALTH_CHARGE_CATEGORIES = [
  {
    key: "charges_locaux" as const,
    label: "Loyer et charges du cabinet",
    hint: "Loyer, electricite, assurance cabinet, charges locatives",
  },
  {
    key: "charges_materiel" as const,
    label: "Petit materiel medical",
    hint: "Fournitures, instruments, consommables medicaux",
  },
  {
    key: "charges_deplacement_transport" as const,
    label: "Deplacements professionnels",
    hint: "Visites a domicile, deplacements entre cabinets",
  },
  {
    key: "charges_rc_pro" as const,
    label: "Assurance RC Pro medicale",
    hint: "Responsabilite civile professionnelle, montant annuel",
  },
  {
    key: "charges_cotisations_pro" as const,
    label: "Cotisations ordinales et syndicales",
    hint: "Ordre des medecins, syndicats medicaux",
  },
  {
    key: "charges_telecom" as const,
    label: "Telecom et logiciels",
    hint: "Logiciel de gestion medicale, telephone, connexion",
  },
  {
    key: "charges_personnel" as const,
    label: "Personnel salarie",
    hint: "Secretaire medicale, aide-soignant, collaborateur salarie",
  },
  {
    key: "charges_autres" as const,
    label: "Formation medicale continue",
    hint: "DPC, congres, abonnements revues medicales",
  },
  {
    key: "charges_repas" as const,
    label: "Repas professionnels",
    hint: "Repas en deplacement ou lies a votre activite medicale",
  },
] as const;

const AMORTISSEMENT_CATEGORIES = [
  {
    key: "amort_informatique" as const,
    label: "Materiel informatique",
    hint: "Ordinateurs, ecrans, imprimantes, duree d'amortissement : 3 ans",
  },
  {
    key: "amort_vehicule" as const,
    label: "Vehicule professionnel",
    hint: "Quote-part professionnelle du vehicule, duree : 4 a 5 ans",
  },
  {
    key: "amort_mobilier" as const,
    label: "Mobilier et equipements de bureau",
    hint: "Bureaux, fauteuils, etageres, duree : 5 a 10 ans",
  },
  {
    key: "amort_logiciels" as const,
    label: "Logiciels et licences (> 1 an)",
    hint: "Logiciels achetes hors abonnements, duree : 1 a 3 ans",
  },
] as const;

function parseAmount(value: string): number {
  return parseFloat(value) || 0;
}

function getTotal(values: Array<string>): number {
  return values.map((value) => parseAmount(value)).reduce((sum, value) => sum + value, 0);
}

function formatCurrency(value: number): string {
  return value.toLocaleString("fr-FR");
}

export function Step1Chiffres({ state, onChange }: Props) {
  const isSante = ["sante_medecin", "sante_paramedicale"].includes(
    state.type_activite
  );
  const shouldShowRetrocession = shouldShow("charges_retrocession", state);
  const chargeCategories = isSante ? HEALTH_CHARGE_CATEGORIES : GENERAL_CHARGE_CATEGORIES;
  const caNum = parseAmount(state.ca_annuel);
  const retrocessionNum = parseAmount(state.charges_retrocession);
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
  const caHint = (() => {
    if (state.mode_ca === "TTC") {
      return "Saisissez le montant toutes taxes comprises - WYMBY deduira automatiquement la TVA.";
    }
    if (state.tva_deja_applicable === true) {
      return "Saisissez le montant hors taxes (HT) - sans la TVA que vous avez collectee.";
    }
    return "En franchise de TVA, vos recettes sont en HT (montant facture = montant encaisse).";
  })();
  const microThreshold = (() => {
    if (state.type_activite === "commerce") {
      return FISCAL_PARAMS_2026.micro.CFG_SEUIL_CA_MICRO_BIC_VENTE;
    }
    if (state.type_activite === "location") {
      return FISCAL_PARAMS_2026.micro.CFG_SEUIL_CA_MICRO_LMNP_CLASSIQUE;
    }
    return FISCAL_PARAMS_2026.micro.CFG_SEUIL_CA_MICRO_BNC;
  })();
  const tvaThresholds = (() => {
    if (state.type_activite === "sante_medecin" || state.type_activite === "sante_paramedicale") {
      return null;
    }
    if (state.type_activite === "commerce") {
      return {
        franchise: FISCAL_PARAMS_2026.tva.CFG_SEUIL_TVA_FRANCHISE_BIC_VENTE,
        tolerance: FISCAL_PARAMS_2026.tva.CFG_SEUIL_TVA_TOLERANCE_BIC_VENTE,
      };
    }
    if (state.type_activite === "artiste") {
      return {
        franchise: FISCAL_PARAMS_2026.tva.CFG_SEUIL_TVA_ARTISTE_AUTEUR,
        tolerance: FISCAL_PARAMS_2026.tva.CFG_SEUIL_TVA_TOLERANCE_ARTISTE_AUTEUR,
      };
    }
    return {
      franchise: FISCAL_PARAMS_2026.tva.CFG_SEUIL_TVA_FRANCHISE_BNC,
      tolerance: FISCAL_PARAMS_2026.tva.CFG_SEUIL_TVA_TOLERANCE_BNC,
    };
  })();
  const rspmStatus = (() => {
    if (state.type_activite !== "sante_medecin" || state.statut_exercice_sante !== "remplacant") {
      return null;
    }
    const tranche1 = FISCAL_PARAMS_2026.sante.CFG_TAUX_SOCIAL_RSPM.tranche_1.a ?? 0;
    const tranche2 = FISCAL_PARAMS_2026.sante.CFG_TAUX_SOCIAL_RSPM.tranche_2.a ?? 0;
    if (caNum <= 0) return null;
    if (caNum <= tranche1) {
      return {
        tone: "positive",
        message: `CA dans la 1re tranche RSPM (${formatCurrency(tranche1)} EUR max) : regime simplifie encore envisageable.`,
      };
    }
    if (caNum <= tranche2) {
      return {
        tone: "info",
        message: `CA dans la 2e tranche RSPM (jusqu'a ${formatCurrency(tranche2)} EUR) : maintien possible en RSPM avec taux intermediaire.`,
      };
    }
    return {
      tone: "warning",
      message: `CA au-dessus de ${formatCurrency(tranche2)} EUR : bascule vers le regime PAMC a anticiper pour un medecin remplacant.`,
    };
  })();
  const retrocessionValidation = (() => {
    if (!shouldShowRetrocession || retrocessionNum <= 0) return null;
    if (state.mode_retrocession === "percent") {
      if (retrocessionNum > 100) {
        return {
          tone: "warning",
          message: "La retrocession ne peut pas depasser 100 % du chiffre d'affaires.",
        };
      }
      return {
        tone: "info",
        message: `Retrocession estimee a environ ${formatCurrency((caNum * retrocessionNum) / 100)} EUR par an.`,
      };
    }
    if (caNum > 0 && retrocessionNum > caNum) {
      return {
        tone: "warning",
        message: "La retrocession saisie depasse le chiffre d'affaires annuel prevu.",
      };
    }
    if (caNum > 0) {
      return {
        tone: "info",
        message: `La retrocession represente environ ${((retrocessionNum / caNum) * 100).toFixed(1)} % du chiffre d'affaires.`,
      };
    }
    return null;
  })();
  const chargesValidation = (() => {
    const chargesSaisies = totalCharges > 0 ? totalCharges : parseAmount(state.charges_annuelles);
    if (!state.a_des_charges || chargesSaisies <= 0 || caNum <= 0) return null;
    if (chargesSaisies > caNum) {
      return {
        tone: "warning",
        message: "Vos depenses depassent le chiffre d'affaires saisi. Verifiez qu'il ne s'agit pas d'un montant mensuel.",
      };
    }
    return null;
  })();

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
                onChange={(event) => onChange({ ca_annuel: event.target.value })}
                autoFocus
              />
              <span className="input-suffix">EUR</span>
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
          <p className="field-hint">{caHint}</p>
          {caNum > 0 && (
            <div className="ca-badges">
              <div
                className={`field-validation ${
                  caNum <= microThreshold
                    ? "field-validation-positive"
                    : "field-validation-warning"
                }`}
              >
                {caNum <= microThreshold ? (
                  <>
                    CA compatible avec le regime micro. Seuil 2026 :{" "}
                    <strong>{formatCurrency(microThreshold)} EUR</strong>.
                  </>
                ) : (
                  <>
                    Au-dessus du seuil micro de{" "}
                    <strong>{formatCurrency(microThreshold)} EUR</strong>.
                  </>
                )}
              </div>

              {tvaThresholds === null ? (
                <div className="field-validation field-validation-positive">
                  Activite traitee comme <strong>exoneree de TVA</strong>.
                </div>
              ) : (
                <div
                  className={`field-validation ${
                    caNum < tvaThresholds.franchise
                      ? "field-validation-positive"
                      : caNum <= tvaThresholds.tolerance
                        ? "field-validation-info"
                        : "field-validation-warning"
                  }`}
                >
                  {caNum < tvaThresholds.franchise ? (
                    <>
                      Sous la franchise TVA de{" "}
                      <strong>{formatCurrency(tvaThresholds.franchise)} EUR</strong>.
                    </>
                  ) : caNum <= tvaThresholds.tolerance ? (
                    <>
                      Au-dessus de la franchise TVA, sortie a anticiper.
                    </>
                  ) : (
                    <>
                      Au-dessus du seuil majore TVA : sortie immediate possible.
                    </>
                  )}
                </div>
              )}

              {rspmStatus && (
                <div className={`field-validation field-validation-${rspmStatus.tone}`}>
                  {rspmStatus.message}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="field">
          <label>Quelle est votre certitude sur ce montant ?</label>
          <div className="toggle-group">
            {CERTITUDES.map((certainty) => (
              <button
                key={certainty.value}
                type="button"
                    className={`toggle-btn ${
                      state.certitude_ca ===
                      (certainty.value === "certain" || certainty.value === "faible"
                        ? certainty.value
                        : "estimé")
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      onChange({
                        certitude_ca:
                          certainty.value === "certain" || certainty.value === "faible"
                            ? certainty.value
                            : "estimé",
                      })
                    }
              >
                {certainty.label}
              </button>
            ))}
          </div>
        </div>

        {shouldShowRetrocession && (
          <div className="field">
              <label>Retrocession annuelle</label>
              <div className="ca-row">
                <div className="input-suffix-wrap" style={{ flex: 1 }}>
                  <input
                    type="number"
                    min="0"
                    placeholder={state.mode_retrocession === "percent" ? "ex. 25" : "ex. 30 000"}
                    value={state.charges_retrocession}
                    onChange={(event) => onChange({ charges_retrocession: event.target.value })}
                  />
                  <span className="input-suffix">
                    {state.mode_retrocession === "percent" ? "%" : "EUR / an"}
                  </span>
                </div>
                <div className="toggle-group" style={{ flexShrink: 0 }}>
                  <button
                    type="button"
                    className={`toggle-btn ${state.mode_retrocession === "euros" ? "active" : ""}`}
                    onClick={() => onChange({ mode_retrocession: "euros" })}
                  >
                    EUR
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${state.mode_retrocession === "percent" ? "active" : ""}`}
                    onClick={() => onChange({ mode_retrocession: "percent" })}
                  >
                    %
                  </button>
                </div>
              </div>
              <span className="hint">
                {state.mode_retrocession === "percent"
                  ? "Part du chiffre d'affaires reversee en retrocession — traitee comme une charge pro deductible."
                  : "Montant annuel verse en retrocession — traite comme une charge pro deductible."}
              </span>
              {retrocessionValidation && (
                <div className={`field-validation field-validation-${retrocessionValidation.tone}`} style={{ marginTop: "0.5rem" }}>
                  {retrocessionValidation.message}
                </div>
              )}
          </div>
        )}

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
                  mode_saisie_charges: "",
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

        {state.a_des_charges === true && (
          <div className="field field-indent">
            <label>Comment souhaitez-vous les saisir ?</label>
            <div className="toggle-group">
              <button
                type="button"
                className={`toggle-btn ${state.mode_saisie_charges === "global" ? "active" : ""}`}
                onClick={() =>
                  onChange({
                    mode_saisie_charges: "global",
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
                Montant global
              </button>
              <button
                type="button"
                className={`toggle-btn ${state.mode_saisie_charges === "detail" ? "active" : ""}`}
                onClick={() =>
                  onChange({
                    mode_saisie_charges: "detail",
                    charges_annuelles: "",
                  })
                }
              >
                Par categorie
              </button>
            </div>
          </div>
        )}

        {state.a_des_charges === true && state.mode_saisie_charges === "global" && (
          <div className="field field-indent">
            <label>Total des depenses professionnelles</label>
            <div className="input-suffix-wrap">
              <input
                type="number"
                min="0"
                placeholder="ex. 8 000"
                value={state.charges_annuelles}
                onChange={(event) => onChange({ charges_annuelles: event.target.value })}
              />
              <span className="input-suffix">EUR / an</span>
            </div>
            {chargesValidation && (
              <div className={`field-validation field-validation-${chargesValidation.tone}`}>
                {chargesValidation.message}
              </div>
            )}
          </div>
        )}

        {shouldShow("charges_detail", state) && (
          <div className="charges-detail">
            <p className="charges-detail-intro">Repartissez vos depenses par categorie :</p>
            {chargeCategories.map((category) => (
              <div className="field field-sub" key={category.key}>
                <label>{category.label}</label>
                <div className="input-suffix-wrap">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={state[category.key]}
                    onChange={(event) =>
                      onChange({ [category.key]: event.target.value } as Partial<WizardState>)
                    }
                  />
                  <span className="input-suffix">EUR / an</span>
                </div>
                <span className="hint">{category.hint}</span>
              </div>
            ))}

            <div className="charges-total">
              Total annuel estime : <strong>{formatCurrency(totalCharges)} EUR</strong>
            </div>
            {chargesValidation && (
              <div className={`field-validation field-validation-${chargesValidation.tone}`}>
                {chargesValidation.message}
              </div>
            )}
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
            Pertinent surtout pour les regimes reels ou les investissements materiels importants.
          </span>
        </div>

        {shouldShow("amortissements", state) && (
          <div className="charges-detail">
            <p className="charges-detail-intro">
              Repartissez vos dotations aux amortissements par categorie :
            </p>
            {AMORTISSEMENT_CATEGORIES.map((category) => (
              <div className="field field-sub" key={category.key}>
                <label>{category.label}</label>
                <div className="input-suffix-wrap">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={state[category.key]}
                    onChange={(event) =>
                      onChange({ [category.key]: event.target.value } as Partial<WizardState>)
                    }
                  />
                  <span className="input-suffix">EUR / an</span>
                </div>
                <span className="hint">{category.hint}</span>
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
                    onChange={(event) => onChange({ amortissements_annuels: event.target.value })}
                  />
                  <span className="input-suffix">EUR / an</span>
                </div>
                <span className="hint">
                  A utiliser uniquement si vous preferez saisir un total plutot qu'un detail.
                </span>
              </div>
            )}

            <div className="charges-total">
              Total amortissements annuels : <strong>{formatCurrency(totalAmortissements)} EUR</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
