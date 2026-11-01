"use strict";
/**
 * Client for the Hyperliquid Subscription API endpoint.
 * @module
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionClient = void 0;
// ============================================================
// Methods Imports
// ============================================================
const activeAssetCtx_js_1 = require("./_methods/activeAssetCtx.js");
const activeAssetData_js_1 = require("./_methods/activeAssetData.js");
const activeSpotAssetCtx_js_1 = require("./_methods/activeSpotAssetCtx.js");
const allDexsAssetCtxs_js_1 = require("./_methods/allDexsAssetCtxs.js");
const allDexsClearinghouseState_js_1 = require("./_methods/allDexsClearinghouseState.js");
const allMids_js_1 = require("./_methods/allMids.js");
const assetCtxs_js_1 = require("./_methods/assetCtxs.js");
const bbo_js_1 = require("./_methods/bbo.js");
const candle_js_1 = require("./_methods/candle.js");
const clearinghouseState_js_1 = require("./_methods/clearinghouseState.js");
const fastAssetCtxs_js_1 = require("./_methods/fastAssetCtxs.js");
const l2Book_js_1 = require("./_methods/l2Book.js");
const notification_js_1 = require("./_methods/notification.js");
const openOrders_js_1 = require("./_methods/openOrders.js");
const orderUpdates_js_1 = require("./_methods/orderUpdates.js");
const outcomeMetaUpdates_js_1 = require("./_methods/outcomeMetaUpdates.js");
const spotAssetCtxs_js_1 = require("./_methods/spotAssetCtxs.js");
const spotState_js_1 = require("./_methods/spotState.js");
const trades_js_1 = require("./_methods/trades.js");
const twapStates_js_1 = require("./_methods/twapStates.js");
const userEvents_js_1 = require("./_methods/userEvents.js");
const userFills_js_1 = require("./_methods/userFills.js");
const userFundings_js_1 = require("./_methods/userFundings.js");
const userHistoricalOrders_js_1 = require("./_methods/userHistoricalOrders.js");
const userNonFundingLedgerUpdates_js_1 = require("./_methods/userNonFundingLedgerUpdates.js");
const userTwapHistory_js_1 = require("./_methods/userTwapHistory.js");
const userTwapSliceFills_js_1 = require("./_methods/userTwapSliceFills.js");
const webData2_js_1 = require("./_methods/webData2.js");
const webData3_js_1 = require("./_methods/webData3.js");
// ============================================================
// Client
// ============================================================
/**
 * Real-time data via WebSocket subscriptions.
 *
 * Corresponds to {@link https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions | WebSocket subscriptions}.
 */
