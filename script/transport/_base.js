"use strict";
/**
 * Base contracts shared by every transport: the request and subscription
 * interfaces and the root of the transport error hierarchy.
 * @module
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransportError = void 0;
const _base_js_1 = require("../_base.js");
/**
 * Thrown when an error occurs at the transport level (e.g., timeout).
 *
 * @example
 * ```ts
 * import { HttpTransport, TransportError } from "@nktkas/hyperliquid";
 *
 * const transport = new HttpTransport();
 * try {
 *   // Throws a TransportError subclass on a timeout, an abort, or an HTTP failure.
 *   await transport.request("info", { type: "allMids" });
 * } catch (error) {
 *   if (error instanceof TransportError) {
 *     console.error(`Transport failure: ${error.message}`);
 *   }
 * }
 * ```
 */
class TransportError extends _base_js_1.HyperliquidError {
    /**
     * Creates a transport-level error.
     *
     * The platform-specific failure goes into `options.cause`.
     */
    constructor(message, options) {
        super(message, options);
        this.name = "TransportError";
    }
}
exports.TransportError = TransportError;
//# sourceMappingURL=_base.js.map