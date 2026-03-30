import { useState } from "react";
import type { EngineLog } from "@wymby/types";
import type { InputsNormalises } from "@wymby/types";

interface Props {
  inputs: InputsNormalises;
  logs: EngineLog[];
}

const LEVEL_COLORS: Record<string, string> = {
  info: "#0077cc",
  debug: "#666",
  trace: "#999",
  warn: "#cc7700",
  error: "#cc0000",
};

export function DebugPanel({ inputs, logs }: Props) {
  const [inputsOpen, setInputsOpen] = useState(true);
  const [logsOpen, setLogsOpen] = useState(false);

  return (
    <div style={{ fontFamily: "monospace", fontSize: "12px", background: "#1a1a1a", color: "#d4d4d4", padding: "1rem", borderRadius: "8px", marginTop: "2rem" }}>
      <h3 style={{ color: "#e8c840", margin: "0 0 1rem 0", fontSize: "14px" }}>
        🛠 Debug Panel — <span style={{ color: "#888", fontWeight: "normal" }}>?debug=true</span>
      </h3>

      {/* Inputs normalisés */}
      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={() => setInputsOpen((v) => !v)}
          style={{ background: "none", border: "1px solid #444", color: "#d4d4d4", cursor: "pointer", padding: "4px 8px", borderRadius: "4px", fontFamily: "monospace", fontSize: "12px" }}
        >
          {inputsOpen ? "▲" : "▼"} Entrées normalisées
        </button>
        {inputsOpen && (
          <pre style={{ background: "#111", padding: "0.75rem", borderRadius: "4px", marginTop: "0.5rem", overflow: "auto", maxHeight: "300px", fontSize: "11px" }}>
            {JSON.stringify(inputs, null, 2)}
          </pre>
        )}
      </div>

      {/* Logs */}
      <div>
        <button
          onClick={() => setLogsOpen((v) => !v)}
          style={{ background: "none", border: "1px solid #444", color: "#d4d4d4", cursor: "pointer", padding: "4px 8px", borderRadius: "4px", fontFamily: "monospace", fontSize: "12px" }}
        >
          {logsOpen ? "▲" : "▼"} Logs moteur ({logs.length} entrées)
        </button>
        {logsOpen && (
          <div style={{ marginTop: "0.5rem", maxHeight: "500px", overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
              <thead>
                <tr style={{ background: "#333", position: "sticky", top: 0 }}>
                  <th style={{ padding: "4px 8px", textAlign: "left", border: "1px solid #444" }}>Étape</th>
                  <th style={{ padding: "4px 8px", textAlign: "left", border: "1px solid #444" }}>Niveau</th>
                  <th style={{ padding: "4px 8px", textAlign: "left", border: "1px solid #444" }}>Message</th>
                  <th style={{ padding: "4px 8px", textAlign: "left", border: "1px solid #444" }}>Détail</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #2a2a2a" }}>
                    <td style={{ padding: "3px 8px", border: "1px solid #333", color: "#888" }}>{log.step}</td>
                    <td style={{ padding: "3px 8px", border: "1px solid #333", color: LEVEL_COLORS[log.level] ?? "#d4d4d4", fontWeight: "bold" }}>{log.level}</td>
                    <td style={{ padding: "3px 8px", border: "1px solid #333" }}>
                      {log.message}
                      {log.scenario_id && <span style={{ color: "#6a9fb5", marginLeft: "4px" }}>@{log.scenario_id}</span>}
                    </td>
                    <td style={{ padding: "3px 8px", border: "1px solid #333", color: "#b5cea8" }}>
                      {log.detail ? JSON.stringify(log.detail).slice(0, 100) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
