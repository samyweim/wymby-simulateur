import { useState } from "react";
import type { EngineOutput, DetailCalculScenario, UserInput } from "@wymby/types";
import type { InputsNormalises } from "@wymby/types";
import type { RelevanceContext } from "../data/scenario-relevance.js";
import { getScenarioLabel } from "../data/scenario-labels.js";

interface Props {
  inputs: InputsNormalises;
  rawInput?: UserInput;
  output: EngineOutput;
  relevantScenarios?: DetailCalculScenario[];
  lessRelevantScenarios?: DetailCalculScenario[];
  relevanceContext?: RelevanceContext;
  topScenarioIds?: Set<string>;
  getFamily?: (baseId: string) => string;
}

const S = {
  panel: { fontFamily: "monospace", fontSize: "12px", background: "#1a1a1a", color: "#d4d4d4", padding: "1rem", borderRadius: "8px", marginTop: "2rem" } as const,
  title: { color: "#e8c840", margin: "0 0 1rem 0", fontSize: "14px" } as const,
  sectionBtn: { background: "none", border: "1px solid #444", color: "#d4d4d4", cursor: "pointer", padding: "4px 8px", borderRadius: "4px", fontFamily: "monospace", fontSize: "12px", marginBottom: "0.5rem" } as const,
  pre: { background: "#111", padding: "0.75rem", borderRadius: "4px", marginTop: "0.5rem", overflow: "auto", maxHeight: "300px", fontSize: "11px" } as const,
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: "11px" },
  th: { padding: "4px 8px", textAlign: "left" as const, border: "1px solid #444", background: "#333", position: "sticky" as const, top: 0 },
  td: { padding: "3px 8px", border: "1px solid #333" },
  section: { marginBottom: "1rem" },
  badge: (color: string) => ({ display: "inline-block", padding: "1px 6px", borderRadius: "3px", fontSize: "10px", fontWeight: "bold", background: color, color: "#fff", marginLeft: "4px" }),
};

const fmt = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const fmtDec = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

function Section({ label, children, defaultOpen }: { label: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div style={S.section}>
      <button onClick={() => setOpen((v) => !v)} style={S.sectionBtn}>
        {open ? "▲" : "▼"} {label}
      </button>
      {open && children}
    </div>
  );
}

