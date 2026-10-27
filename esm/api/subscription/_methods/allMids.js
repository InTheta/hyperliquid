import * as v from "valibot";
/**
 * Subscription to mid price events for all coins.
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
 */
export const AllMidsRequest = /* @__PURE__ */ (() => {
    return v.object({
        /** Type of subscription. */
        type: v.literal("allMids"),
        /** DEX name (empty string for main dex). */
        dex: v.optional(v.string()),
    });
})();
// ============================================================
// Execution Logic
// ============================================================
import { parse } from "../../../_base.js";
export function allMids(config, paramsOrListener, listenerOrOptions, maybeOptions) {
    const isListenerFirst = typeof paramsOrListener === "function";
    const params = isListenerFirst ? {} : paramsOrListener;
    const listener = isListenerFirst ? paramsOrListener : listenerOrOptions;
    const options = isListenerFirst ? listenerOrOptions : maybeOptions;
    const payload = parse(AllMidsRequest, {
        type: "allMids",
        ...params,
        dex: params.dex || undefined, // Same value as in response
    });
    return config.transport.subscribe(payload.type, payload, (e) => {
        // The API uses both an omitted DEX and an empty string for the main DEX.
        // Normalize both forms so the default subscription cannot silently stop
        // delivering updates after a reconnect.
        if ((e.detail.dex || undefined) === payload.dex) {
            listener(e.detail);
        }
    }, options);
}
//# sourceMappingURL=allMids.js.map