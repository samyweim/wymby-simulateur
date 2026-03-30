import type { EngineLog, LogLevel } from "./logger.js";
export declare function formatEngineLogs(logs: EngineLog[]): string;
export declare function filterLogs(logs: EngineLog[], minLevel: LogLevel): EngineLog[];
export declare function filterLogsByScenario(logs: EngineLog[], scenario_id: string): EngineLog[];
export declare function summarizeLogs(logs: EngineLog[]): string;
//# sourceMappingURL=log-formatter.d.ts.map