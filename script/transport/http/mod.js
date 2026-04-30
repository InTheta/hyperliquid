"use strict";
/**
 * HTTP transport for executing requests to the Hyperliquid API.
 *
 * Use {@link HttpTransport} for simple requests via HTTP POST.
 *
 * @example
 * ```ts
 * import { HttpTransport, InfoClient } from "@nktkas/hyperliquid";
 *
 * const transport = new HttpTransport();
 * const client = new InfoClient({ transport });
 *
 * const mids = await client.allMids();
 * ```
 *
 * @module
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpTransport = exports.HttpRequestError = exports.TESTNET_RPC_URL = exports.MAINNET_RPC_URL = exports.TESTNET_API_URL = exports.MAINNET_API_URL = exports.TokenBucketRateLimiter = void 0;
const _base_js_1 = require("../_base.js");
const _polyfills_js_1 = require("../_polyfills.js");
/** Token bucket rate limiter for Hyperliquid request weights. */
class TokenBucketRateLimiter {
    capacity;
    refillRate;
    _tokens;
    _lastRefill;
    _now;
    _sleep;
    /**
     * Creates a token bucket rate limiter.
     *
     * @param options Configuration options.
     */
    constructor(options) {
        this.capacity = options?.capacity ?? 100;
        this.refillRate = options?.refillRate ?? 10;
        if (this.capacity <= 0)
            throw new RangeError("Capacity must be greater than 0");
        if (this.refillRate <= 0)
            throw new RangeError("Refill rate must be greater than 0");
        this._tokens = Math.max(0, Math.min(options?.initialTokens ?? this.capacity, this.capacity));
        this._now = options?.now ?? Date.now;
        this._sleep = options?.sleep ?? sleep;
        this._lastRefill = this._now();
    }
    /**
     * Waits until the requested weight is available and consumes it.
     *
     * @param weight Number of tokens to consume.
     * @param signal Optional signal to cancel the wait.
     */
    async waitForToken(weight, signal) {
        const weight_ = weight ?? 1;
        if (weight_ <= 0)
            throw new RangeError("Weight must be greater than 0");
        if (weight_ > this.capacity)
            throw new RangeError("Weight cannot exceed capacity");
        while (true) {
            if (signal?.aborted)
                throw signal.reason;
            this._refill();
            if (this._tokens >= weight_) {
                this._tokens -= weight_;
                return;
            }
            const waitMs = ((weight_ - this._tokens) / this.refillRate) * 1000;
            await this._sleep(waitMs, signal);
        }
    }
    /** Refills tokens according to elapsed time. */
    _refill() {
        const now = this._now();
        const elapsedMs = Math.max(0, now - this._lastRefill);
        if (elapsedMs === 0)
            return;
        this._tokens = Math.min(this.capacity, this._tokens + (elapsedMs / 1000) * this.refillRate);
        this._lastRefill = now;
    }
}
exports.TokenBucketRateLimiter = TokenBucketRateLimiter;
/** Mainnet API URL. */
exports.MAINNET_API_URL = "https://api.hyperliquid.xyz";
/** Testnet API URL. */
exports.TESTNET_API_URL = "https://api.hyperliquid-testnet.xyz";
/** Mainnet RPC URL. */
exports.MAINNET_RPC_URL = "https://rpc.hyperliquid.xyz";
/** Testnet RPC URL. */
exports.TESTNET_RPC_URL = "https://rpc.hyperliquid-testnet.xyz";
/** Error thrown when an HTTP request fails. */
class HttpRequestError extends _base_js_1.TransportError {
    /** The HTTP response that caused the error. */
    response;
    /**
     * Creates a new HTTP request error.
     *
     * @param args The error arguments.
     * @param args.response The HTTP response that caused the error.
     * @param args.message Optional message to append after the status line.
     * @param options The error options.
     */
    constructor(args, options) {
        const { response, message: detail } = args ?? {};
        let message;
        if (response) {
            message = `${response.status} ${response.statusText}`.trim();
            if (detail)
                message += ` - ${detail}`;
        }
        else {
            message = `Unknown HTTP request error: ${options?.cause}`;
        }
        super(message, options);
        this.name = "HttpRequestError";
        this.response = response;
    }
}
exports.HttpRequestError = HttpRequestError;
/**
 * HTTP transport for Hyperliquid API.
 *
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint
 */
