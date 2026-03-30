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
          <div className="field field-indent">
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
            {droitsAre > 0 && (
              <div className="field-validation field-validation-info">
                ARCE potentielle estimee : <strong>{formatCurrency(arceEstimate)} EUR</strong>,
                soit {Math.round(FISCAL_PARAMS_2026.aides.CFG_TAUX_ARCE * 100)} % des droits restants.
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
            <label>Envisagez-vous d'avoir des associes ou des salaries ?</label>
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
                Non / Pas encore
              </button>
            </div>
            <span className="hint">
              Cette information permet d'inclure les structures en societe dans la comparaison.
            </span>
          </div>
        )}

        {state.envisage_associes === true && (
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
              Montant du capital que vous apportez a la societe (peut etre symbolique : 1 EUR).
            </span>
          </div>
        )}

        {shouldShow("tva_question", state) && (
          <div className="field">
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

            {isTvaExonereeSante(state) && (
              <div className="field-validation field-validation-positive">
                Votre activite releve ici d'un regime <strong>exonere de TVA</strong>.
              </div>
            )}

            {!isTvaExonereeSante(state) && tvaSeuils && caNum > 0 && (
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
                    Sous le seuil de franchise TVA de{" "}
                    <strong>{formatCurrency(tvaSeuils.franchise)} EUR</strong>.
                  </>
                ) : caNum <= tvaSeuils.tolerance ? (
                  <>
                    Au-dessus du seuil de franchise TVA de{" "}
                    <strong>{formatCurrency(tvaSeuils.franchise)} EUR</strong> : une sortie de
                    franchise est a surveiller.
                  </>
                ) : (
                  <>
                    Au-dessus du seuil majore TVA de{" "}
                    <strong>{formatCurrency(tvaSeuils.tolerance)} EUR</strong> : la TVA doit en
                    principe s'appliquer immediatement.
                  </>
                )}
              </div>
            )}

            {state.tva_deja_applicable === null && caNum > 0 && (
              <div className="field-info">
                {isTvaExonereeSante(state) ? (
                  <>
                    Vous pouvez laisser cette option telle quelle : le simulateur traitera
                    l'activite comme <strong>exoneree de TVA</strong>.
                  </>
                ) : (
                  <>
                    Vous pouvez laisser cette option sur "Je ne sais pas" : le simulateur
                    l'estimera a partir de votre CA et de votre activite.
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
