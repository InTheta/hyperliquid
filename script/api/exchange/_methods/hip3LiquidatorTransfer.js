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
exports.Hip3LiquidatorTransferRequest = void 0;
exports.hip3LiquidatorTransfer = hip3LiquidatorTransfer;
const v = __importStar(require("valibot"));
// ============================================================
// API Schemas
// ============================================================
const _schemas_js_1 = require("../../_schemas.js");
/**
 * Deposit into or withdraw from the HIP-3 DEX backstop liquidator.
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#deposit-or-withdraw-from-an-hip-3-dexs-backstop-liquidator
 */
exports.Hip3LiquidatorTransferRequest = (() => {
    return v.object({
        /** Action to perform. */
        action: v.object({
            /** Type of action. */
            type: v.literal("hip3LiquidatorTransfer"),
            /** Name of the HIP-3 DEX. */
            dex: v.string(),
            /** Amount in quote-token 1e-6 units (must be a multiple of 1000 quote tokens, i.e. 1_000_000_000). */
            ntl: _schemas_js_1.UnsignedInteger,
            /** `true` for deposit, `false` for withdrawal. */
            isDeposit: v.boolean(),
        }),
        /** Nonce (timestamp in ms) used to prevent replay attacks. */
        nonce: _schemas_js_1.UnsignedInteger,
        /** ECDSA signature components. */
        signature: v.object({
            /** First 32-byte component. */
            r: v.pipe(_schemas_js_1.Hex, v.length(66)),
            /** Second 32-byte component. */
            s: v.pipe(_schemas_js_1.Hex, v.length(66)),
            /** Recovery identifier. */
            v: v.picklist([27, 28]),
        }),
        /** Expiration time of the action. */
        expiresAfter: v.optional(_schemas_js_1.UnsignedInteger),
    });
})();
// ============================================================
// Execution Logic
// ============================================================
const _base_js_1 = require("../../../_base.js");
const mod_js_1 = require("../../../signing/mod.js");
const mod_js_2 = require("./_base/mod.js");
/** Schema for action fields (excludes request-level system fields). */
const Hip3LiquidatorTransferActionSchema = /* @__PURE__ */ (() => {
    return v.object(exports.Hip3LiquidatorTransferRequest.entries.action.entries);
})();
/**
 * Deposit into or withdraw from the HIP-3 DEX backstop liquidator.
 *
 * Signing: L1 Action.
 *
 * @param config General configuration for Exchange API requests.
 * @param params Parameters specific to the API request.
 * @param opts Request execution options.
 * @return Successful response without specific data.
 *
 * @throws {ValidationError} When the request parameters fail validation (before sending).
 * @throws {TransportError} When the transport layer throws an error.
 * @throws {ApiRequestError} When the API returns an unsuccessful response.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@nktkas/hyperliquid";
 * import { hip3LiquidatorTransfer } from "@nktkas/hyperliquid/api/exchange";
 * import { privateKeyToAccount } from "npm:viem/accounts";
 *
 * const wallet = privateKeyToAccount("0x..."); // viem or ethers
 * const transport = new HttpTransport(); // or `WebSocketTransport`
 *
 * await hip3LiquidatorTransfer({ transport, wallet }, {
 *   dex: "test",
 *   ntl: 1_000_000_000, // 1000 quote tokens (1e-6 units)
 *   isDeposit: true,
 * });
 * ```
 *
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#deposit-or-withdraw-from-an-hip-3-dexs-backstop-liquidator
 */
function hip3LiquidatorTransfer(config, params, opts) {
    const action = (0, mod_js_1.canonicalize)(Hip3LiquidatorTransferActionSchema, (0, _base_js_1.parse)(Hip3LiquidatorTransferActionSchema, { type: "hip3LiquidatorTransfer", ...params }));
    return (0, mod_js_2.executeL1Action)(config, action, opts);
}
//# sourceMappingURL=hip3LiquidatorTransfer.js.map