class SubscriptionClient {
    config_;
    /**
     * Creates an instance of the SubscriptionClient.
     *
     * @param config Configuration for Subscription API requests. See {@link SubscriptionConfig}.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport();
     *
     * const subsClient = new hl.SubscriptionClient({ transport });
     * ```
     */
    constructor(config) {
        this.config_ = config;
    }
    /**
     * Subscribe to context updates for a specific perpetual asset.
     *
     * @param params Parameters specific to the API subscription.
     * @param listener A callback function to be called when the event is received.
     * @param options Options to control the subscription lifecycle.
     * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport();
     * const client = new hl.SubscriptionClient({ transport });
     *
     * const sub = await client.activeAssetCtx({ coin: "ETH" }, (data) => {
     *   console.log(data);
     * });
     * ```
     *
     * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
     */
    activeAssetCtx(params, listener, options) {
        return (0, activeAssetCtx_js_1.activeAssetCtx)(this.config_, params, listener, options);
    }
    /**
     * Subscribe to trading data updates for a specific asset and user.
     *
     * @param params Parameters specific to the API subscription.
     * @param listener A callback function to be called when the event is received.
     * @param options Options to control the subscription lifecycle.
     * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport();
     * const client = new hl.SubscriptionClient({ transport });
     *
     * const sub = await client.activeAssetData({ coin: "ETH", user: "0x..." }, (data) => {
     *   console.log(data);
     * });
     * ```
     *
     * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
     */
    activeAssetData(params, listener, options) {
        return (0, activeAssetData_js_1.activeAssetData)(this.config_, params, listener, options);
    }
    /**
     * Subscribe to context updates for a specific spot asset.
     *
     * @param params Parameters specific to the API subscription.
     * @param listener A callback function to be called when the event is received.
     * @param options Options to control the subscription lifecycle.
     * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport();
     * const client = new hl.SubscriptionClient({ transport });
     *
     * const sub = await client.activeSpotAssetCtx({ coin: "@1" }, (data) => {
     *   console.log(data);
     * });
     * ```
     *
     * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
     */
    activeSpotAssetCtx(params, listener, options) {
        return (0, activeSpotAssetCtx_js_1.activeSpotAssetCtx)(this.config_, params, listener, options);
    }
    /**
     * Subscribe to asset contexts for all DEXs.
     *
     * @param listener A callback function to be called when the event is received.
     * @param options Options to control the subscription lifecycle.
     * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport();
     * const client = new hl.SubscriptionClient({ transport });
     *
     * const sub = await client.allDexsAssetCtxs((data) => {
     *   console.log(data);
     * });
     * ```
     *
     * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
     */
    allDexsAssetCtxs(listener, options) {
        return (0, allDexsAssetCtxs_js_1.allDexsAssetCtxs)(this.config_, listener, options);
    }
    /**
     * Subscribe to clearinghouse states for all DEXs for a specific user.
     *
     * @param params Parameters specific to the API subscription.
     * @param listener A callback function to be called when the event is received.
     * @param options Options to control the subscription lifecycle.
     * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport();
     * const client = new hl.SubscriptionClient({ transport });
     *
     * const sub = await client.allDexsClearinghouseState({ user: "0x..." }, (data) => {
     *   console.log(data);
     * });
     * ```
     *
     * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
     */
    allDexsClearinghouseState(params, listener, options) {
        return (0, allDexsClearinghouseState_js_1.allDexsClearinghouseState)(this.config_, params, listener, options);
    }
    allMids(paramsOrListener, listenerOrOptions, maybeOptions) {
        const isListenerFirst = typeof paramsOrListener === "function";
        const params = isListenerFirst ? {} : paramsOrListener;
        const listener = isListenerFirst ? paramsOrListener : listenerOrOptions;
        const options = isListenerFirst ? listenerOrOptions : maybeOptions;
        return (0, allMids_js_1.allMids)(this.config_, params, listener, options);
    }
    assetCtxs(paramsOrListener, listenerOrOptions, maybeOptions) {
        const isListenerFirst = typeof paramsOrListener === "function";
        const params = isListenerFirst ? {} : paramsOrListener;
        const listener = isListenerFirst ? paramsOrListener : listenerOrOptions;
        const options = isListenerFirst ? listenerOrOptions : maybeOptions;
        return (0, assetCtxs_js_1.assetCtxs)(this.config_, params, listener, options);
    }
    /**
     * Subscribe to best bid and offer updates for a specific asset.
     *
     * @param params Parameters specific to the API subscription.
     * @param listener A callback function to be called when the event is received.
     * @param options Options to control the subscription lifecycle.
     * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport();
     * const client = new hl.SubscriptionClient({ transport });
     *
     * const sub = await client.bbo({ coin: "ETH" }, (data) => {
     *   console.log(data);
     * });
     * ```
     *
     * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
     */
    bbo(params, listener, options) {
        return (0, bbo_js_1.bbo)(this.config_, params, listener, options);
    }
    /**
     * Subscribe to candlestick data updates for a specific asset.
     *
     * @param params Parameters specific to the API subscription.
     * @param listener A callback function to be called when the event is received.
     * @param options Options to control the subscription lifecycle.
     * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport();
     * const client = new hl.SubscriptionClient({ transport });
     *
     * const sub = await client.candle({ coin: "ETH", interval: "1h" }, (data) => {
     *   console.log(data);
     * });
     * ```
     *
     * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
     */
    candle(params, listener, options) {
        return (0, candle_js_1.candle)(this.config_, params, listener, options);
    }
    /**
     * Subscribe to clearinghouse state updates for a specific user.
     *
     * @param params Parameters specific to the API subscription.
     * @param listener A callback function to be called when the event is received.
     * @param options Options to control the subscription lifecycle.
     * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport();
     * const client = new hl.SubscriptionClient({ transport });
     *
     * const sub = await client.clearinghouseState({ user: "0x..." }, (data) => {
     *   console.log(data);
     * });
     * ```
     *
     * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
     */
    clearinghouseState(params, listener, options) {
        return (0, clearinghouseState_js_1.clearinghouseState)(this.config_, params, listener, options);
    }
    /**
     * Subscribe to mark and mid prices for all assets.
     *
     * @param listener A callback function to be called when the event is received.
     * @param options Options to control the subscription lifecycle.
     * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport();
     * const client = new hl.SubscriptionClient({ transport });
     *
     * const sub = await client.fastAssetCtxs((data) => {
     *   console.log(data);
     * });
     * ```
     *
     * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
     */
    fastAssetCtxs(listener, options) {
        return (0, fastAssetCtxs_js_1.fastAssetCtxs)(this.config_, listener, options);
    }
    /**
     * Subscribe to L2 order book updates for a specific asset.
     *
     * @param params Parameters specific to the API subscription.
     * @param listener A callback function to be called when the event is received.
     * @param options Options to control the subscription lifecycle.
     * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport();
     * const client = new hl.SubscriptionClient({ transport });
     *
     * const sub = await client.l2Book({ coin: "ETH" }, (data) => {
     *   console.log(data);
     * });
     * ```
     *
     * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
     */
    l2Book(params, listener, options) {
        return (0, l2Book_js_1.l2Book)(this.config_, params, listener, options);
    }
    /**
     * Subscribe to notification updates for a specific user.
     *
     * @param params Parameters specific to the API subscription.
     * @param listener A callback function to be called when the event is received.
     * @param options Options to control the subscription lifecycle.
     * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport();
     * const client = new hl.SubscriptionClient({ transport });
     *
     * const sub = await client.notification({ user: "0x..." }, (data) => {
     *   console.log(data);
     * });
     * ```
     *
     * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
     */
    notification(params, listener, options) {
        return (0, notification_js_1.notification)(this.config_, params, listener, options);
    }
    /**
     * Subscribe to open orders updates for a specific user.
     *
     * @param params Parameters specific to the API subscription.
     * @param listener A callback function to be called when the event is received.
     * @param options Options to control the subscription lifecycle.
     * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport();
     * const client = new hl.SubscriptionClient({ transport });
     *
     * const sub = await client.openOrders({ user: "0x..." }, (data) => {
     *   console.log(data);
     * });
     * ```
     *
     * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
     */
    openOrders(params, listener, options) {
        return (0, openOrders_js_1.openOrders)(this.config_, params, listener, options);
    }
    /**
     * Subscribe to order status updates for a specific user.
     *
     * @param params Parameters specific to the API subscription.
     * @param listener A callback function to be called when the event is received.
     * @param options Options to control the subscription lifecycle.
     * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport();
     * const client = new hl.SubscriptionClient({ transport });
     *
     * const sub = await client.orderUpdates({ user: "0x..." }, (data) => {
     *   console.log(data);
     * });
     * ```
     *
     * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
     */
    orderUpdates(params, listener, options) {
        return (0, orderUpdates_js_1.orderUpdates)(this.config_, params, listener, options);
    }
    /**
     * Subscribe to prediction market outcome/question metadata updates.
     *
     * @param listener A callback function to be called when the event is received.
     * @param options Options to control the subscription lifecycle.
     * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport();
     * const client = new hl.SubscriptionClient({ transport });
     *
     * const sub = await client.outcomeMetaUpdates((data) => {
     *   console.log(data);
     * });
     * ```
     *
     * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
     */
    outcomeMetaUpdates(listener, options) {
        return (0, outcomeMetaUpdates_js_1.outcomeMetaUpdates)(this.config_, listener, options);
    }
    /**
     * Subscribe to context updates for all spot assets.
     *
     * @param listener A callback function to be called when the event is received.
     * @param options Options to control the subscription lifecycle.
     * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport();
     * const client = new hl.SubscriptionClient({ transport });
     *
     * const sub = await client.spotAssetCtxs((data) => {
     *   console.log(data);
     * });
     * ```
     *
     * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
     */
    spotAssetCtxs(listener, options) {
        return (0, spotAssetCtxs_js_1.spotAssetCtxs)(this.config_, listener, options);
    }
    /**
     * Subscribe to spot state updates for a specific user.
     *
     * @param params Parameters specific to the API subscription.
     * @param listener A callback function to be called when the event is received.
     * @param options Options to control the subscription lifecycle.
     * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport();
     * const client = new hl.SubscriptionClient({ transport });
     *
     * const sub = await client.spotState({ user: "0x..." }, (data) => {
     *   console.log(data);
     * });
     * ```
     *
     * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
     */
    spotState(params, listener, options) {
        return (0, spotState_js_1.spotState)(this.config_, params, listener, options);
    }
    /**
     * Subscribe to real-time trade updates for a specific asset.
     *
     * @param params Parameters specific to the API subscription.
     * @param listener A callback function to be called when the event is received.
     * @param options Options to control the subscription lifecycle.
     * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport();
     * const client = new hl.SubscriptionClient({ transport });
     *
     * const sub = await client.trades({ coin: "ETH" }, (data) => {
     *   console.log(data);
     * });
     * ```
     *
     * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
     */
    trades(params, listener, options) {
        return (0, trades_js_1.trades)(this.config_, params, listener, options);
    }
    /**
     * Subscribe to TWAP states updates for a specific user.
     *
     * @param params Parameters specific to the API subscription.
     * @param listener A callback function to be called when the event is received.
     * @param options Options to control the subscription lifecycle.
     * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport();
     * const client = new hl.SubscriptionClient({ transport });
     *
     * const sub = await client.twapStates({ user: "0x..." }, (data) => {
     *   console.log(data);
     * });
     * ```
     *
     * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
     */
    twapStates(params, listener, options) {
        return (0, twapStates_js_1.twapStates)(this.config_, params, listener, options);
    }
    /**
     * Subscribe to non-order events for a specific user.
     *
     * @param params Parameters specific to the API subscription.
     * @param listener A callback function to be called when the event is received.
     * @param options Options to control the subscription lifecycle.
     * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport();
     * const client = new hl.SubscriptionClient({ transport });
     *
     * const sub = await client.userEvents({ user: "0x..." }, (data) => {
     *   console.log(data);
     * });
     * ```
     *
     * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
     */
    userEvents(params, listener, options) {
        return (0, userEvents_js_1.userEvents)(this.config_, params, listener, options);
    }
    /**
     * Subscribe to trade fill updates for a specific user.
     *
     * @param params Parameters specific to the API subscription.
     * @param listener A callback function to be called when the event is received.
     * @param options Options to control the subscription lifecycle.
     * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport();
     * const client = new hl.SubscriptionClient({ transport });
     *
     * const sub = await client.userFills({ user: "0x..." }, (data) => {
     *   console.log(data);
     * });
     * ```
     *
     * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
     */
    userFills(params, listener, options) {
        return (0, userFills_js_1.userFills)(this.config_, params, listener, options);
    }
    /**
     * Subscribe to funding payment updates for a specific user.
     *
     * @param params Parameters specific to the API subscription.
     * @param listener A callback function to be called when the event is received.
     * @param options Options to control the subscription lifecycle.
     * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport();
     * const client = new hl.SubscriptionClient({ transport });
     *
     * const sub = await client.userFundings({ user: "0x..." }, (data) => {
     *   console.log(data);
     * });
     * ```
     *
     * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
     */
    userFundings(params, listener, options) {
        return (0, userFundings_js_1.userFundings)(this.config_, params, listener, options);
    }
    /**
     * Subscribe to historical order updates for a specific user.
     *
     * @param params Parameters specific to the API subscription.
     * @param listener A callback function to be called when the event is received.
     * @param options Options to control the subscription lifecycle.
     * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport();
     * const client = new hl.SubscriptionClient({ transport });
     *
     * const sub = await client.userHistoricalOrders({ user: "0x..." }, (data) => {
     *   console.log(data);
     * });
     * ```
     *
     * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
     */
    userHistoricalOrders(params, listener, options) {
        return (0, userHistoricalOrders_js_1.userHistoricalOrders)(this.config_, params, listener, options);
    }
    /**
     * Subscribe to non-funding ledger updates for a specific user.
     *
     * @param params Parameters specific to the API subscription.
     * @param listener A callback function to be called when the event is received.
     * @param options Options to control the subscription lifecycle.
     * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport();
     * const client = new hl.SubscriptionClient({ transport });
     *
     * const sub = await client.userNonFundingLedgerUpdates({ user: "0x..." }, (data) => {
     *   console.log(data);
     * });
     * ```
     *
     * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
     */
    userNonFundingLedgerUpdates(params, listener, options) {
        return (0, userNonFundingLedgerUpdates_js_1.userNonFundingLedgerUpdates)(this.config_, params, listener, options);
    }
    /**
     * Subscribe to TWAP order history updates for a specific user.
     *
     * @param params Parameters specific to the API subscription.
     * @param listener A callback function to be called when the event is received.
     * @param options Options to control the subscription lifecycle.
     * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport();
     * const client = new hl.SubscriptionClient({ transport });
     *
     * const sub = await client.userTwapHistory({ user: "0x..." }, (data) => {
     *   console.log(data);
     * });
     * ```
     *
     * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
     */
    userTwapHistory(params, listener, options) {
        return (0, userTwapHistory_js_1.userTwapHistory)(this.config_, params, listener, options);
    }
    /**
     * Subscribe to TWAP execution updates for a specific user.
     *
     * @param params Parameters specific to the API subscription.
     * @param listener A callback function to be called when the event is received.
     * @param options Options to control the subscription lifecycle.
     * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport();
     * const client = new hl.SubscriptionClient({ transport });
     *
     * const sub = await client.userTwapSliceFills({ user: "0x..." }, (data) => {
     *   console.log(data);
     * });
     * ```
     *
     * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
     */
    userTwapSliceFills(params, listener, options) {
        return (0, userTwapSliceFills_js_1.userTwapSliceFills)(this.config_, params, listener, options);
    }
    /**
     * Subscribe to the legacy `webData2` channel.
     *
     * New integrations should prefer {@linkcode webData3}; this method remains so
     * existing consumers can upgrade without losing their account stream.
     *
     * @deprecated Prefer {@linkcode webData3} for new integrations.
     */
    webData2(params, listener, options) {
        return (0, webData2_js_1.webData2)(this.config_, params, listener, options);
    }
    /**
     * Subscribe to comprehensive user and market data updates.
     *
     * @param params Parameters specific to the API subscription.
     * @param listener A callback function to be called when the event is received.
     * @param options Options to control the subscription lifecycle.
     * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport();
     * const client = new hl.SubscriptionClient({ transport });
     *
     * const sub = await client.webData3({ user: "0x..." }, (data) => {
     *   console.log(data);
     * });
     * ```
     *
     * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
     */
    webData3(params, listener, options) {
        return (0, webData3_js_1.webData3)(this.config_, params, listener, options);
    }
}
exports.SubscriptionClient = SubscriptionClient;
//# sourceMappingURL=client.js.map