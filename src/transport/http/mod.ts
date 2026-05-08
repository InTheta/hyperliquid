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

import { type IRequestTransport, TransportError } from "../_base.js";
import { AbortSignal_ } from "../_polyfills.js";

export type SleepFn = (ms: number, signal?: AbortSignal) => Promise<void>;
export type NowFn = () => number;

/** Options for {@link TokenBucketRateLimiter}. */
export interface TokenBucketRateLimiterOptions {
  /**
   * Maximum tokens available at once.
   *
   * Default: `100`
   */
  capacity?: number;
  /**
   * Number of tokens refilled per second.
   *
   * Default: `10`
   */
  refillRate?: number;
  /**
   * Initial number of tokens.
   *
   * Default: same as `capacity`
   */
  initialTokens?: number;
  /** Custom time source in milliseconds. */
  now?: NowFn;
  /** Custom sleep function. */
  sleep?: SleepFn;
}

/** Token bucket rate limiter for Hyperliquid request weights. */
export class TokenBucketRateLimiter {
  capacity: number;
  refillRate: number;

  protected _tokens: number;
  protected _lastRefill: number;
  protected _now: NowFn;
  protected _sleep: SleepFn;

  /**
   * Creates a token bucket rate limiter.
   *
   * @param options Configuration options.
   */
  constructor(options?: TokenBucketRateLimiterOptions) {
    this.capacity = options?.capacity ?? 100;
    this.refillRate = options?.refillRate ?? 10;
    if (this.capacity <= 0) throw new RangeError("Capacity must be greater than 0");
    if (this.refillRate <= 0) throw new RangeError("Refill rate must be greater than 0");

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
  async waitForToken(weight?: number, signal?: AbortSignal): Promise<void> {
    const weight_ = weight ?? 1;
    if (weight_ <= 0) throw new RangeError("Weight must be greater than 0");
    if (weight_ > this.capacity) throw new RangeError("Weight cannot exceed capacity");

    while (true) {
      if (signal?.aborted) throw signal.reason;
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
  protected _refill(): void {
    const now = this._now();
    const elapsedMs = Math.max(0, now - this._lastRefill);
    if (elapsedMs === 0) return;

    this._tokens = Math.min(this.capacity, this._tokens + (elapsedMs / 1000) * this.refillRate);
    this._lastRefill = now;
  }
}

/** HTTP rate limiting and retry options. */
export interface RateLimitOptions extends TokenBucketRateLimiterOptions {
  /** Existing limiter instance to share between transports. */
  limiter?: TokenBucketRateLimiter;
  /**
   * Request weight charged for each HTTP call.
   *
   * Default: `1`
   */
  requestWeight?: number;
  /**
   * Maximum number of retries after HTTP 429 responses.
   *
   * Default: `3`
   */
  maxRetries?: number;
  /**
   * Initial exponential backoff delay in ms when no `Retry-After` header is provided.
   *
   * Default: `250`
   */
  initialBackoffMs?: number;
  /**
   * Maximum exponential backoff delay in ms.
   *
   * Default: `5_000`
   */
  maxBackoffMs?: number;
}

/** Configuration options for the HTTP transport layer. */
export interface HttpTransportOptions {
  /**
   * Indicates this transport uses testnet endpoint.
   *
   * Default: false
   */
  isTestnet?: boolean;
  /**
   * Request timeout in ms. Set to `null` to disable.
   *
   * Default: `10_000`
   */
  timeout?: number | null;
  /**
   * Custom API URL for requests.
   *
   * Default: `https://api.hyperliquid.xyz` for mainnet, `https://api.hyperliquid-testnet.xyz` for testnet.
   */
  apiUrl?: string | URL;
  /**
   * Custom RPC URL for explorer requests.
   *
   * Default: `https://rpc.hyperliquid.xyz` for mainnet, `https://rpc.hyperliquid-testnet.xyz` for testnet.
   */
  rpcUrl?: string | URL;
  /** A custom {@link https://developer.mozilla.org/en-US/docs/Web/API/RequestInit | RequestInit} that is merged with a fetch request. */
  fetchOptions?: Omit<RequestInit, "body" | "method">;
  /**
   * Optional client-side rate limiting and 429 retry handling.
   *
   * Default: disabled.
   */
  rateLimit?: boolean | RateLimitOptions;
}

/** Mainnet API URL. */
export const MAINNET_API_URL = "https://api.hyperliquid.xyz";
/** Testnet API URL. */
export const TESTNET_API_URL = "https://api.hyperliquid-testnet.xyz";
/** Mainnet RPC URL. */
export const MAINNET_RPC_URL = "https://rpc.hyperliquid.xyz";
/** Testnet RPC URL. */
export const TESTNET_RPC_URL = "https://rpc.hyperliquid-testnet.xyz";

/** Error thrown when an HTTP request fails. */
export class HttpRequestError extends TransportError {
  /** The HTTP response that caused the error. */
  response?: Response;

  /**
   * Creates a new HTTP request error.
   *
   * @param args The error arguments.
   * @param args.response The HTTP response that caused the error.
   * @param args.message Optional message to append after the status line.
   * @param options The error options.
   */
  constructor(args?: { response?: Response; message?: string }, options?: ErrorOptions) {
    const { response, message: detail } = args ?? {};

    let message: string;
    if (response) {
      message = `${response.status} ${response.statusText}`.trim();
      if (detail) message += ` - ${detail}`;
    } else {
      message = `Unknown HTTP request error: ${options?.cause}`;
    }

    super(message, options);
    this.name = "HttpRequestError";
    this.response = response;
  }
}

/**
 * HTTP transport for Hyperliquid API.
 *
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint
 */
export class HttpTransport implements IRequestTransport {
  /** Indicates this transport uses testnet endpoint. */
  isTestnet: boolean;
  /** Request timeout in ms. Set to `null` to disable. */
  timeout: number | null;
  /** Custom API URL for requests. */
  apiUrl: string | URL;
  /** Custom RPC URL for explorer requests. */
  rpcUrl: string | URL;
  /** A custom {@link https://developer.mozilla.org/en-US/docs/Web/API/RequestInit | RequestInit} that is merged with a fetch request. */
  fetchOptions: Omit<RequestInit, "body" | "method">;

  protected readonly _rateLimit: NormalizedRateLimitOptions | undefined;

  /**
   * Creates a new HTTP transport instance.
   *
   * @param options Configuration options for the HTTP transport layer.
   */
  constructor(options?: HttpTransportOptions) {
    this.isTestnet = options?.isTestnet ?? false;
    this.timeout = options?.timeout === undefined ? 10_000 : options.timeout;
    this.apiUrl = options?.apiUrl ?? (this.isTestnet ? TESTNET_API_URL : MAINNET_API_URL);
    this.rpcUrl = options?.rpcUrl ?? (this.isTestnet ? TESTNET_RPC_URL : MAINNET_RPC_URL);
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
  async request<T>(endpoint: "info" | "exchange" | "explorer", payload: unknown, signal?: AbortSignal): Promise<T> {
    try {
      // Construct a Request
      const url = new URL(endpoint, endpoint === "explorer" ? this.rpcUrl : this.apiUrl);
      const init = this._mergeRequestInit(
        {
          body: JSON.stringify(payload),
          headers: {
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Content-Type": "application/json",
          },
          keepalive: true,
          method: "POST",
          signal: this.timeout ? AbortSignal_.timeout(this.timeout) : undefined,
        },
        this.fetchOptions,
        { signal },
      );

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
    } catch (error) {
      if (error instanceof TransportError) throw error; // Re-throw known errors
      throw new HttpRequestError(undefined, { cause: error });
    }
  }

  /** Sends a fetch request with optional token-bucket throttling and 429 retry handling. */
  protected async _fetchWithRateLimit(
    url: URL,
    init: RequestInit,
    signal?: AbortSignal | null,
  ): Promise<Response> {
    const rateLimit = this._rateLimit;
    if (!rateLimit) return await fetch(url, init);

    let attempt = 0;
    while (true) {
      await rateLimit.limiter.waitForToken(rateLimit.requestWeight, signal ?? undefined);
      const response = await fetch(url, init);
      if (response.status !== 429 || attempt >= rateLimit.maxRetries) return response;

      await response.text().catch(() => undefined); // release connection before retrying
      const delay = getRetryDelay(response, attempt, rateLimit);
      await rateLimit.sleep(delay, signal ?? undefined);
      attempt++;
    }
  }

  /** Merges multiple `HeadersInit` into one {@link https://developer.mozilla.org/en-US/docs/Web/API/Headers/Headers | Headers}. */
  protected _mergeHeadersInit(...inits: HeadersInit[]): Headers {
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
  protected _mergeRequestInit(...inits: RequestInit[]): RequestInit {
    const merged: RequestInit = {};
    const headersList: HeadersInit[] = [];
    const signals: AbortSignal[] = [];

    for (const init of inits) {
      Object.assign(merged, init);
      if (init.headers) headersList.push(init.headers);
      if (init.signal) signals.push(init.signal);
    }
    if (headersList.length > 0) merged.headers = this._mergeHeadersInit(...headersList);
    if (signals.length > 0) merged.signal = signals.length > 1 ? AbortSignal_.any(signals) : signals[0];

    return merged;
  }
}

interface NormalizedRateLimitOptions {
  limiter: TokenBucketRateLimiter;
  requestWeight: number;
  maxRetries: number;
  initialBackoffMs: number;
  maxBackoffMs: number;
  sleep: SleepFn;
}

function normalizeRateLimitOptions(
  value: boolean | RateLimitOptions | undefined,
): NormalizedRateLimitOptions | undefined {
  if (!value) return undefined;

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

function getRetryDelay(response: Response, attempt: number, options: NormalizedRateLimitOptions): number {
  const retryAfter = response.headers.get("Retry-After");
  const retryAfterMs = retryAfter ? parseRetryAfter(retryAfter) : undefined;
  if (retryAfterMs !== undefined) return retryAfterMs;

  return Math.min(options.initialBackoffMs * 2 ** attempt, options.maxBackoffMs);
}

function parseRetryAfter(value: string): number | undefined {
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);

  const dateMs = Date.parse(value);
  if (Number.isFinite(dateMs)) return Math.max(0, dateMs - Date.now());

  return undefined;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);

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
