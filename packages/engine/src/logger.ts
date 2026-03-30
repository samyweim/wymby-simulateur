export type LogLevel = "info" | "debug" | "trace" | "warn" | "error";

export interface EngineLog {
  step: number;
  level: LogLevel;
  message: string;
  scenario_id?: string;
  detail?: Record<string, unknown>;
  timestamp_ms: number;
}

export interface LogContext {
  scenario_id?: string;
  detail?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface EngineLogger {
  info(step: number, msg: string, ctx?: LogContext): void;
  debug(step: number, msg: string, ctx?: LogContext): void;
  trace(step: number, msg: string, ctx?: LogContext): void;
  warn(step: number, msg: string, ctx?: LogContext): void;
  error(step: number, msg: string, ctx?: LogContext): void;
  calc(
    step: number,
    msg: string,
    variable: string,
    valeur: number | boolean | string,
    detail?: Record<string, unknown>,
    scenario_id?: string
  ): void;
  getLogs(): EngineLog[];
}

class EngineLoggerImpl implements EngineLogger {
  private readonly logs: EngineLog[] = [];
  private readonly enabled: boolean;

  constructor(enabled: boolean) {
    this.enabled = enabled;
  }

  private push(step: number, level: LogLevel, message: string, ctx?: LogContext): void {
    if (!this.enabled) return;

    const { scenario_id, detail, ...rest } = ctx ?? {};
    const mergedDetail =
      detail || Object.keys(rest).length > 0
        ? { ...(detail ?? {}), ...rest }
        : undefined;

    this.logs.push({
      step,
      level,
      message,
      scenario_id,
      detail: mergedDetail,
      timestamp_ms: Date.now(),
    });
  }

  info(step: number, msg: string, ctx?: LogContext): void {
    this.push(step, "info", msg, ctx);
  }

  debug(step: number, msg: string, ctx?: LogContext): void {
    this.push(step, "debug", msg, ctx);
  }

  trace(step: number, msg: string, ctx?: LogContext): void {
    this.push(step, "trace", msg, ctx);
  }

  warn(step: number, msg: string, ctx?: LogContext): void {
    this.push(step, "warn", msg, ctx);
  }

  error(step: number, msg: string, ctx?: LogContext): void {
    this.push(step, "error", msg, ctx);
  }

  calc(
    step: number,
    msg: string,
    variable: string,
    valeur: number | boolean | string,
    detail?: Record<string, unknown>,
    scenario_id?: string
  ): void {
    this.debug(step, msg, {
      scenario_id,
      detail: { variable, valeur, ...detail },
    });
  }

  getLogs(): EngineLog[] {
    return [...this.logs];
  }
}

export function createLogger(debug: boolean): EngineLogger {
  return new EngineLoggerImpl(debug);
}
