import * as v from "valibot";
import type { WebData2Response } from "../../info/_methods/webData2.js";
/**
 * Backward-compatible subscription to comprehensive user and market data.
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
 */
export declare const WebData2Request: v.ObjectSchema<{
    /** Type of subscription. */
    readonly type: v.LiteralSchema<"webData2", undefined>;
    /** User address. */
    readonly user: v.SchemaWithPipe<readonly [v.SchemaWithPipe<readonly [v.StringSchema<undefined>, v.RegexAction<string, undefined>, v.TransformAction<string, `0x${string}`>]>, v.LengthAction<`0x${string}`, 42, undefined>]>;
}, undefined>;
export type WebData2Request = v.InferOutput<typeof WebData2Request>;
/** Event of comprehensive user and market data. */
export type WebData2Event = WebData2Response;
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
export declare function webData2(config: SubscriptionConfig, params: WebData2Parameters, listener: (data: WebData2Event) => void, options?: SubscriptionOptions): Promise<ISubscription>;
//# sourceMappingURL=webData2.d.ts.map