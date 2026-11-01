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
exports.AgentSendAssetRequest = void 0;
exports.agentSendAsset = agentSendAsset;
const v = __importStar(require("valibot"));
// ============================================================
// API Schemas
// ============================================================
const _schemas_js_1 = require("../../_schemas.js");
/**
 * Transfer tokens on behalf of the principal via an agent wallet.
 *
 * Like {@link sendAsset} but signed as an L1 action by the agent wallet (instead of EIP-712 by the principal).
 *
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#agent-send-asset
 */
exports.AgentSendAssetRequest = (() => {
    return v.object({
        /** Action to perform. */
        action: v.object({
            /** Type of action. */
            type: v.literal("agentSendAsset"),
            /** Destination address. */
            destination: _schemas_js_1.Address,
            /** Source DEX ("" for default USDC perp DEX, "spot" for spot). */
            sourceDex: v.string(),
            /** Destination DEX ("" for default USDC perp DEX, "spot" for spot). */
            destinationDex: v.string(),
            /** Token identifier. */
            token: v.string(),
            /** Amount to send (not in wei). */
            amount: _schemas_js_1.UnsignedDecimal,
            /** Source sub-account address ("" for main account). */
            fromSubAccount: v.optional(v.union([v.literal(""), _schemas_js_1.Address]), ""),
            /** Nonce (timestamp in ms). Equal to the envelope nonce; injected by the SDK. */
            nonce: _schemas_js_1.UnsignedInteger,
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
const _nonce_js_1 = require("./_base/_nonce.js");
/** Schema for action fields (excludes request-level system fields). */
const AgentSendAssetActionSchema = /* @__PURE__ */ (() => {
    return v.object(exports.AgentSendAssetRequest.entries.action.entries);
})();
/**
 * Transfer tokens on behalf of the principal via an agent wallet.
 *
 * Like {@link sendAsset} but signed as an L1 action by the agent wallet (instead of EIP-712 by the principal).
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
 * import { agentSendAsset } from "@nktkas/hyperliquid/api/exchange";
 * import { privateKeyToAccount } from "npm:viem/accounts";
 *
 * const agentWallet = privateKeyToAccount("0x..."); // approved agent's private key
 * const transport = new HttpTransport(); // or `WebSocketTransport`
 *
 * await agentSendAsset({ transport, wallet: agentWallet }, {
 *   destination: "0x0000000000000000000000000000000000000001",
 *   sourceDex: "",
 *   destinationDex: "test",
 *   token: "USDC:0xeb62eee3685fc4c43992febcd9e75443",
 *   amount: "1",
 * });
 * ```
 *
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#agent-send-asset
 */
function agentSendAsset(config, params, opts) {
    const action = (0, mod_js_1.canonicalize)(AgentSendAssetActionSchema, (0, _base_js_1.parse)(AgentSendAssetActionSchema, { type: "agentSendAsset", ...params, nonce: 0 }));
    return (0, mod_js_2.executeL1Action)({
        ...config,
        nonceManager: async (addr) => 
        // Patch action.nonce in-place so the body matches the envelope nonce (server requires equality).
        action.nonce =
            await (config.nonceManager?.(addr) ?? _nonce_js_1.globalNonceManager.getNonce(`${addr}:${config.transport.isTestnet}`)),
    }, action, opts);
}
//# sourceMappingURL=agentSendAsset.js.map