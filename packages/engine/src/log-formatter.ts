import type { EngineLog, LogLevel } from "./logger.js";

const LEVEL_ORDER: LogLevel[] = ["info", "debug", "trace", "warn", "error"];
const LEVEL_ICON: Record<LogLevel, string> = {
  info: "🔵",
  debug: "🟡",
  trace: "🔍",
  warn: "🟠",
  error: "🔴",
};

export function formatEngineLogs(logs: EngineLog[]): string {
  return logs
    .map((log) => {
      const lines = [`[STEP ${log.step}] [${log.level.toUpperCase()}] ${log.message}`];
      if (log.scenario_id) {
        lines.push(`  ${LEVEL_ICON[log.level]} scenario_id: ${log.scenario_id}`);
      }
      for (const [key, value] of Object.entries(log.detail ?? {})) {
        lines.push(`  → ${key}: ${formatValue(value)}`);
      }
      return lines.join("\n");
    })
    .join("\n");
}

export function filterLogs(logs: EngineLog[], minLevel: LogLevel): EngineLog[] {
  const maxIndex = LEVEL_ORDER.indexOf(minLevel);
  return logs.filter((log) => LEVEL_ORDER.indexOf(log.level) <= maxIndex);
}

export function filterLogsByScenario(logs: EngineLog[], scenario_id: string): EngineLog[] {
  return logs.filter((log) => log.scenario_id === scenario_id);
}

export function summarizeLogs(logs: EngineLog[]): string {
  return logs
    .filter((log) => log.level !== "trace")
    .map((log) => `[${log.step}] ${log.message}${log.scenario_id ? ` (${log.scenario_id})` : ""}`)
    .join("\n");
}

function formatValue(value: unknown): string {
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
}