function KVTable({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined && v !== null && v !== "");
  return (
    <table style={S.table}>
      <tbody>
        {entries.map(([k, v]) => (
          <tr key={k}>
            <td style={{ ...S.td, color: "#888", width: "45%" }}>{k}</td>
            <td style={{ ...S.td, color: typeof v === "number" ? "#b5cea8" : typeof v === "boolean" ? (v ? "#4ec9b0" : "#f14c4c") : "#ce9178" }}>
              {typeof v === "number" ? fmtDec.format(v) : String(v)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function DebugPanel({
  inputs,
  rawInput,
  output,
  relevantScenarios,
  lessRelevantScenarios,
  relevanceContext,
  topScenarioIds,
  getFamily,
}: Props) {
  const { calculs_par_scenario, comparaison, recommandation, qualite_resultat, scenarios_exclus } = output;

  const allSorted = [...calculs_par_scenario].sort(
    (a, b) => (b.intermediaires.NET_APRES_IR ?? 0) - (a.intermediaires.NET_APRES_IR ?? 0)
  );

  const relevantIds = new Set((relevantScenarios ?? []).map((s) => s.scenario_id));

  return (
    <div style={S.panel}>
      <h3 style={S.title}>
        Debug Panel —{" "}
        <span style={{ color: "#888", fontWeight: "normal" }}>activer via ?debug dans l'URL</span>
      </h3>

      {/* ── 1. Inputs bruts ─────────────────────────────────────────────────── */}
      {rawInput && (
        <Section label="1. Inputs utilisateur (bruts)" defaultOpen>
          <div style={{ maxHeight: "400px", overflow: "auto", marginTop: "0.5rem" }}>
            <KVTable data={rawInput as unknown as Record<string, unknown>} />
          </div>
        </Section>
      )}

      {/* ── 2. Normalisation ─────────────────────────────────────────────────── */}
      <Section label="2. Normalisation des entrées" defaultOpen>
        <div style={{ marginTop: "0.5rem" }}>
          <KVTable data={{
            SEGMENT: inputs.profil.segment,
            CA_HT_RETENU: inputs.activite.CA_HT_RETENU,
            CA_TTC_RETENU: inputs.activite.CA_TTC_RETENU,
            RECETTES_PRO_RETENUES: inputs.activite.recettes_pro_retenues,
            CHARGES_RETENUES: inputs.activite.charges_retenues,
            TVA_NETTE_DUE: inputs.tva.tva_nette_due,
            REGIME_TVA: inputs.tva.regime_applicable,
            NOMBRE_PARTS_FISCALES: inputs.foyer.nb_parts,
            SITUATION_FAMILIALE: inputs.foyer.situation_familiale,
            AUTRES_REVENUS_FOYER: inputs.foyer.autres_revenus,
            RFR_N2: inputs.foyer.rfr_n2,
            ACRE_ACTIVE: inputs.aides.acre_active,
            ARCE_ACTIVE: inputs.aides.arce_active,
            ZONE_ACTIVE: inputs.aides.zone_active,
          }} />
        </div>
      </Section>

      {/* ── 3. Flags de qualification ────────────────────────────────────────── */}
      <Section label="3. Qualification & flags d'éligibilité" defaultOpen>
        <div style={{ maxHeight: "300px", overflow: "auto", marginTop: "0.5rem" }}>
          <table style={S.table}>
            <tbody>
              {Object.entries(output.qualification.flags).map(([flag, val]) => (
                <tr key={flag}>
                  <td style={{ ...S.td, color: "#888", width: "55%" }}>{flag}</td>
                  <td style={{ ...S.td, color: val ? "#4ec9b0" : "#555", fontWeight: val ? "bold" : "normal" }}>
                    {String(val)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 4. Résultats par scénario (intermediaires complets) ───────────────── */}
      <Section label={`5. Résultats détaillés par scénario (${allSorted.length} calculés)`} defaultOpen>
        <div style={{ maxHeight: "500px", overflow: "auto", marginTop: "0.5rem" }}>
          {allSorted.map((s) => {
            const isRef = s.scenario_id === comparaison.scenario_reference_id;
            const isReco = s.scenario_id === recommandation?.scenario_recommande_id;
            const inter = s.intermediaires;
            return (
              <details key={s.scenario_id} style={{ marginBottom: "0.5rem", background: "#111", borderRadius: "4px", padding: "0.5rem" }}>
                <summary style={{ cursor: "pointer", color: isReco ? "#4ec9b0" : isRef ? "#e8c840" : "#d4d4d4", fontWeight: isReco || isRef ? "bold" : "normal" }}>
                  {s.scenario_id}
                  {isRef && <span style={S.badge("#2a7a4a")}>REF</span>}
                  {isReco && <span style={S.badge("#4a6a8a")}>RECO</span>}
                  <span style={{ color: "#b5cea8", marginLeft: "1rem" }}>NET après IR : {fmt.format(inter.NET_APRES_IR ?? 0)} €</span>
                </summary>
                <div style={{ marginTop: "0.5rem" }}>
                  <table style={S.table}>
                    <tbody>
                      {Object.entries(inter)
                        .filter(([, v]) => v !== undefined)
                        .map(([k, v]) => (
                          <tr key={k}>
                            <td style={{ ...S.td, color: "#888", width: "50%" }}>{k}</td>
                            <td style={{ ...S.td, color: "#b5cea8", fontVariantNumeric: "tabular-nums" }}>
                              {typeof v === "number" ? fmt.format(v) + " €" : String(v)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </details>
            );
          })}
        </div>
      </Section>

      {/* ── 6. Classement final ──────────────────────────────────────────────── */}
      <Section label={`6. Classement final`}>
        <div style={{ maxHeight: "400px", overflow: "auto", marginTop: "0.5rem" }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>#</th>
                <th style={S.th}>ID</th>
                <th style={S.th}>Label</th>
                <th style={S.th}>Famille</th>
                <th style={S.th}>NET après IR</th>
                <th style={S.th}>Fiabilité</th>
                <th style={S.th}>Affichage</th>
              </tr>
            </thead>
            <tbody>
              {allSorted.map((s, i) => {
                const isTop = topScenarioIds?.has(s.scenario_id) ?? false;
                const isRelevant = relevantIds.has(s.scenario_id);
                const isRef = s.scenario_id === comparaison.scenario_reference_id;
                const isReco = s.scenario_id === recommandation?.scenario_recommande_id;
                const isOptimal = s.scenario_id === comparaison.classement_net_apres_ir[0];
                return (
                  <tr key={s.scenario_id} style={{ background: isTop ? "#1e2d1e" : undefined }}>
                    <td style={{ ...S.td, color: "#888" }}>{i + 1}</td>
                    <td style={{ ...S.td, color: "#6a9fb5", fontSize: "10px" }}>{s.scenario_id}</td>
                    <td style={S.td}>
                      {getScenarioLabel(s.base_id).titre}
                      {isRef && <span style={S.badge("#2a7a4a")}>REF</span>}
                      {isReco && <span style={S.badge("#4a6a8a")}>RECO</span>}
                      {isOptimal && <span style={S.badge("#8a6a2a")}>OPTIMAL</span>}
                    </td>
                    <td style={{ ...S.td, color: "#999", fontSize: "10px" }}>{getFamily ? getFamily(s.base_id) : "—"}</td>
                    <td style={{ ...S.td, color: "#b5cea8", fontVariantNumeric: "tabular-nums" }}>
                      {fmt.format(s.intermediaires.NET_APRES_IR ?? 0)} €
                    </td>
                    <td style={{ ...S.td, color: "#888", fontSize: "10px" }}>{s.niveau_fiabilite}</td>
                    <td style={S.td}>
                      {topScenarioIds && (isTop
                        ? <span style={S.badge("#2a6a2a")}>podium</span>
                        : isRelevant
                          ? <span style={{ ...S.badge("#444"), background: "#444" }}>pertinent</span>
                          : <span style={S.badge("#6a2a2a")}>moins pertinent</span>)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 7. Scénarios exclus ──────────────────────────────────────────────── */}
      <Section label={`7. Scénarios exclus (${scenarios_exclus.length})`}>
        <div style={{ maxHeight: "300px", overflow: "auto", marginTop: "0.5rem" }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>ID</th>
                <th style={S.th}>Motif(s)</th>
              </tr>
            </thead>
            <tbody>
              {scenarios_exclus.map((s, i) => (
                <tr key={`${s.scenario_id}-${i}`}>
                  <td style={{ ...S.td, color: "#6a9fb5", fontSize: "10px" }}>{s.scenario_id}</td>
                  <td style={{ ...S.td, color: "#cc7700" }}>{s.motifs_exclusion.join(" — ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 8. Hypothèses & alertes ──────────────────────────────────────────── */}
      <Section label={`8. Hypothèses retenues (${qualite_resultat.hypotheses_retenues.length})`}>
        <ul style={{ margin: "0.5rem 0 0", padding: "0 0 0 1.25rem", fontSize: "11px", lineHeight: "1.6" }}>
          {qualite_resultat.hypotheses_retenues.map((h, i) => <li key={i}>{h}</li>)}
        </ul>
      </Section>

      {qualite_resultat.elements_a_confirmer.length > 0 && (
        <Section label={`Éléments à confirmer (${qualite_resultat.elements_a_confirmer.length})`}>
          <ul style={{ margin: "0.5rem 0 0", padding: "0 0 0 1.25rem", fontSize: "11px", lineHeight: "1.6", color: "#cc7700" }}>
            {qualite_resultat.elements_a_confirmer.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </Section>
      )}

    </div>
  );
}
