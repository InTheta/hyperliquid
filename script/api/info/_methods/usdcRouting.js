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
exports.UsdcRoutingRequest = void 0;
exports.usdcRouting = usdcRouting;
const v = __importStar(require("valibot"));
// ============================================================
// API Schemas
// ============================================================
/**
 * Request USDC transfer routing.
 * @see null
 */
exports.UsdcRoutingRequest = (() => {
    return v.object({
        /** Type of request. */
        type: v.literal("usdcRouting"),
    });
})();
// ============================================================
// Execution Logic
// ============================================================
const _base_js_1 = require("../../../_base.js");
/**
 * Request USDC transfer routing.
 *
 * @param config General configuration for Info API requests.
 * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
 * @return Routes currently used to move USDC in and out of the platform.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@nktkas/hyperliquid";
 * import { usdcRouting } from "@nktkas/hyperliquid/api/info";
 *
 * const transport = new HttpTransport(); // or `WebSocketTransport`
 *
 * const data = await usdcRouting({ transport });
 * ```
 *
 * @see null
 */
function usdcRouting(config, signal) {
    const request = (0, _base_js_1.parse)(exports.UsdcRoutingRequest, {
        type: "usdcRouting",
    });
    return config.transport.request("info", request, signal);
}
//# sourceMappingURL=usdcRouting.js.map