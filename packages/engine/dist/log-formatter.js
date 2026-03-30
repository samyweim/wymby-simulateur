"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatEngineLogs = formatEngineLogs;
exports.filterLogs = filterLogs;
exports.filterLogsByScenario = filterLogsByScenario;
exports.summarizeLogs = summarizeLogs;
const LEVEL_ORDER = ["info", "debug", "trace", "warn", "error"];
const LEVEL_ICON = {
    info: "🔵",
    debug: "🟡",
    trace: "🔍",
    warn: "🟠",
    error: "🔴",
};
function formatEngineLogs(logs) {
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
function filterLogs(logs, minLevel) {
    const maxIndex = LEVEL_ORDER.indexOf(minLevel);
    return logs.filter((log) => LEVEL_ORDER.indexOf(log.level) <= maxIndex);
}
function filterLogsByScenario(logs, scenario_id) {
    return logs.filter((log) => log.scenario_id === scenario_id);
}
function summarizeLogs(logs) {
    return logs
        .filter((log) => log.level !== "trace")
        .map((log) => `[${log.step}] ${log.message}${log.scenario_id ? ` (${log.scenario_id})` : ""}`)
        .join("\n");
}
function formatValue(value) {
    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    if (typeof value === "string") {
        return value;
    }
    return JSON.stringify(value);
}
//# sourceMappingURL=log-formatter.js.map