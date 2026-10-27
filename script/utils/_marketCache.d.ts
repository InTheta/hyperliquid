import { type AllMidsResponse, type FundingHistoryParameters, type FundingHistoryResponse, type MetaAndAssetCtxsResponse, type OutcomeMetaResponse, type PredictedFundingsResponse, type SpotMetaAndAssetCtxsResponse } from "../api/info/mod.js";
import type { ClearinghouseStateResponse } from "../api/info/_methods/clearinghouseState.js";
import { type AllDexsAssetCtxsEvent, type AllDexsClearinghouseStateEvent, type AllMidsEvent } from "../api/subscription/mod.js";
import type { IRequestTransport, ISubscription, ISubscriptionTransport } from "../transport/mod.js";
/** Cache groups managed by {@link HyperliquidMarketCache}. */
export type HyperliquidMarketCacheKey = "metadata" | "contexts" | "allMids" | "allDexsAssetCtxs" | "allDexsClearinghouseState" | "outcomeMeta" | "predictedFundings" | "fundingHistory";
/** Storage interface compatible with `localStorage`. */
export interface HyperliquidMarketCacheStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}
/** Per-cache policy. */
export interface HyperliquidMarketCachePolicy {
    /** Enables refreshes for this cache group when `refresh()` is called without explicit keys. */
    enabled?: boolean;
    /** Time-to-live for accessors that can lazily refresh. */
    ttlMs?: number;
    /** Persist this group when a storage backend is configured. */
    persist?: boolean;
    /** Interval used by `startAutoRefresh()`. */
    refreshIntervalMs?: number;
}
export type HyperliquidMarketCachePolicyInput = boolean | HyperliquidMarketCachePolicy;
/** Options for creating a {@link HyperliquidMarketCache}. */
export interface HyperliquidMarketCacheOptions {
    /** Transport instance to use for Info API requests. */
    transport: IRequestTransport;
    /** Optional transport instance to use for WebSocket subscriptions. */
    subscriptionTransport?: ISubscriptionTransport;
    /** Builder DEX support: `true` for all DEXs, an array for specific DEXs, or false/undefined to skip. */
    dexs?: boolean | string[];
    /** Cache groups to enable and configure. */
    caches?: Partial<Record<HyperliquidMarketCacheKey, HyperliquidMarketCachePolicyInput>>;
    /** Optional browser persistence. Use `"localStorage"` in browsers or pass a compatible storage object. */
    storage?: false | "localStorage" | HyperliquidMarketCacheStorage;
    /** Storage key used when persistence is configured. */
    storageKey?: string;
}
/** Filters for reading normalized market records from {@link HyperliquidMarketCache}. */
export interface HyperliquidMarketFilter {
    type?: "perp" | "spot";
    dex?: string;
    isBuilderDex?: boolean;
}
/** Normalized market record used by {@link HyperliquidMarketCache}. */
export interface HyperliquidMarketRecord {
    symbol: string;
    type: "perp" | "spot";
    coin: string;
    base: string;
    quote: string;
    dex: string;
    isBuilderDex: boolean;
    qualifiedName: string;
    marketKey: string;
    displayName: string;
    contextKey: string;
    assetId: number;
    localAssetIndex: number;
    spotPairId?: string;
    activeAssetCtxId?: string;
    subscriptionKey: string;
    szDecimals: number;
    sizeDecimals: number;
    sizeStep: number;
    priceDecimals: number;
    maxPriceDecimals: number;
    priceStep: number | null;
    maxLeverage?: number;
    marginTableId?: number;
    collateralToken?: number;
    marginMode?: string;
    onlyIsolated?: boolean;
    supportsCross?: boolean;
    strictIsolated?: boolean;
    context?: Record<string, unknown> | null;
    mid?: string;
    fundingRate?: string;
}
/** HIP-4 outcome/prediction side resolved from `outcomeMeta`. */
export interface HyperliquidOutcomeMarketRecord {
    /** Trade/API coin key used by allMids, such as `#52360`. */
    coin: string;
    /** Official outcome encoding: `10 * outcomeId + sideIndex`. */
    encoding: number;
    /** Outcome spot coin representation, such as `#52360`. */
    spotCoin: string;
    /** Outcome token name representation, such as `+52360`. */
    tokenName: string;
    /** Outcome order/cancel asset ID: `100_000_000 + encoding`. */
    assetId: number;
    /** Outcome identifier from `outcomeMeta`. */
    outcomeId: number;
    /** Side index inside the outcome's `sideSpecs`. */
    sideIndex: number;
    /** Side display name, for example `Yes` or `No`. */
    sideName: string;
    outcomeName: string;
    outcomeDescription: string;
    questionId?: number;
    questionName?: string;
    questionDescription?: string;
    fallbackOutcome?: number;
    isSettled?: boolean;
    /** Parsed `class:*` value from description strings when present, e.g. `priceBinary`. */
    outcomeClass?: string;
    /** Parsed `underlying:*` value from description strings when present. */
    underlying?: string;
    /** Parsed `expiry:*` value from description strings when present. */
    expiry?: string;
    /** Parsed `targetPrice:*` value from description strings when present. */
    targetPrice?: string;
    /** Parsed `period:*` value from description strings when present. */
    period?: string;
    mid?: string;
}
/** Routing metadata for a HIP-4 outcome order. */
export interface HyperliquidOutcomeOrderInfo {
    coin: string;
    encoding: number;
    spotCoin: string;
    tokenName: string;
    assetId: number;
    outcomeId: number;
    sideIndex: number;
    sideName: string;
    outcomeName: string;
    questionId?: number;
    questionName?: string;
    mid?: string;
}
/** Order-ticket precision resolved for a market. */
export interface HyperliquidOrderPrecision {
    szDecimals: number;
    sizeDecimals: number;
    sizeStep: number;
    priceDecimals: number;
    maxPriceDecimals: number;
    priceStep: number | null;
    effectivePriceStep: number | null;
    marketType: "perp" | "spot";
    assetId: number;
    subscriptionKey: string;
    spotPairId?: string;
}
/** Order-ticket market info with routing, precision, and latest cached market data. */
export interface HyperliquidOrderTicketInfo extends HyperliquidOrderPrecision {
    symbol: string;
    type: "perp" | "spot";
    coin: string;
    base: string;
    quote: string;
    dex: string;
    isBuilderDex: boolean;
    qualifiedName: string;
    marketKey: string;
    displayName: string;
    contextKey: string;
    localAssetIndex: number;
    /** Alias for order-ticket UIs that use `p_dec` naming. */
    pDecimals: number;
    /** Alias for order-ticket UIs that use `s_dec` naming. */
    sDecimals: number;
    /** Fixed display step from current cached precision. For spot this remains null unless a real tick exists. */
    displayPriceStep: number | null;
    /** Submit step after applying Hyperliquid's 5-significant-figure rule to the reference/current price. */
    effectiveSubmitPriceStep: number | null;
    maxLeverage?: number;
    marginTableId?: number;
    collateralToken?: number;
    marginMode?: string;
    onlyIsolated?: boolean;
    supportsCross?: boolean;
    strictIsolated?: boolean;
    mid?: string;
    fundingRate?: string;
    context?: Record<string, unknown> | null;
}
/** User position resolved against cached market metadata when possible. */
export interface HyperliquidUserPositionRecord {
    user: string;
    dex: string;
    market?: HyperliquidMarketRecord;
    assetPosition: ClearinghouseStateResponse["assetPositions"][number];
    position: ClearinghouseStateResponse["assetPositions"][number]["position"];
}
export interface HyperliquidUnmappedAssetCtx {
    dex: string;
    localAssetIndex: number;
    context: Record<string, unknown>;
}
/** Snapshot returned by {@link HyperliquidMarketCache.snapshot}. */
export interface HyperliquidMarketCacheSnapshot {
    loadedAt: number;
    updatedAt: Partial<Record<HyperliquidMarketCacheKey, number>>;
    marketsBySymbol: Record<string, HyperliquidMarketRecord>;
    marketsBySubscriptionKey: Record<string, HyperliquidMarketRecord>;
    marketsByAssetId: Record<string, HyperliquidMarketRecord>;
    marketsBySpotPairId: Record<string, HyperliquidMarketRecord>;
    marketsByBaseQuoteType: Record<string, HyperliquidMarketRecord>;
    aliasToSymbol: Record<string, string>;
    rawMetaAndAssetCtxsByDex: Record<string, MetaAndAssetCtxsResponse>;
    rawSpotMetaAndAssetCtxs: SpotMetaAndAssetCtxsResponse | null;
    rawAllMidsByDex: Record<string, AllMidsResponse>;
    rawAllDexsAssetCtxsByDex: Record<string, Record<string, unknown>[]>;
    unmappedAllDexsAssetCtxs: HyperliquidUnmappedAssetCtx[];
    needsMetadataRefresh: boolean;
    rawAllDexsClearinghouseStateByUser: Record<string, Record<string, ClearinghouseStateResponse>>;
    rawOutcomeMeta: OutcomeMetaResponse | null;
    outcomeMarketsByCoin: Record<string, HyperliquidOutcomeMarketRecord>;
    outcomeAliasToCoin: Record<string, string>;
    outcomeMarketsByOutcome: Record<string, HyperliquidOutcomeMarketRecord[]>;
    outcomeMarketsByQuestion: Record<string, HyperliquidOutcomeMarketRecord[]>;
    rawPredictedFundings: PredictedFundingsResponse | null;
    rawFundingHistoryByKey: Record<string, FundingHistoryResponse>;
}
/**
 * Opt-in market metadata/context cache for Hyperliquid applications.
 *
 * The cache is memory-only by default. Browser persistence is enabled only when
 * a storage backend is provided.
 */
