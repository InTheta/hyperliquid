import * as v from "valibot";

// ============================================================
// API Schemas
// ============================================================

import { Address } from "../../_schemas.js";
import type { WebData2Response } from "../../info/_methods/webData2.js";

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
export type WebData2Request = v.InferOutput<typeof WebData2Request>;

/** Event of comprehensive user and market data. */
export type WebData2Event = WebData2Response;

// ============================================================
// Execution Logic
// ============================================================

import { parse } from "../../../_base.js";
import type { ISubscription } from "../../../transport/mod.js";
import type { SubscriptionConfig, SubscriptionOptions } from "./_base/mod.js";

/** Request parameters for the {@linkcode webData2} function. */
export type WebData2Parameters = Omit<v.InferInput<typeof WebData2Request>, "type">;

/**
 * Subscribe to the legacy `webData2` channel.
 *
 * New integrations should prefer {@linkcode webData3}; this method remains so
 * existing consumers can upgrade without losing their account stream.
 *
 * @deprecated Prefer {@linkcode webData3} for new integrations.
 */
export function webData2(
  config: SubscriptionConfig,
  params: WebData2Parameters,
  listener: (data: WebData2Event) => void,
  options?: SubscriptionOptions,
): Promise<ISubscription> {
  const payload = parse(WebData2Request, { type: "webData2", ...params });
  return config.transport.subscribe<WebData2Event>(payload.type, payload, (e) => {
    if (e.detail.user === payload.user) {
      listener(e.detail);
    }
  }, options);
}
