"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FastAssetCtxsRequest = void 0;
exports.fastAssetCtxs = fastAssetCtxs;
const v = __importStar(require("valibot"));
// ============================================================
// API Schemas
// ============================================================
/**
 * Subscription to mark and mid price events for all assets.
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
 */
exports.FastAssetCtxsRequest = (() => {
    return v.object({
        /** Type of subscription. */
        type: v.literal("fastAssetCtxs"),
    });
})();
// ============================================================
// Execution Logic
// ============================================================
const _base_js_1 = require("../../../_base.js");
/**
 * Subscribe to mark and mid prices for all assets.
 *
 * @param config General configuration for Subscription API subscriptions.
 * @param listener A callback function to be called when the event is received.
 * @param options Options to control the subscription lifecycle.
 * @return A request-promise that resolves with a {@link ISubscription} object to manage the subscription lifecycle.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { WebSocketTransport } from "@nktkas/hyperliquid";
 * import { fastAssetCtxs } from "@nktkas/hyperliquid/api/subscription";
 *
 * const transport = new WebSocketTransport();
 *
 * const sub = await fastAssetCtxs(
 *   { transport },
 *   (data) => console.log(data),
 * );
 * ```
 *
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
 */
function fastAssetCtxs(config, listener, options) {
    const payload = (0, _base_js_1.parse)(exports.FastAssetCtxsRequest, { type: "fastAssetCtxs" });
    // The server pushes each update as a base64 + raw DEFLATE (RFC 1951) compressed JSON string (assumed to be valid).
    // Decompress sequentially so events reach the listener in arrival order.
    let queue = Promise.resolve();
    return config.transport.subscribe(payload.type, payload, (e) => {
        queue = queue.then(async () => listener(await decompress(e.detail)));
    }, options);
}
/** Decode a base64 + raw DEFLATE (RFC 1951) payload into a {@linkcode FastAssetCtxsEvent}. */
async function decompress(data) {
    const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    const stream = new DecompressionStream("deflate-raw");
    const writer = stream.writable.getWriter();
    // Do not await write/close before draining: backpressure on multi-chunk output would deadlock.
    writer.write(bytes);
    writer.close();
    const reader = stream.readable.getReader();
    const chunks = [];
    let result = await reader.read();
    while (!result.done) {
        chunks.push(result.value);
        result = await reader.read();
    }
    const merged = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
    }
    return JSON.parse(new TextDecoder().decode(merged));
}
//# sourceMappingURL=fastAssetCtxs.js.map