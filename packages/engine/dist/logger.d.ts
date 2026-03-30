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
    calc(step: number, msg: string, variable: string, valeur: number | boolean | string, detail?: Record<string, unknown>, scenario_id?: string): void;
    getLogs(): EngineLog[];
}
export declare function createLogger(debug: boolean): EngineLogger;
//# sourceMappingURL=logger.d.ts.map