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
exports.UserOutcomeRequest = void 0;
exports.userOutcome = userOutcome;
const v = __importStar(require("valibot"));
// ============================================================
// API Schemas
// ============================================================
const _schemas_js_1 = require("../../_schemas.js");
/**
 * Manually split or merge outcome shares to convert between primary and dual balances.
 *
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#split-outcome
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#merge-outcome
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#merge-question
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#negate-outcome
 */
exports.UserOutcomeRequest = (() => {
    return v.object({
        /** Outcome action. */
        action: v.variant("type", [
            v.object({
                /** Type of action. */
                type: v.literal("userOutcome"),
                /** Split `X` quote tokens into `X` Yes and `X` No shares of an outcome. */
                splitOutcome: v.object({
                    /** Outcome identifier. */
                    outcome: _schemas_js_1.UnsignedInteger,
                    /** Amount of quote tokens to split. */
                    amount: _schemas_js_1.UnsignedDecimal,
                }),
            }),
            v.object({
                /** Type of action. */
                type: v.literal("userOutcome"),
                /** Merge `X` Yes and `X` No shares of an outcome into `X` quote tokens. */
                mergeOutcome: v.object({
                    /** Outcome identifier. */
                    outcome: _schemas_js_1.UnsignedInteger,
                    /** Amount of shares to merge, or `null` for the maximum available. */
                    amount: v.nullable(_schemas_js_1.UnsignedDecimal),
                }),
            }),
            v.object({
                /** Type of action. */
                type: v.literal("userOutcome"),
                /** Merge `X` Yes shares from each outcome associated to the same question into `X` quote tokens. */
                mergeQuestion: v.object({
                    /** Question identifier. */
                    question: _schemas_js_1.UnsignedInteger,
                    /** Amount of shares to merge, or `null` for the maximum available. */
                    amount: v.nullable(_schemas_js_1.UnsignedDecimal),
                }),
            }),
            v.object({
                /** Type of action. */
                type: v.literal("userOutcome"),
                /**
                 * Convert `X` No shares from an outcome associated with a question into
                 * `X` Yes shares of every other outcome associated with the question.
                 */
                negateOutcome: v.object({
                    /** Question identifier. */
                    question: _schemas_js_1.UnsignedInteger,
                    /** Outcome identifier. */
                    outcome: _schemas_js_1.UnsignedInteger,
                    /** Amount of No shares to negate. */
                    amount: _schemas_js_1.UnsignedDecimal,
                }),
            }),
        ]),
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
const UserOutcomeActionSchema = /* @__PURE__ */ (() => {
    return v.variant("type", exports.UserOutcomeRequest.entries.action.options);
})();
/**
 * Manually split or merge outcome shares to convert between primary and dual balances.
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
 * @example Split outcome
 * ```ts
 * import { HttpTransport } from "@nktkas/hyperliquid";
 * import { userOutcome } from "@nktkas/hyperliquid/api/exchange";
 * import { privateKeyToAccount } from "npm:viem/accounts";
 *
 * const wallet = privateKeyToAccount("0x..."); // viem or ethers
 * const transport = new HttpTransport(); // or `WebSocketTransport`
 *
 * await userOutcome({ transport, wallet }, {
 *   splitOutcome: { outcome: 0, amount: "1" },
 * });
 * ```
 *
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#split-outcome
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#merge-outcome
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#merge-question
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#negate-outcome
 */
function userOutcome(config, params, opts) {
    const action = (0, mod_js_1.canonicalize)(UserOutcomeActionSchema, (0, _base_js_1.parse)(UserOutcomeActionSchema, { type: "userOutcome", ...params }));
    return (0, mod_js_2.executeL1Action)(config, action, opts);
}
//# sourceMappingURL=userOutcome.js.map