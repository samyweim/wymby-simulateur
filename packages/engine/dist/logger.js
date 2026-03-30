"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = createLogger;
class EngineLoggerImpl {
    logs = [];
    enabled;
    constructor(enabled) {
        this.enabled = enabled;
    }
    push(step, level, message, ctx) {
        if (!this.enabled)
            return;
        const { scenario_id, detail, ...rest } = ctx ?? {};
        const mergedDetail = detail || Object.keys(rest).length > 0
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
    info(step, msg, ctx) {
        this.push(step, "info", msg, ctx);
    }
    debug(step, msg, ctx) {
        this.push(step, "debug", msg, ctx);
    }
    trace(step, msg, ctx) {
        this.push(step, "trace", msg, ctx);
    }
    warn(step, msg, ctx) {
        this.push(step, "warn", msg, ctx);
    }
    error(step, msg, ctx) {
        this.push(step, "error", msg, ctx);
    }
    calc(step, msg, variable, valeur, detail, scenario_id) {
        this.debug(step, msg, {
            scenario_id,
            detail: { variable, valeur, ...detail },
        });
    }
    getLogs() {
        return [...this.logs];
    }
}
function createLogger(debug) {
    return new EngineLoggerImpl(debug);
}
//# sourceMappingURL=logger.js.map