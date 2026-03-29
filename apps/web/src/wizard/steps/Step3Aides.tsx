import type { WizardState } from "../types.js";
import { TooltipFiscal } from "../../components/TooltipFiscal.js";
import "./Step.css";

interface Props {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}

const ZONES = [
  { value: "aucune", label: "Aucune zone spéciale" },
  { value: "ZFRR", label: "Zone France Ruralités Revitalisées" },
  { value: "ZFRR_PLUS", label: "ZFRR renforcée (ZFRR+)" },
  { value: "QPV", label: "Quartier Prioritaire (QPV)" },
] as const;

export function Step3Aides({ state, onChange }: Props) {
  return (
    <div className="step">
      <div className="step-header">
        <h2>Aides et situations particulières</h2>
        <p>Ces dispositifs peuvent réduire significativement vos charges la première année.</p>
      </div>

      <div className="step-fields">
        {/* Création */}
        <div className="field">
          <label>
            Êtes-vous en train de créer ou reprendre une activité ?
          </label>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${state.est_creation === true ? "active" : ""}`}
              onClick={() => onChange({ est_creation: true })}
            >Oui</button>
            <button
              type="button"
              className={`toggle-btn ${state.est_creation === false ? "active" : ""}`}
              onClick={() => onChange({ est_creation: false })}
            >Non</button>
          </div>
          <span className="hint">
            Si oui, vous pouvez bénéficier de l'
            <TooltipFiscal term="ACRE">
              <strong>ACRE</strong> — Aide à la Création ou Reprise d'Entreprise. Réduction de vos cotisations
              sociales pendant 12 mois (taux max 50 % jusqu'au 01/07/2026, puis 25 %).
            </TooltipFiscal>
            .
          </span>
        </div>

        {/* Chômage / ARCE */}
        <div className="field">
          <label>Percevez-vous des allocations chômage (ARE) ?</label>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${state.percoit_chomage === true ? "active" : ""}`}
              onClick={() => onChange({ percoit_chomage: true })}
            >Oui</button>
            <button
              type="button"
              className={`toggle-btn ${state.percoit_chomage === false ? "active" : ""}`}
              onClick={() => onChange({ percoit_chomage: false, droits_are_restants: "" })}
            >Non</button>
          </div>
          <span className="hint">
            Vous pouvez opter pour l'
            <TooltipFiscal term="ARCE">
              <strong>ARCE</strong> — Aide à la Reprise et à la Création d'Entreprise. Vous recevez 60 % de
              vos droits ARE restants en capital (2 versements), au lieu de les percevoir mensuellement.
            </TooltipFiscal>
            {" "}au lieu du maintien mensuel.
          </span>
        </div>

        {state.percoit_chomage && (
          <div className="field field-indent">
            <label>Droits ARE restants (capital total non versé)</label>
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
            <span className="hint">À trouver sur votre espace Pôle Emploi / France Travail.</span>
          </div>
        )}

        {/* Zone géographique */}
        <div className="field">
          <label>Êtes-vous implanté dans une zone spéciale ?</label>
          <div className="radio-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {ZONES.map((z) => (
              <label className="radio-card" key={z.value}>
                <input
                  type="radio"
                  name="zone_speciale"
                  value={z.value}
                  checked={state.zone_speciale === z.value}
                  onChange={() => onChange({ zone_speciale: z.value })}
                />
                <div className="radio-label">
                  <span className="radio-title">{z.label}</span>
                </div>
              </label>
            ))}
          </div>
          <span className="hint">
            Ces zones ouvrent droit à des exonérations d'impôt sur les bénéfices.
            Consultez <a href="https://www.data.gouv.fr/fr/datasets/zonages-des-politiques-de-la-ville/" target="_blank" rel="noreferrer">data.gouv.fr</a> pour vérifier votre commune.
          </span>
        </div>

        {/* TVA */}
        <div className="field">
          <label>Êtes-vous déjà soumis à la TVA ?</label>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${state.tva_deja_applicable === true ? "active" : ""}`}
              onClick={() => onChange({ tva_deja_applicable: true })}
            >Oui</button>
            <button
              type="button"
              className={`toggle-btn ${state.tva_deja_applicable === false ? "active" : ""}`}
              onClick={() => onChange({ tva_deja_applicable: false })}
            >Non / Franchise de TVA</button>
          </div>
          <span className="hint">
            La franchise de base dispense de collecter et déclarer la TVA si votre CA reste sous un certain seuil.
          </span>
        </div>
      </div>
    </div>
  );
}
