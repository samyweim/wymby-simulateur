import { useEffect } from "react";
import { FISCAL_PARAMS_2026 } from "@wymby/config";
import type { WizardState } from "../types.js";
import { resolveZoneFromCodePostal } from "../../data/zones_cp.js";
import { shouldShow } from "../visibility.js";
import "./Step.css";

interface Props {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}

function parseAmount(value: string): number {
  return parseFloat(value) || 0;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("fr-FR");
}

function isTvaExonereeSante(state: WizardState): boolean {
  return state.type_activite === "sante_medecin" || state.type_activite === "sante_paramedicale";
}

function shouldAskTresorerieObjective(state: WizardState): boolean {
  const caNum = parseAmount(state.ca_annuel);
  const isEligibleActivity =
    caNum > 40_000 &&
    state.statut_exercice_sante !== "remplacant" &&
    shouldShow("envisage_associes", state);

  return isEligibleActivity;
}

export function Step3Aides({ state, onChange }: Props) {
  const caNum = parseAmount(state.ca_annuel);
  const droitsAre = parseAmount(state.droits_are_restants);
  const tvaSeuils =
    isTvaExonereeSante(state)
      ? null
      : state.type_activite === "commerce"
        ? {
            franchise: FISCAL_PARAMS_2026.tva.CFG_SEUIL_TVA_FRANCHISE_BIC_VENTE,
            tolerance: FISCAL_PARAMS_2026.tva.CFG_SEUIL_TVA_TOLERANCE_BIC_VENTE,
          }
        : state.type_activite === "artiste"
          ? {
              franchise: FISCAL_PARAMS_2026.tva.CFG_SEUIL_TVA_ARTISTE_AUTEUR,
              tolerance: FISCAL_PARAMS_2026.tva.CFG_SEUIL_TVA_TOLERANCE_ARTISTE_AUTEUR,
            }
          : {
              franchise: FISCAL_PARAMS_2026.tva.CFG_SEUIL_TVA_FRANCHISE_BNC,
              tolerance: FISCAL_PARAMS_2026.tva.CFG_SEUIL_TVA_TOLERANCE_BNC,
            };
  const zone = state.code_postal.length === 5 ? resolveZoneFromCodePostal(state.code_postal) : "aucune";
  const arceEstimate = droitsAre * FISCAL_PARAMS_2026.aides.CFG_TAUX_ARCE;
  const showTresorerieObjective = shouldAskTresorerieObjective(state);
  const isExonereeSante = isTvaExonereeSante(state);

  useEffect(() => {
    if (isExonereeSante && state.tva_deja_applicable !== false) {
      onChange({ tva_deja_applicable: false });
    }
  }, [isExonereeSante]);

  return (
    <div className="step">
      <div className="step-header">
        <h2>Aides et situations particulieres</h2>
        <p>Ces dispositifs peuvent reduire significativement vos charges la premiere annee.</p>
      </div>

      <div className="step-fields">
        {state.est_deja_en_activite === false && (
          <div className="field-notice">
            Votre profil indique une creation ou reprise d'activite. Les aides au demarrage
            (ACRE, ARCE) sont prises en compte automatiquement si applicable.
            {(state.type_activite === "sante_medecin" ||
              state.type_activite === "sante_paramedicale") && (
              <> L'ACRE est compatible avec l'installation libérale médicale et paramédicale.</>
            )}
          </div>
        )}

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
          <div className="field field-indent field-split">
            <div className="field-main">
              <label>Droits ARE restants</label>
              <div className="input-suffix-wrap">
                <input
                  type="number"
                  min="0"
                  placeholder="ex. 18 000"
                  value={state.droits_are_restants}
                  onChange={(e) => onChange({ droits_are_restants: e.target.value })}
                />
                <span className="input-suffix">EUR</span>
              </div>
              <span className="hint">
                Utilise pour estimer l'ARCE comme flux de tresorerie distinct.
              </span>
            </div>
            {droitsAre > 0 && (
              <div className="field-side">
                <div className="field-validation field-validation-info">
                  ARCE potentielle : <strong>{formatCurrency(arceEstimate)} EUR</strong>.
                </div>
              </div>
            )}
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
          {state.code_postal.length === 5 && zone !== "aucune" && (
            <div className="field-zone-detected">
              Zone detectee : <strong>{zone}</strong> - exoneration applicable a votre dossier.
            </div>
          )}
          <span className="hint">
            Utilise pour detecter automatiquement une zone d'exoneration fiscale (ZFRR, QPV...).
          </span>
        </div>

        {shouldShow("envisage_associes", state) && (
          <div className="field">
            <label>Souhaitez-vous comparer avec une structure en societe (SASU, EURL) ?</label>
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
                Non, je reste en entreprise individuelle
              </button>
            </div>
            <span className="hint">
              Si vous travaillez seul et ne prevoyez pas de creer une societe, repondez Non. Une societe peut etre avantageuse a partir d'un certain niveau de revenus — WYMBY le detecte automatiquement si vous repondez Oui.
            </span>
          </div>
        )}

        {shouldShow("envisage_associes", state) && state.envisage_associes === true && (
          <div className="field field-indent">
            <label>Capital social envisage</label>
            <div className="input-suffix-wrap">
              <input
                type="number"
                min="0"
                placeholder="ex. 1 000"
                value={state.capital_social}
                onChange={(e) => onChange({ capital_social: e.target.value })}
              />
              <span className="input-suffix">EUR</span>
            </div>
            <span className="hint">
              Permet d'affiner le calcul EURL/SASU (franchise dividendes TNS). Peut etre symbolique : 1 EUR.
            </span>
          </div>
        )}

        {showTresorerieObjective && (
          <div className="field field-substep">
            <div className="field-substep-head">
              <div>
                <label>Quelle est votre priorite financiere ?</label>
                <p className="field-substep-intro">
                  Cette preference aide a mieux classer les structures IS si elles
                  deviennent pertinentes pour votre profil.
                </p>
              </div>
            </div>
            <div className="toggle-group toggle-group-stack-mobile radio-grid-emphasis">
              <button
                type="button"
                className={`toggle-btn ${
                  state.objectif_tresorerie === "flux_mensuel" ? "active" : ""
                }`}
                onClick={() => onChange({ objectif_tresorerie: "flux_mensuel" })}
              >
                Maximiser ce que je touche chaque mois
              </button>
              <button
                type="button"
                className={`toggle-btn ${
                  state.objectif_tresorerie === "capitalisation" ? "active" : ""
                }`}
                onClick={() => onChange({ objectif_tresorerie: "capitalisation" })}
              >
                Construire une reserve en societe
              </button>
              <button
                type="button"
                className={`toggle-btn ${state.objectif_tresorerie === null ? "active" : ""}`}
                onClick={() => onChange({ objectif_tresorerie: null })}
              >
                Pas de preference pour l'instant
              </button>
            </div>
            <span className="hint">
              Flux mensuel favorise les revenus reguliers. Capitalisation favorise les
              structures IS avec accumulation puis distribution ponctuelle.
            </span>
          </div>
        )}

        {shouldShow("tva_question", state) && (
          isExonereeSante ? (
            <div className="field">
              <label>Facturez-vous la TVA a vos clients ?</label>
              <div className="field-validation field-validation-positive">
                <strong>Exoneree de TVA de plein droit</strong> — professions de sante reglementees, vous ne facturez pas la TVA a vos patients.
              </div>
              <span className="hint">
                Vous pouvez modifier cette reponse si votre situation est atypique, mais c'est deconseille dans la grande majorite des cas.
              </span>
              <div className="toggle-group toggle-group-stack-mobile">
                <button
                  type="button"
                  className={`toggle-btn ${state.tva_deja_applicable === true ? "active" : ""}`}
                  onClick={() => onChange({ tva_deja_applicable: true })}
                >
                  Oui, je facture la TVA
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${state.tva_deja_applicable === false ? "active" : ""}`}
                  onClick={() => onChange({ tva_deja_applicable: false })}
                >
                  Non, je suis exoneree de TVA
                </button>
              </div>
            </div>
          ) : (
            <div className="field field-split">
              <div className="field-main">
                <label>Facturez-vous la TVA a vos clients ?</label>
                <span className="hint">
                  Si votre chiffre d'affaires annuel est inferieur a un certain seuil (franchise en
                  base), vous n'etes pas oblige de facturer la TVA.
                </span>
                <div className="toggle-group toggle-group-stack-mobile">
                  <button
                    type="button"
                    className={`toggle-btn ${state.tva_deja_applicable === true ? "active" : ""}`}
                    onClick={() => onChange({ tva_deja_applicable: true })}
                  >
                    Oui, je facture la TVA
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${state.tva_deja_applicable === false ? "active" : ""}`}
                    onClick={() => onChange({ tva_deja_applicable: false })}
                  >
                    Non, je suis en franchise de TVA
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${state.tva_deja_applicable === null ? "active" : ""}`}
                    onClick={() => onChange({ tva_deja_applicable: null })}
                  >
                    Je ne sais pas
                  </button>
                </div>

                {state.tva_deja_applicable === null && caNum > 0 && (
                  <div className="field-info">
                    Vous pouvez laisser cette option sur "Je ne sais pas" : le simulateur
                    l'estimera a partir de votre CA et de votre activite.
                  </div>
                )}
              </div>
              {!!tvaSeuils && caNum > 0 && (
                <div className="field-side">
                  <div
                    className={`field-validation ${
                      caNum < tvaSeuils.franchise
                        ? "field-validation-positive"
                        : caNum <= tvaSeuils.tolerance
                          ? "field-validation-info"
                          : "field-validation-warning"
                    }`}
                  >
                    {caNum < tvaSeuils.franchise ? (
                      <>
                        Sous la franchise TVA de <strong>{formatCurrency(tvaSeuils.franchise)} EUR</strong>.
                      </>
                    ) : caNum <= tvaSeuils.tolerance ? (
                      <>
                        Au-dessus de la franchise TVA, sortie a surveiller.
                      </>
                    ) : (
                      <>
                        Au-dessus du seuil majore TVA.
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
