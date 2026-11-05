"use strict";
/**
 * Execute helpers for L1 and user-signed Exchange API actions.
 * @module
 */
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
exports.executeL1Action = executeL1Action;
exports.executeUserSignedAction = executeUserSignedAction;
const v = __importStar(require("valibot"));
const _base_js_1 = require("../../../../_base.js");
const mod_js_1 = require("../../../../signing/mod.js");
const _schemas_js_1 = require("../../../_schemas.js");
const _shell_js_1 = require("./_shell.js");
// ============================================================
// Execute L1 Action
// ============================================================
/**
 * Execute an L1 action on the Hyperliquid Exchange.
 *
 * Handles both single-wallet and multi-sig signing.
 *
 * @param config Exchange API configuration.
 * @param action Action payload to execute.
 * @param options Additional options for the request.
 * @return API response.
 *
 * @throws {ValidationError} If the request options fail validation.
 * @throws {ApiRequestError} If the API returns an error response.
 */
async function executeL1Action(config, action, options) {
    // Validate options before acquiring the lock.
    const vaultAddress = (0, _base_js_1.parse)(v.optional(_schemas_js_1.Address), options?.vaultAddress ?? config.defaultVaultAddress);
    const expiresAfter = (0, _base_js_1.parse)(v.optional(_schemas_js_1.UnsignedInteger), options?.expiresAfter ??
        (typeof config.defaultExpiresAfter === "function"
            ? await config.defaultExpiresAfter()
            : config.defaultExpiresAfter));
    return (0, _shell_js_1.executeWithShell)(config, async (nonce) => {
        if ("wallet" in config) {
            const signature = await (0, mod_js_1.signL1Action)({
                wallet: config.wallet,
                action,
                nonce,
                isTestnet: config.transport.isTestnet,
                vaultAddress,
                expiresAfter,
            });
            return { action, signature, extras: { vaultAddress, expiresAfter } };
        }
        else {
            const { action: wrapper, signature } = await (0, mod_js_1.signMultiSigL1)({
                signers: config.signers,
                multiSigUser: config.multiSigUser,
                signatureChainId: await resolveSignatureChainId(config),
                action,
                nonce,
                isTestnet: config.transport.isTestnet,
                vaultAddress,
                expiresAfter,
            });
            return { action: wrapper, signature, extras: { vaultAddress, expiresAfter } };
        }
    }, options?.signal);
}
// ============================================================
// Execute User-Signed Action
// ============================================================
/**
 * Execute a user-signed action (EIP-712) on the Hyperliquid Exchange.
 *
 * Handles both single-wallet and multi-sig signing.
 *
 * @param config Exchange API configuration.
 * @param action Action payload to execute.
 * @param types EIP-712 type definitions for signing.
 * @param options Additional options for the request.
 * @return API response.
 *
 * @throws {ValidationError} If the request options fail validation.
 * @throws {ApiRequestError} If the API returns an error response.
 */
function executeUserSignedAction(config, action, types, options) {
    return (0, _shell_js_1.executeWithShell)(config, async (nonce) => {
        // --- Construct full action (type, system fields, user fields, nonce/time)
        const { type, ...restAction } = action;
        const nonceFieldName = extractNonceFieldName(types);
        const baseFields = {
            type,
            signatureChainId: await resolveSignatureChainId(config),
            hyperliquidChain: config.transport.isTestnet ? "Testnet" : "Mainnet",
        };
        const fullAction = nonceFieldName === "nonce"
            ? { ...baseFields, ...restAction, nonce }
            : { ...baseFields, ...restAction, time: nonce };
        // --- Sign (single-wallet or multi-sig) -------------------
        if ("wallet" in config) {
            const signature = await (0, mod_js_1.signUserSignedAction)({
                wallet: config.wallet,
                action: fullAction,
                types,
            });
            return { action: fullAction, signature };
        }
        else {
            const payloadAction = options?.toMultiSigPayloadAction?.(fullAction) ?? fullAction;
            const { action: wrapper, signature } = await (0, mod_js_1.signMultiSigUserSigned)({
                signers: config.signers,
                multiSigUser: config.multiSigUser,
                action: fullAction,
                payloadAction,
                types,
            });
            return { action: wrapper, signature };
        }
    }, options?.signal);
}
// ============================================================
// Helpers
// ============================================================
/** Extracts the nonce field name ("nonce" or "time") from EIP-712 type definitions. */
function extractNonceFieldName(types) {
    const primaryType = Object.keys(types)[0];
    const field = types[primaryType].find((f) => f.name === "nonce" || f.name === "time");
    if (!field) {
        throw new _base_js_1.HyperliquidError(`EIP-712 types must contain a "nonce" or "time" field in "${primaryType}"`);
    }
    return field.name;
}
/** Resolves signature chain ID from config, or falls back to the leader wallet's chain ID. */
async function resolveSignatureChainId(config) {
    if (config.signatureChainId) {
        const id = typeof config.signatureChainId === "function"
            ? await config.signatureChainId()
            : config.signatureChainId;
        return (0, _base_js_1.parse)(_schemas_js_1.Hex, id);
    }
    const leader = "wallet" in config ? config.wallet : config.signers[0];
    return await (0, mod_js_1.getWalletChainId)(leader);
}
//# sourceMappingURL=execute.js.map