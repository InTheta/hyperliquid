import {
  meta,
  type MetaResponse,
  perpDexs,
  type PerpDexsResponse,
  spotMeta,
  type SpotMetaResponse,
} from "../api/info/mod.js";
import type { IRequestTransport } from "../transport/mod.js";

function normalizeSpotPairId(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (/^\d+$/.test(text)) return `@${text}`;
  return text;
}

function uniqueNames(values: unknown[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
  }
  return out;
}

/** Options for creating a {@link SymbolConverter} instance. */
export interface SymbolConverterOptions {
  /** Transport instance to use for API requests. */
  transport: IRequestTransport;
  /** Optional dex support: array of dex names, true for all dexs, or false/undefined to skip. */
  dexs?: string[] | boolean;
  /**
   * Automatically refresh asset mappings on an interval.
   *
   * Default: `false`
   */
  autoRefresh?: boolean;
  /**
   * Interval for automatic asset mapping refreshes in ms.
   *
   * Default: `60_000`
   */
  refreshIntervalMs?: number;
}

/**
 * Utility class for converting asset symbols to their corresponding IDs and size decimals.
 * Supports perpetuals, spot markets, and optional builder dexs.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@nktkas/hyperliquid";
 * import { SymbolConverter } from "@nktkas/hyperliquid/utils";
 *
 * const transport = new HttpTransport(); // or `WebSocketTransport`
 * const converter = await SymbolConverter.create({ transport });
 *
 * // By default, dexs are not loaded; specify them when creating an instance
 * // const converter = await SymbolConverter.create({ transport, dexs: ["test"] });
 *
 * const btcId = converter.getAssetId("BTC"); // perpetual → 0
 * const hypeUsdcId = converter.getAssetId("HYPE/USDC"); // spot market → 10107
 * const dexAbcId = converter.getAssetId("test:ABC"); // builder dex (if enabled) → 110000
 *
 * const btcSzDecimals = converter.getSzDecimals("BTC"); // perpetual → 5
 * const hypeUsdcSzDecimals = converter.getSzDecimals("HYPE/USDC"); // spot market → 2
 * const dexAbcSzDecimals = converter.getSzDecimals("test:ABC"); // builder dex (if enabled) → 0
 *
 * const spotPairId = converter.getSpotPairId("HFUN/USDC"); // → "@2"
 *
 * const symbol = converter.getSymbolBySpotPairId("@107"); // → "HYPE/USDC"
 * ```
 *
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/asset-ids
 */
export class SymbolConverter {
  private _transport: IRequestTransport;
  private _dexOption: string[] | boolean;
  private _nameToAssetId = new Map<string, number>();
  private _nameToSzDecimals = new Map<string, number>();
  private _nameToSpotPairId = new Map<string, string>();
  private _spotPairIdToName = new Map<string, string>();
  private _refreshIntervalMs: number;
  private _refreshTimer: ReturnType<typeof setInterval> | undefined;
  private _autoRefresh: boolean;

  /**
   * Creates a new SymbolConverter instance, but does not initialize it.
   * Run {@link reload} to load asset data or use {@link create} to create and initialize in one step.
   *
   * @param options Configuration options including transport and optional dex support.
   */
  constructor(options: SymbolConverterOptions) {
    this._transport = options.transport;
    this._dexOption = options.dexs ?? false;
    this._refreshIntervalMs = options.refreshIntervalMs ?? 60_000;
    this._autoRefresh = options.autoRefresh ?? false;
  }

  /**
   * Create and initialize a SymbolConverter instance.
   *
   * @param options Configuration options including transport and optional dex support.
   * @return Initialized SymbolConverter instance.
   *
   * @example
   * ```ts
   * import { HttpTransport } from "@nktkas/hyperliquid";
   * import { SymbolConverter } from "@nktkas/hyperliquid/utils";
   *
   * const transport = new HttpTransport(); // or `WebSocketTransport`
   * const converter = await SymbolConverter.create({ transport });
   * ```
   */
  static async create(options: SymbolConverterOptions): Promise<SymbolConverter> {
    const instance = new SymbolConverter(options);
    await instance.reload();
    return instance;
  }

  /**
   * Reload asset mappings from the API.
   *
   * Useful for refreshing data when new assets are added.
   */
  async reload(): Promise<void> {
    const config = { transport: this._transport };
    const needDexs = this._dexOption === true || (Array.isArray(this._dexOption) && this._dexOption.length > 0);

    const [perpMetaData, spotMetaData, perpDexsData] = await Promise.all([
      meta(config),
      spotMeta(config),
      needDexs ? perpDexs(config) : undefined,
    ]);

    if (!perpMetaData?.universe?.length) {
      throw new Error("Invalid perpetual metadata response");
    }

    if (!spotMetaData?.universe?.length || !spotMetaData?.tokens?.length) {
      throw new Error("Invalid spot metadata response");
    }

    this._nameToAssetId.clear();
    this._nameToSzDecimals.clear();
    this._nameToSpotPairId.clear();
    this._spotPairIdToName.clear();

    this._processDefaultPerps(perpMetaData);
    this._processSpotAssets(spotMetaData);

    // Only process builder dexs if dex support is enabled
    if (perpDexsData) {
      await this._processBuilderDexs(perpDexsData);
    }

    if (this._autoRefresh && !this.isAutoRefreshEnabled()) this.startAutoRefresh();
  }

