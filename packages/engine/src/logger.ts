/**
 * logger.ts — Système de logs DEBUG structurés
 *
 * Activé uniquement si debugMode = true est passé à runEngine().
 * En production, zéro console.log émis.
 * Chaque log est un objet JSON typé EngineLog — jamais une chaîne libre.
 */

import type { EngineLog, LogLevel } from "@wymby/types";

export class EngineLogger {
  private readonly _logs: EngineLog[] = [];
  private readonly _debug: boolean;

  constructor(debug: boolean) {
    this._debug = debug;
  }

  log(
    etape: number,
    label: string,
    level: LogLevel,
    payload?: Omit<EngineLog, "etape" | "label" | "level" | "timestamp">
  ): void {
    if (!this._debug) return;

    const entry: EngineLog = {
      etape,
      label,
      level,
      timestamp: new Date().toISOString(),
      ...payload,
    };

    this._logs.push(entry);
  }

  info(
    etape: number,
    label: string,
    payload?: Omit<EngineLog, "etape" | "label" | "level" | "timestamp">
  ): void {
    this.log(etape, label, "info", payload);
  }

  warn(
    etape: number,
    label: string,
    payload?: Omit<EngineLog, "etape" | "label" | "level" | "timestamp">
  ): void {
    this.log(etape, label, "warn", payload);
  }

  error(
    etape: number,
    label: string,
    payload?: Omit<EngineLog, "etape" | "label" | "level" | "timestamp">
  ): void {
    this.log(etape, label, "error", payload);
  }

  calc(
    etape: number,
    label: string,
    variable: string,
    valeur: number | boolean | string,
    detail?: Record<string, unknown>,
    scenario_id?: string
  ): void {
    this.log(etape, label, "calc", { variable, valeur, detail, scenario_id });
  }

  getLogs(): EngineLog[] {
    return [...this._logs];
  }
}

/** Crée un logger no-op pour la production */
export function createLogger(debug: boolean): EngineLogger {
  return new EngineLogger(debug);
}
