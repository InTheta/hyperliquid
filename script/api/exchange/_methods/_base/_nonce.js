"use strict";
/**
 * Nonce manager for generating unique, monotonically increasing nonces.
 * @module
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalNonceManager = void 0;
exports.createNonceManager = createNonceManager;
/** Default upper bound on map size before stale entries are pruned. */
const DEFAULT_MAX_ENTRIES = 10_000;
/**
 * Creates a nonce manager that issues unique, monotonically increasing nonces per key.
 *
 * Uses `Date.now()` in ms; if the previous nonce for the key is greater than or equal to
 * `Date.now()`, increments by 1 to maintain monotonicity.
 *
 * To bound memory under high-cardinality workloads (e.g., a server proxying many wallets),
 * stale entries are pruned when the internal map grows beyond `maxEntries`. An entry is
 * considered stale if `Date.now()` has advanced past its last issued nonce.
 *
 * @param maxEntries Upper bound on map size before stale entries are pruned. Default: `10000`.
 * @return A {@linkcode NonceManager}.
 */
function createNonceManager(maxEntries = DEFAULT_MAX_ENTRIES) {
    const map = new Map();
    return {
        getNonce(key) {
            const now = Date.now();
            if (map.size > maxEntries) {
                for (const [k, last] of map) {
                    if (now > last)
                        map.delete(k);
                }
            }
            const last = map.get(key) ?? 0;
            const nonce = now > last ? now : last + 1;
            map.set(key, nonce);
            return nonce;
        },
    };
}
/** Default global nonce manager instance. */
exports.globalNonceManager = createNonceManager();
//# sourceMappingURL=_nonce.js.map