import * as v from "valibot";
// ============================================================
// API Schemas
// ============================================================
import { Address } from "../../_schemas.js";
/**
 * Backward-compatible subscription to comprehensive user and market data.
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
 */
export const WebData2Request = /* @__PURE__ */ (() => {
    return v.object({
        /** Type of subscription. */
        type: v.literal("webData2"),
        /** User address. */
        user: Address,
    });
})();
// ============================================================
// Execution Logic
// ============================================================
import { parse } from "../../../_base.js";
/**
 * Subscribe to the legacy `webData2` channel.
 *
 * New integrations should prefer {@linkcode webData3}; this method remains so
 * existing consumers can upgrade without losing their account stream.
 *
 * @deprecated Prefer {@linkcode webData3} for new integrations.
 */
export function webData2(config, params, listener, options) {
    const payload = parse(WebData2Request, { type: "webData2", ...params });
    return config.transport.subscribe(payload.type, payload, (e) => {
        if (e.detail.user === payload.user) {
            listener(e.detail);
        }
    }, options);
}
//# sourceMappingURL=webData2.js.map