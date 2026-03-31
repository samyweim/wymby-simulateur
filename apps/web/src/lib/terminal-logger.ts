/// <reference types="vite/client" />
/**
 * terminal-logger.ts
 *
 * Envoie les logs du moteur vers le terminal Ubuntu via le plugin Vite.
 * Actif uniquement en mode DEV et si VITE_ENGINE_LOG_LEVEL est défini.
 *
 * Activation :
 *   VITE_ENGINE_LOG_LEVEL=debug npm run dev
 *
 * Niveaux disponibles (du plus verbeux au plus silencieux) :
 *   trace | debug | info | warn | error | off (défaut)
 */

import type { EngineLog } from "@wymby/types";

// ─────────────────────────────────────────────────────────────────────────────
// Filtrage par niveau
// ─────────────────────────────────────────────────────────────────────────────

type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "off";

const LEVEL_RANK: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info:  2,
  warn:  3,
  error: 4,
  off:   99,
};

function filterByLevel(logs: EngineLog[], minLevel: LogLevel): EngineLog[] {
  const minRank = LEVEL_RANK[minLevel];
  return logs.filter((log) => {
    const rank = LEVEL_RANK[log.level as LogLevel] ?? 99;
    return rank >= minRank;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Génération du traceId
// ─────────────────────────────────────────────────────────────────────────────

function newTraceId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// Envoi au terminal via le plugin Vite
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Envoie les logs du moteur vers le terminal Node.js (stdout du process Vite).
 *
 * Ne fait rien si :
 *  - on n'est pas en mode DEV
 *  - VITE_ENGINE_LOG_LEVEL vaut "off" ou n'est pas défini
 *  - aucun log ne passe le filtre de niveau
 */
export async function sendLogsToTerminal(logs: EngineLog[]): Promise<void> {
  if (!import.meta.env.DEV) return;

  const rawLevel = (import.meta.env.VITE_ENGINE_LOG_LEVEL ?? "off") as LogLevel;
  if (rawLevel === "off" || !(rawLevel in LEVEL_RANK)) return;

  const filtered = filterByLevel(logs, rawLevel);
  if (filtered.length === 0) return;

  const payload = {
    traceId: newTraceId(),
    logs: filtered,
  };

  try {
    await fetch("/__wymby_logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Le serveur Vite n'est pas disponible (ex: build de production lancé manuellement)
    // On ignore silencieusement — les logs console.* restent disponibles dans les DevTools
  }
}
