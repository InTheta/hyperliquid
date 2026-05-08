/**
 * Execute helpers for L1 and user-signed Exchange API actions.
 * @module
 */
import * as v from "valibot";
import { parse } from "../../../../_base.js";
import { getWalletAddress, getWalletChainId, signL1Action, signMultiSigL1, signMultiSigUserSigned, signUserSignedAction, } from "../../../../signing/mod.js";
import { Address, Hex, UnsignedInteger } from "../../../_schemas.js";
import { globalNonceManager } from "./_nonce.js";
import { withLock } from "./_semaphore.js";
import { assertSuccessResponse } from "./errors.js";
// ============================================================
// Execute L1 Action
// ============================================================
/**
 * Execute an L1 action on the Hyperliquid Exchange.
 *
 * Handles both single-wallet and multi-sig signing.
 *
 * @param config Exchange API configuration
 * @param action Action payload to execute
 * @param options Additional options for the request
 * @return API response
 *
 * @throws {ApiRequestError} If the API returns an error response
 */
export async function executeL1Action(config, action, options) {
    const { transport } = config;
    const leader = getLeader(config);
    const walletAddress = await getWalletAddress(leader);
    // Semaphore ensures requests arrive at server in nonce order (prevents out-of-order delivery)
    const key = `${walletAddress}:${transport.isTestnet}`;
    return await withLock(key, async () => {
        const nonce = await (config.nonceManager?.(walletAddress) ?? globalNonceManager.getNonce(key));
        // Validate and resolve options
        const vaultAddress = parse(v.optional(Address), options?.vaultAddress ?? config.defaultVaultAddress);
        const expiresAfter = parse(v.optional(UnsignedInteger), options?.expiresAfter ??
            (typeof config.defaultExpiresAfter === "number"
                ? config.defaultExpiresAfter
                : await config.defaultExpiresAfter?.()));
        const signal = options?.signal;
        // Sign action (multi-sig or single wallet)
        const [finalAction, signature] = "wallet" in config
            ? [
                action,
                await signL1Action({
                    wallet: leader,
                    action,
                    nonce,
                    isTestnet: transport.isTestnet,
                    vaultAddress,
                    expiresAfter,
                }),
            ]
            : await signMultiSigL1({
                signers: config.signers,
                multiSigUser: config.multiSigUser,
                outerSigner: walletAddress,
                signatureChainId: await getSignatureChainId(config),
                action,
                nonce,
                isTestnet: transport.isTestnet,
                vaultAddress,
                expiresAfter,
            });
        // Send request and validate response
        const response = await transport.request("exchange", {
            action: finalAction,
            signature,
            nonce,
            vaultAddress,
            expiresAfter,
        }, signal);
        assertSuccessResponse(response);
        return response;
    });
}
// ============================================================
// Execute User-Signed Action
// ============================================================
/** Extract nonce field name from EIP-712 types ("nonce" or "time"). */
function getNonceFieldName(types) {
    const primaryType = Object.keys(types)[0];
    const field = types[primaryType].find((f) => f.name === "nonce" || f.name === "time");
    if (!field)
        throw new Error(`EIP-712 types must contain a "nonce" or "time" field in "${primaryType}"`);
    return field.name;
}
/**
 * Execute a user-signed action (EIP-712) on the Hyperliquid Exchange.
 *
 * Handles both single-wallet and multi-sig signing.
 * Automatically adds signatureChainId, hyperliquidChain, and nonce/time.
 *
 * @param config Exchange API configuration
 * @param action Action payload to execute
 * @param types EIP-712 type definitions for signing
 * @param options Additional options for the request
 * @return API response
 *
 * @throws {ApiRequestError} If the API returns an error response
 */
export async function executeUserSignedAction(config, action, types, options) {
    const { transport } = config;
    const leader = getLeader(config);
    const walletAddress = await getWalletAddress(leader);
    // Semaphore ensures requests arrive at server in nonce order (prevents out-of-order delivery)
    const key = `${walletAddress}:${transport.isTestnet}`;
    return withLock(key, async () => {
        const nonce = await (config.nonceManager?.(walletAddress) ?? globalNonceManager.getNonce(key));
        const signal = options?.signal;
        // Add system fields for user-signed actions
        const { type, ...restAction } = action;
        const nonceFieldName = getNonceFieldName(types);
        const fullAction = {
            type,
            signatureChainId: await getSignatureChainId(config),
            hyperliquidChain: transport.isTestnet ? "Testnet" : "Mainnet",
            ...restAction,
            [nonceFieldName]: nonce,
        };
        // Sign action (multi-sig or single wallet)
        const [finalAction, signature] = "wallet" in config
            ? [fullAction, await signUserSignedAction({ wallet: leader, action: fullAction, types })]
            : await signMultiSigUserSigned({
                signers: config.signers,
                multiSigUser: config.multiSigUser,
                outerSigner: walletAddress,
                action: fullAction,
                types,
                nonce,
                isTestnet: transport.isTestnet,
            });
        // Send request and validate response
        const response = await transport.request("exchange", {
            action: finalAction,
            signature,
            nonce,
        }, signal);
        assertSuccessResponse(response);
        return response;
    });
}
// ============================================================
// Helpers
// ============================================================
/** Get the leader wallet (first signer for the single wallet, or multi-sig). */
function getLeader(config) {
    return "wallet" in config ? config.wallet : config.signers[0];
}
/** Resolve signature chain ID from config or wallet. */
async function getSignatureChainId(config) {
    if (config.signatureChainId) {
        const id = typeof config.signatureChainId === "function"
            ? await config.signatureChainId()
            : config.signatureChainId;
        return parse(Hex, id);
    }
    return getWalletChainId(getLeader(config));
}
//# sourceMappingURL=execute.js.map