class HttpTransport {
    /** Indicates this transport uses testnet endpoint. */
    isTestnet;
    /** Request timeout in ms. Set to `null` to disable. */
    timeout;
    /** Custom API URL for requests. */
    apiUrl;
    /** Custom RPC URL for explorer requests. */
    rpcUrl;
    /** A custom {@link https://developer.mozilla.org/en-US/docs/Web/API/RequestInit | RequestInit} that is merged with a fetch request. */
    fetchOptions;
    _rateLimit;
    /**
     * Creates a new HTTP transport instance.
     *
     * @param options Configuration options for the HTTP transport layer.
     */
    constructor(options) {
        this.isTestnet = options?.isTestnet ?? false;
        this.timeout = options?.timeout === undefined ? 10_000 : options.timeout;
        this.apiUrl = options?.apiUrl ?? (this.isTestnet ? exports.TESTNET_API_URL : exports.MAINNET_API_URL);
        this.rpcUrl = options?.rpcUrl ?? (this.isTestnet ? exports.TESTNET_RPC_URL : exports.MAINNET_RPC_URL);
        this.fetchOptions = options?.fetchOptions ?? {};
        this._rateLimit = normalizeRateLimitOptions(options?.rateLimit);
    }
    /**
     * Sends a request to the Hyperliquid API via {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API | fetch}.
     *
     * @param endpoint The API endpoint to send the request to.
     * @param payload The payload to send with the request.
     * @param signal {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | AbortSignal} to cancel the request.
     * @return A promise that resolves with parsed JSON response body.
     *
     * @throws {HttpRequestError} Thrown when the HTTP request fails.
     */
    async request(endpoint, payload, signal) {
        try {
            // Construct a Request
            const url = new URL(endpoint, endpoint === "explorer" ? this.rpcUrl : this.apiUrl);
            const init = this._mergeRequestInit({
                body: JSON.stringify(payload),
                headers: {
                    "Accept-Encoding": "gzip, deflate, br, zstd",
                    "Content-Type": "application/json",
                },
                keepalive: true,
                method: "POST",
                signal: this.timeout ? _polyfills_js_1.AbortSignal_.timeout(this.timeout) : undefined,
            }, this.fetchOptions, { signal });
            // Send the Request and wait for a Response
            const response = await this._fetchWithRateLimit(url, init, init.signal);
            // Validate the Response
            if (!response.ok || !response.headers.get("Content-Type")?.includes("application/json")) {
                const clone = response.clone();
                const body = await response.text().catch(() => undefined); // releases connection, clone stays readable
                throw new HttpRequestError({ response: clone, message: body });
            }
            // Parse the response body
            const clone = response.clone();
            const body = await response.json();
            // Check if the response is an error
            if (body?.type === "error") {
                throw new HttpRequestError({ response: clone, message: body?.message });
            }
            // Return the response body
            return body;
        }
        catch (error) {
            if (error instanceof _base_js_1.TransportError)
                throw error; // Re-throw known errors
            throw new HttpRequestError(undefined, { cause: error });
        }
    }
    /** Sends a fetch request with optional token-bucket throttling and 429 retry handling. */
    async _fetchWithRateLimit(url, init, signal) {
        const rateLimit = this._rateLimit;
        if (!rateLimit)
            return await fetch(url, init);
        let attempt = 0;
        while (true) {
            await rateLimit.limiter.waitForToken(rateLimit.requestWeight, signal ?? undefined);
            const response = await fetch(url, init);
            if (response.status !== 429 || attempt >= rateLimit.maxRetries)
                return response;
            await response.text().catch(() => undefined); // release connection before retrying
            const delay = getRetryDelay(response, attempt, rateLimit);
            await rateLimit.sleep(delay, signal ?? undefined);
            attempt++;
        }
    }
    /** Merges multiple `HeadersInit` into one {@link https://developer.mozilla.org/en-US/docs/Web/API/Headers/Headers | Headers}. */
    _mergeHeadersInit(...inits) {
        const merged = new Headers();
        for (const headers of inits) {
            const entries = Symbol.iterator in headers ? headers : Object.entries(headers);
            for (const [key, value] of entries) {
                merged.set(key, value);
            }
        }
        return merged;
    }
    /** Merges multiple {@link https://developer.mozilla.org/en-US/docs/Web/API/RequestInit | RequestInit} into one {@link https://developer.mozilla.org/en-US/docs/Web/API/RequestInit | RequestInit}. */
    _mergeRequestInit(...inits) {
        const merged = {};
        const headersList = [];
        const signals = [];
        for (const init of inits) {
            Object.assign(merged, init);
            if (init.headers)
                headersList.push(init.headers);
            if (init.signal)
                signals.push(init.signal);
        }
        if (headersList.length > 0)
            merged.headers = this._mergeHeadersInit(...headersList);
        if (signals.length > 0)
            merged.signal = signals.length > 1 ? _polyfills_js_1.AbortSignal_.any(signals) : signals[0];
        return merged;
    }
}
exports.HttpTransport = HttpTransport;
function normalizeRateLimitOptions(value) {
    if (!value)
        return undefined;
    const options = value === true ? {} : value;
    return {
        limiter: options.limiter ?? new TokenBucketRateLimiter(options),
        requestWeight: options.requestWeight ?? 1,
        maxRetries: options.maxRetries ?? 3,
        initialBackoffMs: options.initialBackoffMs ?? 250,
        maxBackoffMs: options.maxBackoffMs ?? 5_000,
        sleep: options.sleep ?? sleep,
    };
}
function getRetryDelay(response, attempt, options) {
    const retryAfter = response.headers.get("Retry-After");
    const retryAfterMs = retryAfter ? parseRetryAfter(retryAfter) : undefined;
    if (retryAfterMs !== undefined)
        return retryAfterMs;
    return Math.min(options.initialBackoffMs * 2 ** attempt, options.maxBackoffMs);
}
function parseRetryAfter(value) {
    const seconds = Number(value);
    if (Number.isFinite(seconds))
        return Math.max(0, seconds * 1000);
    const dateMs = Date.parse(value);
    if (Number.isFinite(dateMs))
        return Math.max(0, dateMs - Date.now());
    return undefined;
}
function sleep(ms, signal) {
    return new Promise((resolve, reject) => {
        if (signal?.aborted)
            return reject(signal.reason);
        const onAbort = () => {
            clearTimeout(timer);
            reject(signal?.reason);
        };
        const timer = setTimeout(() => {
            signal?.removeEventListener("abort", onAbort);
            resolve();
        }, ms);
        signal?.addEventListener("abort", onAbort, { once: true });
    });
}
//# sourceMappingURL=mod.js.map