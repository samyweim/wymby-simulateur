import { FISCAL_PARAMS_2026 } from "@wymby/config";
import type { WizardState } from "../types.js";
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

function getParts(state: WizardState): number {
  const base = state.situation_familiale === "en_couple" ? 2 : state.situation_familiale === "seul" ? 1 : 0;
  if (base === 0) return 0;
  if (state.nb_enfants <= 0) return base;
  if (state.nb_enfants === 1) return base + 0.5;
  if (state.nb_enfants === 2) return base + 1;
  return base + 2;
}

export function Step2Foyer({ state, onChange }: Props) {
  const nbParts = getParts(state);
  const autresRevenus = parseAmount(state.autres_revenus_foyer);
  const rfr = parseAmount(state.rfr_n2);
  const seuilVfl = nbParts > 0 ? FISCAL_PARAMS_2026.vfl.CFG_FORMULE_SEUIL_RFR_VFL(nbParts) : 0;

  return (
    <div className="step">
      <div className="step-header">
        <h2>Votre situation personnelle</h2>
        <p>Ces informations permettent de calculer votre impot sur le revenu avec plus de precision.</p>
      </div>

      <div className="step-fields">
        <div className="field">
          <label>Situation familiale</label>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${state.situation_familiale === "seul" ? "active" : ""}`}
              onClick={() => onChange({ situation_familiale: "seul" })}
            >
              Celibataire / divorce(e)
            </button>
            <button
              type="button"
              className={`toggle-btn ${state.situation_familiale === "en_couple" ? "active" : ""}`}
              onClick={() => onChange({ situation_familiale: "en_couple" })}
            >
              Marie(e) ou pacse(e)
            </button>
          </div>
        </div>

        <div className="field">
          <label>Nombre d'enfants a charge</label>
          <div className="toggle-group">
            {[0, 1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                className={`toggle-btn ${state.nb_enfants === n ? "active" : ""}`}
                onClick={() => onChange({ nb_enfants: n })}
              >
                {n === 3 ? "3 ou plus" : n.toString()}
              </button>
            ))}
          </div>
          <span className="hint">Chaque enfant reduit votre impot via le quotient familial.</span>
          {nbParts > 0 && (
            <div className="field-validation field-validation-info" style={{ marginTop: "0.5rem" }}>
              Foyer estime a <strong>{nbParts}</strong> part{nbParts > 1 ? "s" : ""} fiscale
              {nbParts > 1 ? "s" : ""}.
            </div>
          )}
        </div>

        <div className="field">
          <label>Votre foyer a-t-il d'autres revenus en 2026 ?</label>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${state.a_autres_revenus === true ? "active" : ""}`}
              onClick={() => onChange({ a_autres_revenus: true })}
            >
              Oui
            </button>
            <button
              type="button"
              className={`toggle-btn ${state.a_autres_revenus === false ? "active" : ""}`}
              onClick={() => onChange({ a_autres_revenus: false, autres_revenus_foyer: "" })}
            >
              Non
            </button>
          </div>
          <span className="hint">Salaire du conjoint, revenus locatifs, revenus de capitaux...</span>
        </div>

        {state.a_autres_revenus && (
          <div className="field field-indent">
            <label>Autres revenus imposables du foyer (hors votre activite)</label>
            <div className="input-suffix-wrap">
              <input
                type="number"
                min="0"
                placeholder="ex. 35 000"
                value={state.autres_revenus_foyer}
                onChange={(e) => onChange({ autres_revenus_foyer: e.target.value })}
              />
              <span className="input-suffix">EUR / an</span>
            </div>
            {autresRevenus > 0 && (
              <div className="field-validation field-validation-info">
                Ces revenus seront integres au calcul de l'impot du foyer et peuvent reduire
                l'interet de certains regimes a l'IR.
              </div>
            )}
          </div>
        )}

        <div className="field">
          <label>Aviez-vous des revenus imposables en 2023 ?</label>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${state.avait_revenus_n2 === true ? "active" : ""}`}
              onClick={() => onChange({ avait_revenus_n2: true })}
            >
              Oui
            </button>
            <button
              type="button"
              className={`toggle-btn ${state.avait_revenus_n2 === false ? "active" : ""}`}
              onClick={() => onChange({ avait_revenus_n2: false, connait_rfr: null, rfr_n2: "" })}
            >
              Non
            </button>
          </div>
          <span className="hint">
            Necessaire pour verifier l'eligibilite au versement liberatoire de l'impot.
          </span>
          {state.avait_revenus_n2 === false && (
            <div className="field-validation field-validation-positive">
              Sans revenus imposables en 2023, la condition de RFR pour le versement liberatoire
              n'est en pratique pas bloquante.
            </div>
          )}
        </div>

        {state.avait_revenus_n2 === true && (
          <>
            <div className="field">
              <label>Connaissez-vous votre revenu fiscal de reference 2024 ?</label>
              <div className="toggle-group">
                <button
                  type="button"
                  className={`toggle-btn ${state.connait_rfr === true ? "active" : ""}`}
                  onClick={() => onChange({ connait_rfr: true })}
                >
                  Oui, je l'ai
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${state.connait_rfr === false ? "active" : ""}`}
                  onClick={() => onChange({ connait_rfr: false, rfr_n2: "" })}
                >
                  Non / je ne sais pas
                </button>
              </div>
              <span className="hint">
                Case "RFR" sur votre avis d'imposition 2024 (revenus 2023) -
                <a href="https://www.impots.gouv.fr" target="_blank" rel="noreferrer"> impots.gouv.fr</a>.
              </span>
              {nbParts > 0 && (
                <div className="field-validation field-validation-info" style={{ marginTop: "0.5rem" }}>
                  Seuil VFL estime pour votre foyer : <strong>{formatCurrency(seuilVfl)} EUR</strong>.
                </div>
              )}
            </div>

            {shouldShow("rfr_n2", state) && (
              <div className="field field-indent">
                <label>Revenu fiscal de reference 2024</label>
                <div className="input-suffix-wrap">
                  <input
                    type="number"
                    min="0"
                    placeholder="ex. 42 000"
                    value={state.rfr_n2}
                    onChange={(e) => onChange({ rfr_n2: e.target.value })}
                  />
                  <span className="input-suffix">EUR</span>
                </div>
                <span className="hint">
                  Ou trouver cette valeur : avis d'imposition 2024 (revenus 2023), ligne "Revenu fiscal de reference".
                </span>
                {rfr > 0 && nbParts > 0 && (
                  <div
                    className={`field-validation ${
                      rfr <= seuilVfl ? "field-validation-positive" : "field-validation-warning"
                    }`}
                    style={{ marginTop: "0.5rem" }}
                  >
                    {rfr <= seuilVfl
                      ? "RFR sous le seuil VFL estime."
                      : "RFR au-dessus du seuil VFL estime."}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
