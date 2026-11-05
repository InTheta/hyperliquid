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
exports.FinalizeEvmContractRequest = void 0;
exports.finalizeEvmContract = finalizeEvmContract;
const v = __importStar(require("valibot"));
// ============================================================
// API Schemas
// ============================================================
const _schemas_js_1 = require("../../_schemas.js");
/**
 * Finalize the link between a HyperCore spot token and an ERC-20 contract on the HyperEVM.
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/hypercore-less-than-greater-than-hyperevm-transfers
 */
exports.FinalizeEvmContractRequest = (() => {
    return v.object({
        /** Action to perform. */
        action: v.object({
            /** Type of action. */
            type: v.literal("finalizeEvmContract"),
            /** Token identifier to link. */
            token: _schemas_js_1.UnsignedInteger,
            /**
             * Verification method matching how the EVM contract was deployed:
             * - `{ create: { nonce } }`: contract deployed from an EOA — the EVM user signs with the deploy nonce.
             * - `"firstStorageSlot"`: finalizer address is stored at the contract's first storage slot.
             * - `"customStorageSlot"`: finalizer address is stored at slot `keccak256("HyperCore deployer")`.
             */
            input: v.union([
                v.object({
                    /** Use the EVM deployment nonce of an EOA-deployed contract. */
                    create: v.object({
                        /** Nonce used to deploy the EVM contract. */
                        nonce: _schemas_js_1.UnsignedInteger,
                    }),
                }),
                v.literal("firstStorageSlot"),
                v.literal("customStorageSlot"),
            ]),
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
const FinalizeEvmContractActionSchema = /* @__PURE__ */ (() => {
    return v.object(exports.FinalizeEvmContractRequest.entries.action.entries);
})();
/**
 * Finalize the link between a HyperCore spot token and an ERC-20 contract on the HyperEVM.
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
 * @example Finalize from an EOA-deployed contract
 * ```ts
 * import { HttpTransport } from "@nktkas/hyperliquid";
 * import { finalizeEvmContract } from "@nktkas/hyperliquid/api/exchange";
 * import { privateKeyToAccount } from "npm:viem/accounts";
 *
 * const wallet = privateKeyToAccount("0x..."); // viem or ethers
 * const transport = new HttpTransport(); // or `WebSocketTransport`
 *
 * await finalizeEvmContract({ transport, wallet }, {
 *   token: 200,
 *   input: { create: { nonce: 0 } },
 * });
 * ```
 *
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/hypercore-less-than-greater-than-hyperevm-transfers
 */
function finalizeEvmContract(config, params, opts) {
    const action = (0, mod_js_1.canonicalize)(FinalizeEvmContractActionSchema, (0, _base_js_1.parse)(FinalizeEvmContractActionSchema, { type: "finalizeEvmContract", ...params }));
    return (0, mod_js_2.executeL1Action)(config, action, opts);
}
//# sourceMappingURL=finalizeEvmContract.js.map