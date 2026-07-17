"use strict";
/**
 * Client for the Hyperliquid Explorer API endpoint.
 * @module
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExplorerClient = void 0;
// ============================================================
// Methods Imports
// ============================================================
const blockDetails_js_1 = require("./_methods/blockDetails.js");
const explorerBlock_js_1 = require("./_methods/explorerBlock.js");
const explorerTxs_js_1 = require("./_methods/explorerTxs.js");
const txDetails_js_1 = require("./_methods/txDetails.js");
const userDetails_js_1 = require("./_methods/userDetails.js");
// ============================================================
// Client
// ============================================================
/**
 * Access to the Hyperliquid blockchain explorer.
 *
 * Requests use an `HttpTransport` and subscriptions use a `WebSocketTransport`, both on the RPC endpoint.
 */
class ExplorerClient {
    config_;
    /**
     * Creates an instance of the ExplorerClient.
     *
     * @param config Configuration for Explorer API requests. See {@link ExplorerConfig}.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * // `HttpTransport` on the RPC URL for requests, or `WebSocketTransport` on the RPC WebSocket URL for subscriptions
     * const transport = new hl.HttpTransport();
     *
     * const explorerClient = new hl.ExplorerClient({ transport });
     * ```
     */
    constructor(config) {
        this.config_ = config;
    }
    /**
     * Request block details by block height.
     *
     * @param params Parameters specific to the API request.
     * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
     * @return Response containing block information.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     * @throws {ApiRequestError} When the API returns an unsuccessful response.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.HttpTransport(); // only `HttpTransport` supports this API
     * const client = new hl.ExplorerClient({ transport });
     *
     * const data = await client.blockDetails({ height: 123 });
     * ```
     *
     * @see null
     */
    blockDetails(params, signal) {
        return (0, blockDetails_js_1.blockDetails)(this.config_, params, signal);
    }
    /**
     * Subscribe to explorer block updates.
     *
     * @param listener A callback function to be called when the event is received.
     * @param onError An optional callback function to be called when the subscription fails.
     * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport({ url: "wss://rpc.hyperliquid.xyz/ws" }); // only `WebSocketTransport` supports this API
     * const client = new hl.ExplorerClient({ transport });
     *
     * const sub = await client.explorerBlock((data) => {
     *   console.log(data);
     * });
     * ```
     *
     * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
     */
    explorerBlock(listener, onError) {
        return (0, explorerBlock_js_1.explorerBlock)(this.config_, listener, onError);
    }
    /**
     * Subscribe to explorer transaction updates.
     *
     * @param listener A callback function to be called when the event is received.
     * @param onError An optional callback function to be called when the subscription fails.
     * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.WebSocketTransport({ url: "wss://rpc.hyperliquid.xyz/ws" }); // only `WebSocketTransport` supports this API
     * const client = new hl.ExplorerClient({ transport });
     *
     * const sub = await client.explorerTxs((data) => {
     *   console.log(data);
     * });
     * ```
     *
     * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
     */
    explorerTxs(listener, onError) {
        return (0, explorerTxs_js_1.explorerTxs)(this.config_, listener, onError);
    }
    /**
     * Request transaction details by transaction hash.
     *
     * @param params Parameters specific to the API request.
     * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
     * @return Transaction details.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     * @throws {ApiRequestError} When the API returns an unsuccessful response.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.HttpTransport(); // only `HttpTransport` supports this API
     * const client = new hl.ExplorerClient({ transport });
     *
     * const data = await client.txDetails({ hash: "0x..." });
     * ```
     *
     * @see null
     */
    txDetails(params, signal) {
        return (0, txDetails_js_1.txDetails)(this.config_, params, signal);
    }
    /**
     * Request array of user transaction details.
     *
     * @param params Parameters specific to the API request.
     * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
     * @return Array of user transaction details.
     *
     * @throws {ValidationError} When the request parameters fail validation (before sending).
     * @throws {TransportError} When the transport layer throws an error.
     * @throws {ApiRequestError} When the API returns an unsuccessful response.
     *
     * @example
     * ```ts
     * import * as hl from "@nktkas/hyperliquid";
     *
     * const transport = new hl.HttpTransport(); // only `HttpTransport` supports this API
     * const client = new hl.ExplorerClient({ transport });
     *
     * const data = await client.userDetails({ user: "0x..." });
     * ```
     *
     * @see null
     */
    userDetails(params, signal) {
        return (0, userDetails_js_1.userDetails)(this.config_, params, signal);
    }
}
exports.ExplorerClient = ExplorerClient;
//# sourceMappingURL=client.js.map