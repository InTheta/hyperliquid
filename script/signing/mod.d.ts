/**
 * Low-level utilities for signing Hyperliquid transactions.
 * @module
 */
import { type AbstractWallet, type Signature } from "./_abstractWallet.js";
export { type AbstractEthersV5Signer, type AbstractEthersV6Signer, type AbstractViemJsonRpcAccount, type AbstractViemLocalAccount, type AbstractWallet, AbstractWalletError, getWalletAddress, getWalletChainId, type Signature, } from "./_abstractWallet.js";
export { canonicalize, CanonicalizeError } from "./_canonicalize.js";
/**
 * Creates a hash of the L1 action.
 *
 * @param args The action and metadata to hash
 * @return The keccak256 hash as a hex string
 *
 * @example
 * ```ts
 * import { canonicalize, createL1ActionHash } from "@nktkas/hyperliquid/signing";
 * import { CancelRequest } from "@nktkas/hyperliquid/api/exchange";
 *
 * const action = canonicalize(CancelRequest.entries.action, {
 *   type: "cancel",
 *   cancels: [{ a: 0, o: 12345 }],
 * });
 * const nonce = Date.now();
 *
 * const actionHash = createL1ActionHash({ action, nonce });
 * ```
 */
export declare function createL1ActionHash(args: {
    /** The action to be hashed (hash depends on key order). */
    action: Record<string, unknown> | unknown[];
    /** The current timestamp in ms. */
    nonce: number;
    /** Optional vault address used in the action. */
    vaultAddress?: `0x${string}`;
    /** Optional expiration time of the action in ms since the epoch. */
    expiresAfter?: number;
}): `0x${string}`;
/**
 * Signs an L1 action.
 *
 * @param args The wallet, action, and signing parameters
 * @return The ECDSA signature components
 *
 * @throws {AbstractWalletError} If signing fails
 *
 * @example
 * ```ts
 * import { canonicalize, signL1Action } from "@nktkas/hyperliquid/signing";
 * import { CancelRequest } from "@nktkas/hyperliquid/api/exchange";
 * import { privateKeyToAccount } from "npm:viem/accounts";
 *
 * const wallet = privateKeyToAccount("0x..."); // viem or ethers or any AbstractWallet
 *
 * const action = canonicalize(CancelRequest.entries.action, {
 *   type: "cancel",
 *   cancels: [{ a: 0, o: 12345 }],
 * });
 * const nonce = Date.now();
 *
 * const signature = await signL1Action({ wallet, action, nonce });
 *
 * // Send the signed action to the Hyperliquid API
 * const response = await fetch("https://api.hyperliquid.xyz/exchange", {
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   body: JSON.stringify({ action, signature, nonce }),
 * });
 * const body = await response.json();
 * ```
 */
export declare function signL1Action(args: {
    /** Wallet to sign the action. */
    wallet: AbstractWallet;
    /** The action to be signed (hash depends on key order). */
    action: Record<string, unknown> | unknown[];
    /** The current timestamp in ms. */
    nonce: number;
    /**
     * Indicates if the action is for the testnet.
     *
     * Default: `false`
     */
    isTestnet?: boolean;
    /** Optional vault address used in the action. */
    vaultAddress?: `0x${string}`;
    /** Optional expiration time of the action in ms since the epoch. */
    expiresAfter?: number;
}): Promise<Signature>;
/**
 * Signs a user-signed action.
 *
 * @param args The wallet, action, and EIP-712 types
 * @return The ECDSA signature components
 *
 * @throws {AbstractWalletError} If signing fails
 *
 * @example
 * ```ts
 * import { canonicalize, signUserSignedAction } from "@nktkas/hyperliquid/signing";
 * import { ApproveAgentRequest, ApproveAgentTypes } from "@nktkas/hyperliquid/api/exchange";
 * import { privateKeyToAccount } from "npm:viem/accounts";
 *
 * const wallet = privateKeyToAccount("0x..."); // viem or ethers or any AbstractWallet
 *
 * const action = canonicalize(ApproveAgentRequest.entries.action, {
 *   type: "approveAgent",
 *   signatureChainId: "0x66eee" as const,
 *   hyperliquidChain: "Mainnet",
 *   agentAddress: "0x...",
 *   agentName: "Agent",
 *   nonce: Date.now(),
 * });
 *
 * const signature = await signUserSignedAction({ wallet, action, types: ApproveAgentTypes });
 *
 * // Send the signed action to the Hyperliquid API
 * const response = await fetch("https://api.hyperliquid.xyz/exchange", {
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   body: JSON.stringify({ action, signature, nonce: action.nonce }),
 * });
 * const body = await response.json();
 * ```
 */