export declare class HyperliquidMarketCache {
    readonly transport: IRequestTransport;
    readonly subscriptionTransport?: ISubscriptionTransport;
    readonly dexs: boolean | string[];
    readonly storageKey: string;
    private _policies;
    private _storage;
    private _snapshot;
    private _refreshTimers;
    private _allMidsSubscriptions;
    private _allDexsAssetCtxsSubscription;
    private _allDexsClearinghouseStateSubscriptions;
    private _liveMetadataRefreshRequestedAt;
    private _liveMetadataRefreshPromise;
    constructor(options: HyperliquidMarketCacheOptions);
    /** Create a cache and optionally hydrate persisted data. */
    static create(options: HyperliquidMarketCacheOptions & {
        hydrate?: boolean;
    }): Promise<HyperliquidMarketCache>;
    /** Load persisted cache state from the configured storage backend. */
    hydrate(): void;
    /** Return a serializable snapshot of current cache state. */
    snapshot(): HyperliquidMarketCacheSnapshot;
    /** Clear selected cache groups, or all groups when omitted. */
    clear(keys?: HyperliquidMarketCacheKey | HyperliquidMarketCacheKey[]): void;
    /** Refresh enabled cache groups, or the explicit cache groups provided. */
    refresh(keys?: HyperliquidMarketCacheKey | HyperliquidMarketCacheKey[]): Promise<void>;
    /** Start interval refreshes for enabled cache groups, or explicit groups. */
    startAutoRefresh(keys?: HyperliquidMarketCacheKey | HyperliquidMarketCacheKey[]): void;
    /** Stop interval refreshes for selected groups, or all groups when omitted. */
    stopAutoRefresh(keys?: HyperliquidMarketCacheKey | HyperliquidMarketCacheKey[]): void;
    /** Subscribe to live mids for a single DEX. Omit `dex` for default perp DEX plus spot mids. */
    startAllMids(dex?: string): Promise<ISubscription>;
    /** Subscribe to live mids for the default DEX and every configured builder DEX. */
    startConfiguredAllMids(): Promise<ISubscription[]>;
    /** Stop one live mids subscription, or all live mids subscriptions when omitted. */
    stopAllMids(dex?: string): Promise<void>;
    /** Apply a live allMids event to cached markets. */
    applyAllMids(event: AllMidsEvent | AllMidsResponse | unknown, dex?: string): void;
    /** Subscribe to live asset contexts for all perpetual DEXs. */
    startAllDexsAssetCtxs(): Promise<ISubscription>;
    /** Stop the live all-DEX asset context subscription if it is active. */
    stopAllDexsAssetCtxs(): Promise<void>;
    /** Subscribe to all-DEX clearinghouse state for a user. */
    startAllDexsClearinghouseState(user: `0x${string}`): Promise<ISubscription>;
    /** Stop one user's clearinghouse subscription, or all user subscriptions when omitted. */
    stopAllDexsClearinghouseState(user?: string): Promise<void>;
    /** Apply a live all-DEX asset context event to known perp records. */
    applyAllDexsAssetCtxs(event: AllDexsAssetCtxsEvent | unknown): void;
    /** Apply a live all-DEX clearinghouse state event to the user cache. */
    applyAllDexsClearinghouseState(event: AllDexsClearinghouseStateEvent | unknown): void;
    resolveMarket(symbolOrId: string | number): HyperliquidMarketRecord | undefined;
    getMarkets(filter?: HyperliquidMarketFilter): HyperliquidMarketRecord[];
    getPerpMarkets(dex?: string): HyperliquidMarketRecord[];
    getSpotMarkets(): HyperliquidMarketRecord[];
    getBuilderDexMarkets(dex?: string): HyperliquidMarketRecord[];
    getDexNames(): string[];
    getAssetId(symbolOrId: string | number): number | undefined;
    getBase(symbolOrId: string | number): string | undefined;
    getQuote(symbolOrId: string | number): string | undefined;
    getCoin(symbolOrId: string | number): string | undefined;
    getDex(symbolOrId: string | number): string | undefined;
    getQualifiedName(symbolOrId: string | number): string | undefined;
    getMarketKey(symbolOrId: string | number): string | undefined;
    getMarketType(symbolOrId: string | number): "perp" | "spot" | undefined;
    getMaxLeverage(symbolOrId: string | number): number | undefined;
    getMarginTableId(symbolOrId: string | number): number | undefined;
    getLocalAssetIndex(symbolOrId: string | number): number | undefined;
    getContextKey(symbolOrId: string | number): string | undefined;
    getSzDecimals(symbolOrId: string | number): number | undefined;
    getPriceDecimals(symbolOrId: string | number, referencePrice?: string | number): number | undefined;
    getSizeDecimals(symbolOrId: string | number): number | undefined;
    getSizeStep(symbolOrId: string | number): number | undefined;
    getMid(symbolOrId: string | number): string | undefined;
    getFundingRate(symbolOrId: string | number): string | undefined;
    getPerpContext(symbolOrId: string | number): Record<string, unknown> | null | undefined;
    getSpotContext(symbolOrId: string | number): Record<string, unknown> | null | undefined;
    getMetaAndAssetCtxs(dex?: string): MetaAndAssetCtxsResponse | undefined;
    getSpotMetaAndAssetCtxs(): SpotMetaAndAssetCtxsResponse | null;
    getAllMids(dex?: string): AllMidsResponse | undefined;
    getAllDexsAssetCtxs(): Record<string, Record<string, unknown>[]>;
    getAllDexsAssetCtxs(dex: string): Record<string, unknown>[];
    getAllDexsClearinghouseState(user: string): Record<string, ClearinghouseStateResponse> | undefined;
    getAllDexsClearinghouseState(user: string, dex: string): ClearinghouseStateResponse | undefined;
    getUserPosition(user: string, symbolOrId: string | number): HyperliquidUserPositionRecord | undefined;
    getUserPositions(user: string, dex?: string): HyperliquidUserPositionRecord[];
    getPredictedFundings(): PredictedFundingsResponse | null;
    getOutcomeMeta(): OutcomeMetaResponse | null;
    resolveOutcomeMarket(coinOrId: string | number): HyperliquidOutcomeMarketRecord | undefined;
    getOutcomeMarkets(params?: {
        outcomeId?: number;
        questionId?: number;
    }): HyperliquidOutcomeMarketRecord[];
    getOutcomeMid(coinOrId: string | number): string | undefined;
    getOutcomeAssetId(coinOrId: string | number): number | undefined;
    getOutcomeTokenName(coinOrId: string | number): string | undefined;
    getOutcomeEncoding(coinOrId: string | number): number | undefined;
    getOutcomeOrderInfo(coinOrId: string | number): HyperliquidOutcomeOrderInfo | undefined;
    /** Alias for apps that label HIP-4 outcome markets as prediction markets. */
    resolvePredictionMarket(coinOrId: string | number): HyperliquidOutcomeMarketRecord | undefined;
    getFundingHistory(params: FundingHistoryParameters, signal?: AbortSignal): Promise<FundingHistoryResponse>;
    getOrderPrecision(symbolOrId: string | number, referencePrice?: string | number): HyperliquidOrderPrecision | undefined;
    getOrderTicketInfo(symbolOrId: string | number, referencePrice?: string | number): HyperliquidOrderTicketInfo | undefined;
    formatOrderPrice(symbolOrId: string | number, price: string | number): string | undefined;
    formatOrderSize(symbolOrId: string | number, size: string | number): string | undefined;
    private _resolvePerpByDexAndLocalIndex;
    private _resolvePositionMarket;
    private _applyPerpContext;
    private _applyStoredAllDexsAssetCtxs;
    private _refreshMetadataForUnmappedLiveData;
    private _refreshMetadataAndContexts;
    private _refreshAllMids;
    private _refreshPredictedFundings;
    private _refreshOutcomeMeta;
    private _loadDexEntries;
    private _rebuildMarkets;
    private _resolveSpotContext;
    private _indexRecord;
    private _applyMids;
    private _applyMidsForDex;
    private _rebuildOutcomeMarkets;
    private _isStale;
    private _stopTimer;
    private _persist;
    private _marketsForPersistence;
    private _outcomesForPersistence;
}
//# sourceMappingURL=_marketCache.d.ts.map