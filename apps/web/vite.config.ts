import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import type { Plugin, Connect } from "vite";
import type { IncomingMessage, ServerResponse } from "http";

// ─────────────────────────────────────────────────────────────────────────────
// ANSI helpers (Node.js only — Vite plugin runs in Node, not in the browser)
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  // foreground
  white: "\x1b[97m",
  gray: "\x1b[90m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  // background
  bgBlue: "\x1b[44m",
  bgRed: "\x1b[41m",
} as const;

function ansi(...parts: string[]): string {
  return parts.join("") + C.reset;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types partagés avec le client (copiés pour éviter un import cross-boundary)
// ─────────────────────────────────────────────────────────────────────────────

type LogLevel = "info" | "debug" | "trace" | "warn" | "error";

interface EngineLog {
  step: number;
  level: LogLevel;
  message: string;
  scenario_id?: string;
  detail?: Record<string, unknown>;
  timestamp_ms: number;
}

interface LogPayload {
  traceId: string;
  logs: EngineLog[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatage terminal
// ─────────────────────────────────────────────────────────────────────────────

const LEVEL_COLOR: Record<LogLevel, string> = {
  info:  ansi(C.bold, C.cyan,    " INFO  "),
  debug: ansi(C.bold, C.blue,    " DEBUG "),
  trace: ansi(C.bold, C.gray,    " TRACE "),
  warn:  ansi(C.bold, C.yellow,  " WARN  "),
  error: ansi(C.bold, C.red,     " ERROR "),
};

function formatValue(v: unknown): string {
  if (v === null) return ansi(C.dim, "null");
  if (v === undefined) return ansi(C.dim, "undefined");
  if (typeof v === "number") return ansi(C.green, String(v));
  if (typeof v === "boolean") return ansi(C.magenta, String(v));
  if (typeof v === "string") return v;
  return JSON.stringify(v, null, 0);
}

// Map step numbers to logical pipeline sections
function sectionLabel(step: number): string | null {
  const SECTIONS: Record<number, string> = {
    1: "INPUTS & VALIDATION",
    2: "QUALIFICATION DU PROFIL",
    3: "GÉNÉRATION DES SCÉNARIOS",
    4: "FILTRES D'EXCLUSION",
    5: "MATRICE D'INCOMPATIBILITÉ",
    6: "BOOSTERS",
    7: "CALCUL DES SCÉNARIOS",
    8: "COMPARAISON & CLASSEMENT",
    9: "OUTPUT FINAL",
  };
  return SECTIONS[step] ?? null;
}

function printLogsToTerminal(payload: LogPayload): void {
  const { traceId, logs } = payload;
  if (logs.length === 0) return;

  const ts = new Date().toLocaleTimeString("fr-FR", { hour12: false });
  const warnCount  = logs.filter((l) => l.level === "warn").length;
  const errorCount = logs.filter((l) => l.level === "error").length;
  const sep = "─".repeat(72);
  const sepBold = "═".repeat(72);

  process.stdout.write("\n");
  process.stdout.write(ansi(C.bold, C.cyan, sepBold) + "\n");
  process.stdout.write(
    ansi(C.bold, C.white, `  WYMBY ENGINE TRACE [${traceId}]`) +
    ansi(C.dim, `  ${ts}  ·  ${logs.length} logs`) +
    "\n"
  );
  process.stdout.write(ansi(C.bold, C.cyan, sepBold) + "\n\n");

  let lastSection = -1;

  for (const log of logs) {
    const section = sectionLabel(log.step);
    if (section && log.step !== lastSection) {
      lastSection = log.step;
      process.stdout.write(ansi(C.bold, C.magenta, `  ▶ STEP ${log.step} — ${section}`) + "\n");
      process.stdout.write(ansi(C.dim, `  ${sep}`) + "\n");
    }

    const levelTag = LEVEL_COLOR[log.level];
    const stepTag  = ansi(C.dim, `[${log.step}]`);
    const scenTag  = log.scenario_id
      ? ansi(C.yellow, ` (${log.scenario_id})`)
      : "";

    process.stdout.write(`  ${stepTag}${levelTag}${log.message}${scenTag}\n`);

    if (log.detail) {
      for (const [key, val] of Object.entries(log.detail)) {
        process.stdout.write(
          `    ${ansi(C.dim, "→")} ${ansi(C.cyan, key)}: ${formatValue(val)}\n`
        );
      }
    }
  }

  process.stdout.write("\n");
  process.stdout.write(ansi(C.bold, C.cyan, sepBold) + "\n");

  const summaryParts: string[] = [`  END [${traceId}]`];
  if (warnCount  > 0) summaryParts.push(ansi(C.yellow, `${warnCount} warn`));
  if (errorCount > 0) summaryParts.push(ansi(C.red,    `${errorCount} error`));
  if (warnCount === 0 && errorCount === 0) summaryParts.push(ansi(C.green, "OK"));

  process.stdout.write(ansi(C.bold, C.white, summaryParts.join("  ")) + "\n");
  process.stdout.write(ansi(C.bold, C.cyan, sepBold) + "\n\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Plugin Vite : endpoint POST /__wymby_logs
// ─────────────────────────────────────────────────────────────────────────────

function engineLogPlugin(): Plugin {
  return {
    name: "wymby-engine-logs",
    configureServer(server) {
      server.middlewares.use(
        "/__wymby_logs",
        (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
          if (req.method !== "POST") {
            next();
            return;
          }

          let body = "";
          req.setEncoding("utf-8");
          req.on("data", (chunk: string) => { body += chunk; });
          req.on("end", () => {
            try {
              const payload = JSON.parse(body) as LogPayload;
              printLogsToTerminal(payload);
            } catch (err) {
              process.stderr.write(`[wymby-engine-logs] parse error: ${String(err)}\n`);
            }
            res.writeHead(204);
            res.end();
          });
          req.on("error", () => {
            res.writeHead(400);
            res.end();
          });
        }
      );
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Config Vite
// ─────────────────────────────────────────────────────────────────────────────

export default defineConfig({
  plugins: [react(), engineLogPlugin()],
  resolve: {
    alias: {
      "@wymby/types":   resolve(__dirname, "../../packages/types/src/index.ts"),
      "@wymby/config":  resolve(__dirname, "../../packages/config/src/index.ts"),
      "@wymby/engine":  resolve(__dirname, "../../packages/engine/src/index.ts"),
      "@test-cases":    resolve(__dirname, "../../test_cases_2026.ts"),
    },
  },
});