export declare function signUserSignedAction(args: {
    /** Wallet to sign the action. */
    wallet: AbstractWallet;
    /** The action to be signed (hex strings must be in lower case). */
    action: {
        signatureChainId: `0x${string}`;
        [key: string]: unknown;
    };
    /** The types of the action (hash depends on key order). */
    types: {
        [key: string]: {
            name: string;
            type: string;
        }[];
    };
}): Promise<Signature>;
/**
 * Signs a multi-signature action wrapper with the leader signer.
 *
 * @param args The wallet, action, and signing parameters
 * @return The ECDSA signature components
 *
 * @throws {AbstractWalletError} If signing fails
 *
 * @example
 * ```ts
 * import { canonicalize, signL1Action, signMultiSigAction, trimSignature } from "@nktkas/hyperliquid/signing";
 * import { ScheduleCancelRequest } from "@nktkas/hyperliquid/api/exchange";
 * import { privateKeyToAccount } from "npm:viem/accounts";
 *
 * const wallet = privateKeyToAccount("0x..."); // viem or ethers or any AbstractWallet
 * const multiSigUser = "0x...";
 *
 * const action = canonicalize(ScheduleCancelRequest.entries.action, {
 *   type: "scheduleCancel",
 *   time: Date.now() + 10000,
 * });
 * const nonce = Date.now();
 *
 * // Create the required number of signatures
 * const signatures = await Promise.all(["0x...", "0x..."].map(async (signerPrivKey) => {
 *   const sig = await signL1Action({
 *     wallet: privateKeyToAccount(signerPrivKey as `0x${string}`), // viem or ethers or any AbstractWallet
 *     action: [multiSigUser.toLowerCase(), wallet.address.toLowerCase(), action], // hex strings must be in lower case
 *     nonce,
 *   });
 *   return trimSignature(sig);
 * }));
 *
 * // Then use signatures in the multi-sig action
 * const multiSigAction = {
 *   type: "multiSig",
 *   signatureChainId: "0x66eee" as const,
 *   signatures,
 *   payload: {
 *     multiSigUser,
 *     outerSigner: wallet.address,
 *     action,
 *   },
 * };
 * const multiSigSignature = await signMultiSigAction({ wallet, action: multiSigAction, nonce });
 *
 * // Send the multi-sig action to the Hyperliquid API
 * const response = await fetch("https://api.hyperliquid.xyz/exchange", {
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   body: JSON.stringify({ action: multiSigAction, signature: multiSigSignature, nonce }),
 * });
 * const body = await response.json();
 * ```
 */
export declare function signMultiSigAction(args: {
    /** Wallet to sign the action. */
    wallet: AbstractWallet;
    /** The action to be signed (hash depends on key order). */
    action: {
        signatureChainId: `0x${string}`;
        [key: string]: unknown;
    };
    /** The current timestamp in ms. */
    nonce: number;
    /**
     * Indicates if the action is for the testnet.
     *
     * Default: `false`
     */
    isTestnet?: boolean;
    /** Optional vault address used in the action. */
    vaultAddress?: `0x${string}`;
    /** Optional expiration time of the action in ms since the epoch. */
    expiresAfter?: number;
}): Promise<Signature>;
/**
 * Signs an L1 action with multi-sig orchestration.
 *
 * Collects signatures from all signers, builds the multi-sig wrapper,
 * and signs the wrapper with the leader (first signer).
 *
 * @param args The signers, action, and signing parameters
 * @return A tuple of [multiSigAction, leaderSignature]
 *
 * @throws {AbstractWalletError} If signing fails
 */
export declare function signMultiSigL1(args: {
    /** Array of wallets for multi-sig. First wallet is the leader. */
    signers: readonly [AbstractWallet, ...AbstractWallet[]];
    /** The multi-signature account address. */
    multiSigUser: `0x${string}`;
    /** The leader wallet address (outer signer). */
    outerSigner: `0x${string}`;
    /** Signature chain ID for EIP-712. */
    signatureChainId: `0x${string}`;
    /** The action payload. */
    action: Record<string, unknown>;
    /** The current timestamp in ms. */
    nonce: number;
    /**
     * Indicates if the action is for the testnet.
     *
     * Default: `false`
     */
    isTestnet?: boolean;
    /** Optional vault address used in the action. */
    vaultAddress?: `0x${string}`;
    /** Optional expiration time of the action in ms since the epoch. */
    expiresAfter?: number;
}): Promise<[Record<string, unknown>, Signature]>;
/**
 * Signs a user-signed action (EIP-712) with multi-sig orchestration.
 *
 * Collects signatures from all signers (with multi-sig payload fields injected),
 * builds the multi-sig wrapper, and signs the wrapper with the leader.
 *
 * @param args The signers, action, types, and signing parameters
 * @return A tuple of [multiSigAction, leaderSignature]
 *
 * @throws {AbstractWalletError} If signing fails
 */
export declare function signMultiSigUserSigned(args: {
    /** Array of wallets for multi-sig. First wallet is the leader. */
    signers: readonly [AbstractWallet, ...AbstractWallet[]];
    /** The multi-signature account address. */
    multiSigUser: `0x${string}`;
    /** The leader wallet address (outer signer). */
    outerSigner: `0x${string}`;
    /** The action payload (must include signatureChainId). */
    action: {
        signatureChainId: `0x${string}`;
        [key: string]: unknown;
    };
    /** EIP-712 type definitions. */
    types: {
        [key: string]: {
            name: string;
            type: string;
        }[];
    };
    /** The current timestamp in ms. */
    nonce: number;
    /**
     * Indicates if the action is for the testnet.
     *
     * Default: `false`
     */
    isTestnet?: boolean;
}): Promise<[Record<string, unknown>, Signature]>;
/** Remove leading zeros from signature r,s components (required for multi-signature in Hyperliquid API). */
export declare function trimSignature(sig: Signature): Signature;
//# sourceMappingURL=mod.d.ts.map