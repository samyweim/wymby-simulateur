import type { WizardState } from "../types.js";
import { resolveZoneFromCodePostal } from "../../data/zones_cp.js";
import { shouldShow } from "../visibility.js";
import { FISCAL_PARAMS_2026 } from "@wymby/config";
import "./Step.css";

interface Props {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}

export function Step3Aides({ state, onChange }: Props) {
  const caNum = parseFloat(state.ca_annuel) || 0;
  const tvaSeuil =
    state.type_activite === "commerce"
      ? FISCAL_PARAMS_2026.tva.CFG_SEUIL_TVA_FRANCHISE_BIC_VENTE
      : state.type_activite === "liberal_reglemente" ||
          state.type_activite === "liberal_non_reglemente" ||
          state.type_activite === "sante_medecin" ||
          state.type_activite === "sante_paramedicale" ||
          state.type_activite === "artiste"
        ? FISCAL_PARAMS_2026.tva.CFG_SEUIL_TVA_FRANCHISE_BNC
        : FISCAL_PARAMS_2026.tva.CFG_SEUIL_TVA_FRANCHISE_BIC_SERVICE;
  const tvaProbable = caNum > 0 ? caNum >= tvaSeuil : null;

  return (
    <div className="step">
      <div className="step-header">
        <h2>Aides et situations particulières</h2>
        <p>Ces dispositifs peuvent réduire significativement vos charges la première année.</p>
      </div>

      <div className="step-fields">
        {state.est_deja_en_activite === false && (
          <div className="field-notice">
            Votre profil indique une création ou reprise d'activité. Les aides au démarrage
            (ACRE, ARCE) sont prises en compte automatiquement si applicable.
          </div>
        )}

        <div className="field">
          <label>Percevez-vous des allocations chômage (ARE) ?</label>
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
              <span className="input-suffix">€</span>
            </div>
            <span className="hint">
              Utilisé pour estimer l'ARCE comme flux de trésorerie distinct.
            </span>
          </div>
        )}

        <div className="field">
          <label>Code postal de votre lieu d'activité principal</label>
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
          {state.code_postal.length === 5 && (() => {
            const zone = resolveZoneFromCodePostal(state.code_postal);
            if (zone === "aucune") return null;
            return (
              <div className="field-zone-detected">
                Zone détectée : <strong>{zone}</strong> — exonération applicable à votre dossier.
              </div>
            );
          })()}
          <span className="hint">
            Utilisé pour détecter automatiquement une zone d'exonération fiscale (ZFRR, QPV…).
          </span>
        </div>

        {shouldShow("envisage_associes", state) && (
          <div className="field">
            <label>Envisagez-vous d'avoir des associés ou des salariés ?</label>
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
              Cette information permet d'inclure les structures en société dans la comparaison.
            </span>
          </div>
        )}

        {state.envisage_associes === true && (
          <div className="field field-indent">
            <label>Capital social envisagé</label>
            <div className="input-suffix-wrap">
              <input
                type="number"
                min="0"
                placeholder="ex. 1 000"
                value={state.capital_social}
                onChange={(e) => onChange({ capital_social: e.target.value })}
              />
              <span className="input-suffix">€</span>
            </div>
            <span className="hint">
              Montant du capital que vous apportez à la société (peut être symbolique : 1 €).
            </span>
          </div>
        )}

        {shouldShow("tva_question", state) && (
          <div className="field">
            <label>Facturez-vous la TVA à vos clients ?</label>
            <span className="hint">
              Si votre chiffre d'affaires annuel est inférieur à un certain seuil (franchise en
              base), vous n'êtes pas obligé de facturer la TVA. C'est le cas de la plupart des
              indépendants qui débutent.
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

            {state.tva_deja_applicable === null && tvaProbable !== null && (
              <div className="field-info">
                D'après votre CA déclaré, vous êtes probablement{" "}
                <strong>{tvaProbable ? "assujetti à la TVA" : "en franchise de TVA"}</strong>.
                Vous pouvez laisser cette option, le simulateur l'estimera automatiquement.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
