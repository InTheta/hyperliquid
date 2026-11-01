"use strict";
/**
 * AbortSignal wiring helpers shared by the transports.
 * @module
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleTimeout = scheduleTimeout;
exports.race = race;
exports.relay = relay;
const _polyfills_js_1 = require("./_polyfills.js");
/** Aborts `target` with a `TimeoutError` after `ms`; `cancel` clears the timer, `reason` identifies the abort. */
function scheduleTimeout(target, ms) {
    const reason = new _polyfills_js_1.DOMException_("Signal timed out.", "TimeoutError");
    // `null` disables the timeout. setTimeout also clamps a non-finite delay to
    // 1 ms, which would turn `Infinity` ("never time out") into an instant abort.
    const timeoutId = ms !== null && Number.isFinite(ms) ? setTimeout(() => target.abort(reason), ms) : undefined;
    return { reason, cancel: () => clearTimeout(timeoutId) };
}
/** Resolves or rejects with `promise`, or rejects with `signal.reason` once `signal` aborts, whichever comes first. */
function race(promise, signal) {
    if (!signal)
        return promise;
    if (signal.aborted)
        return Promise.reject(signal.reason);
    const aborted = _polyfills_js_1.Promise_.withResolvers();
    const onAbort = () => aborted.reject(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
    return Promise.race([promise, aborted.promise])
        .finally(() => signal.removeEventListener("abort", onAbort));
}
/** Relays abort events from `sources` into `target` and returns a detach function. */
function relay(sources, target) {
    const detach = new AbortController();
    for (const source of sources) {
        if (!source)
            continue;
        if (source.aborted) {
            target.abort(source.reason);
            break;
        }
        source.addEventListener("abort", () => target.abort(source.reason), {
            once: true,
            signal: detach.signal,
        });
    }
    return () => detach.abort();
}
//# sourceMappingURL=_abort.js.map