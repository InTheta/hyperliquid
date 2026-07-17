"use strict";
/**
 * Common execution shell shared by L1 and user-signed Exchange API actions.
 * @module
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeWithShell = executeWithShell;
const mod_js_1 = require("../../../../signing/mod.js");
const errors_js_1 = require("./errors.js");
const _nonce_js_1 = require("./_nonce.js");
const _semaphore_js_1 = require("./_semaphore.js");
/**
 * Common shell for executing an Exchange API request:
 * acquires per-`(walletAddress × isTestnet)` lock, generates nonce, calls `build` to construct
 * the signed payload, sends to the Exchange endpoint, and validates the response.
 *
 * @param config Exchange API configuration.
 * @param build Callback that, given the nonce, returns the action, signature, and any extras.
 * @param signal Optional {@link AbortSignal} to cancel the request.
 * @return The validated API response.
 *
 * @throws {ApiRequestError} If the API returns an error response.
 */
async function executeWithShell(config, build, signal) {
    const leader = "wallet" in config ? config.wallet : config.signers[0];
    const walletAddress = await (0, mod_js_1.getWalletAddress)(leader);
    // Lock per (wallet × testnet) ensures requests arrive at the server in nonce order.
    const key = `${walletAddress}:${config.transport.isTestnet}`;
    return await (0, _semaphore_js_1.withLock)(key, async () => {
        // --- Generate nonce --------------------------------------
        const nonce = await (config.nonceManager?.(walletAddress) ?? _nonce_js_1.globalNonceManager.getNonce(key));
        // --- Build signed payload --------------------------------
        const { action, signature, extras } = await build(nonce);
        // --- Send and validate -----------------------------------
        const response = await config.transport.request("exchange", {
            action,
            signature,
            nonce,
            ...extras,
        }, signal);
        (0, errors_js_1.assertSuccessResponse)(response);
        return response;
    });
}
//# sourceMappingURL=_shell.js.map