  /** Alias for {@link reload}. */
  refreshNow(): Promise<void> {
    return this.reload();
  }

  /**
   * Starts automatic refresh of asset mappings.
   *
   * @param intervalMs Optional interval override in milliseconds.
   */
  startAutoRefresh(intervalMs?: number): void {
    if (intervalMs !== undefined) this._setRefreshInterval(intervalMs);
    this._autoRefresh = true;
    this._clearRefreshTimer();
    this._refreshTimer = setInterval(() => {
      void this.reload().catch(() => undefined);
    }, this._refreshIntervalMs);
  }

  /** Stops automatic refresh of asset mappings. */
  stopAutoRefresh(): void {
    this._autoRefresh = false;
    this._clearRefreshTimer();
  }

  /** Returns whether automatic refresh is currently active. */
  isAutoRefreshEnabled(): boolean {
    return this._refreshTimer !== undefined;
  }

  /**
   * Sets the automatic refresh interval.
   *
   * Restarts automatic refresh if it is currently active.
   *
   * @param intervalMs Interval in milliseconds.
   */
  setAutoRefreshInterval(intervalMs: number): void {
    this._setRefreshInterval(intervalMs);
    if (this.isAutoRefreshEnabled()) this.startAutoRefresh();
  }

  private _setRefreshInterval(intervalMs: number): void {
    if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
      throw new RangeError("Interval must be greater than 0");
    }
    this._refreshIntervalMs = intervalMs;
  }

  private _clearRefreshTimer(): void {
    clearInterval(this._refreshTimer);
    this._refreshTimer = undefined;
  }

  private _processDefaultPerps(perpMetaData: MetaResponse): void {
    perpMetaData.universe.forEach((asset, index) => {
      this._setNameAliases(
        [
          asset.name,
          `${asset.name}-PERP`,
          `main:${asset.name}`,
          `main:${asset.name}-PERP`,
        ],
        index,
        asset.szDecimals,
        false,
      );
    });
  }

  private async _processBuilderDexs(perpDexsData: PerpDexsResponse): Promise<void> {
    if (!perpDexsData || perpDexsData.length <= 1) return;

    const builderDexs = perpDexsData
      .map((dex, index) => ({ dex, index }))
      .filter((item): item is { dex: NonNullable<PerpDexsResponse[number]>; index: number } => {
        return item.index > 0 && item.dex !== null && item.dex.name.length > 0;
      });

    if (builderDexs.length === 0) return;

    // Filter dexs based on the dexOption
    const dexsToProcess = Array.isArray(this._dexOption)
      ? builderDexs.filter((item) => (this._dexOption as string[]).includes(item.dex.name))
      : builderDexs; // true means process all

    if (dexsToProcess.length === 0) return;

    const config = { transport: this._transport };
    const results = await Promise.allSettled(
      dexsToProcess.map((item) => meta(config, { dex: item.dex.name })),
    );

    results.forEach((result, idx) => {
      if (result.status !== "fulfilled") return;
      this._processBuilderDexResult(result.value, dexsToProcess[idx].index, dexsToProcess[idx].dex.name);
    });
  }

  private _processBuilderDexResult(dexMeta: MetaResponse, perpDexIndex: number, dexName: string): void {
    const offset = 100000 + perpDexIndex * 10000;
    const normalizedDexName = String(dexName || "").trim();

    dexMeta.universe.forEach((asset, index) => {
      const assetId = offset + index;
      const name = asset.name;
      const coin = normalizedDexName && name.startsWith(`${normalizedDexName}:`)
        ? name.slice(normalizedDexName.length + 1)
        : name;
      const qualifiedName = normalizedDexName ? `${normalizedDexName}:${coin}` : coin;
      this._setNameAliases(
        [
          qualifiedName,
          `${qualifiedName}-PERP`,
          name,
          `${name}-PERP`,
          coin,
          `${coin}-PERP`,
        ],
        assetId,
        asset.szDecimals,
        true,
      );
    });
  }

  private _processSpotAssets(spotMetaData: SpotMetaResponse): void {
    const tokenMap = new Map<number, { name: string; szDecimals: number }>();
    spotMetaData.tokens.forEach((token) => {
      tokenMap.set(token.index, { name: token.name, szDecimals: token.szDecimals });
    });

    spotMetaData.universe.forEach((market) => {
      if (market.tokens.length < 2) return;
      const baseToken = tokenMap.get(market.tokens[0]);
      const quoteToken = tokenMap.get(market.tokens[1]);
      if (!baseToken || !quoteToken) return;

      const assetId = 10000 + market.index;
      const baseQuoteKey = `${baseToken.name}/${quoteToken.name}`;
      const spotPairId = normalizeSpotPairId(market.name || market.index);
      const canonicalPairId = `@${market.index}`;
      const isUsdcPair = quoteToken.name === "USDC";
      this._setNameAliases(
        [
          baseQuoteKey,
          isUsdcPair ? `${baseToken.name}-SPOT` : undefined,
          spotPairId,
          canonicalPairId,
          String(market.index),
          assetId,
        ],
        assetId,
        baseToken.szDecimals,
        true,
      );
      for (
        const name of uniqueNames([
          baseQuoteKey,
          isUsdcPair ? `${baseToken.name}-SPOT` : undefined,
          spotPairId,
          canonicalPairId,
          market.index,
        ])
      ) {
        this._nameToSpotPairId.set(name, spotPairId);
      }
      this._spotPairIdToName.set(spotPairId, baseQuoteKey);
      this._spotPairIdToName.set(canonicalPairId, baseQuoteKey);
      this._spotPairIdToName.set(String(market.index), baseQuoteKey);
    });
  }

  private _setNameAliases(
    names: unknown[],
    assetId: number,
    szDecimals: number,
    preserveExisting: boolean,
  ): void {
    for (const name of uniqueNames(names)) {
      if (preserveExisting && this._nameToAssetId.has(name)) continue;
      this._nameToAssetId.set(name, assetId);
      this._nameToSzDecimals.set(name, szDecimals);
    }
  }

  /**
   * Get asset ID for a coin.
   * - For Perpetuals, use the coin name (e.g., "BTC").
   * - For Spot markets, use the "BASE/QUOTE" format (e.g., "HYPE/USDC").
   * - For Builder Dex assets, use the "DEX_NAME:ASSET_NAME" format (e.g., "test:ABC").
   *
   * @example
   * ```ts
   * import { HttpTransport } from "@nktkas/hyperliquid";
   * import { SymbolConverter } from "@nktkas/hyperliquid/utils";
   *
   * const transport = new HttpTransport(); // or `WebSocketTransport`
   * const converter = await SymbolConverter.create({ transport });
   *
   * converter.getAssetId("BTC"); // → 0
   * converter.getAssetId("HYPE/USDC"); // → 10107
   * converter.getAssetId("test:ABC"); // → 110000
   * ```
   */
  getAssetId(name: string): number | undefined {
    return this._nameToAssetId.get(name);
  }

  /**
   * Get size decimals for a coin.
   * - For Perpetuals, use the coin name (e.g., "BTC").
   * - For Spot markets, use the "BASE/QUOTE" format (e.g., "HYPE/USDC").
   * - For Builder Dex assets, use the "DEX_NAME:ASSET_NAME" format (e.g., "test:ABC").
   *
   * @example
   * ```ts
   * import { HttpTransport } from "@nktkas/hyperliquid";
   * import { SymbolConverter } from "@nktkas/hyperliquid/utils";
   *
   * const transport = new HttpTransport(); // or `WebSocketTransport`
   * const converter = await SymbolConverter.create({ transport });
   *
   * converter.getSzDecimals("BTC"); // → 5
   * converter.getSzDecimals("HYPE/USDC"); // → 2
   * converter.getSzDecimals("test:ABC"); // → 0
   * ```
   */
  getSzDecimals(name: string): number | undefined {
    return this._nameToSzDecimals.get(name);
  }

  /**
   * Get spot pair ID for info endpoints and subscriptions (e.g., l2book, trades).
   *
   * Accepts spot markets in the "BASE/QUOTE" format (e.g., "HFUN/USDC").
   *
   * @example
   * ```ts
   * import { HttpTransport } from "@nktkas/hyperliquid";
   * import { SymbolConverter } from "@nktkas/hyperliquid/utils";
   *
   * const transport = new HttpTransport(); // or `WebSocketTransport`
   * const converter = await SymbolConverter.create({ transport });
   *
   * converter.getSpotPairId("HFUN/USDC"); // → "@2"
   * converter.getSpotPairId("PURR/USDC"); // → "PURR/USDC" (exceptions exist for some pairs)
   * ```
   */
  getSpotPairId(name: string): string | undefined {
    return this._nameToSpotPairId.get(name);
  }

  /**
   * Get the symbol ("BASE/QUOTE") from a spot pair ID.
   *
   * Accepts pair IDs such as "@107" or "PURR/USDC".
   *
   * @example
   * ```ts
   * import { HttpTransport } from "@nktkas/hyperliquid";
   * import { SymbolConverter } from "@nktkas/hyperliquid/utils";
   *
   * const transport = new HttpTransport(); // or `WebSocketTransport`
   * const converter = await SymbolConverter.create({ transport });
   *
   * converter.getSymbolBySpotPairId("@107"); // → "HYPE/USDC"
   * converter.getSymbolBySpotPairId("PURR/USDC"); // → "PURR/USDC"
   * ```
   */
  getSymbolBySpotPairId(pairId: string): string | undefined {
    return this._spotPairIdToName.get(normalizeSpotPairId(pairId));
  }
}
