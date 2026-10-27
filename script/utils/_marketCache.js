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
exports.HyperliquidMarketCache = void 0;
const dntShim = __importStar(require("../_dnt.shims.js"));
const mod_js_1 = require("../api/info/mod.js");
const mod_js_2 = require("../api/subscription/mod.js");
const _format_js_1 = require("./_format.js");
const CACHE_VERSION = 1;
const DEFAULT_STORAGE_KEY = "@nktkas/hyperliquid:market-cache:v1";
const MAIN_DEX = "main";
const DEFAULT_POLICIES = {
    metadata: { enabled: false, persist: true, ttlMs: 5 * 60_000, refreshIntervalMs: 5 * 60_000 },
    contexts: { enabled: false, persist: false, ttlMs: 5_000, refreshIntervalMs: 5_000 },
    allMids: { enabled: false, persist: false, ttlMs: 1_000, refreshIntervalMs: 1_000 },
    allDexsAssetCtxs: { enabled: false, persist: false, ttlMs: 1_000, refreshIntervalMs: undefined },
    allDexsClearinghouseState: { enabled: false, persist: false, ttlMs: 1_000, refreshIntervalMs: undefined },
    outcomeMeta: { enabled: false, persist: true, ttlMs: 5 * 60_000, refreshIntervalMs: 5 * 60_000 },
    predictedFundings: { enabled: false, persist: false, ttlMs: 60_000, refreshIntervalMs: 60_000 },
    fundingHistory: { enabled: false, persist: false, ttlMs: 5 * 60_000, refreshIntervalMs: 5 * 60_000 },
};
function emptySnapshot() {
    return {
        loadedAt: 0,
        updatedAt: {},
        marketsBySymbol: {},
        marketsBySubscriptionKey: {},
        marketsByAssetId: {},
        marketsBySpotPairId: {},
        marketsByBaseQuoteType: {},
        aliasToSymbol: {},
        rawMetaAndAssetCtxsByDex: {},
        rawSpotMetaAndAssetCtxs: null,
        rawAllMidsByDex: {},
        rawAllDexsAssetCtxsByDex: {},
        unmappedAllDexsAssetCtxs: [],
        needsMetadataRefresh: false,
        rawAllDexsClearinghouseStateByUser: {},
        rawOutcomeMeta: null,
        outcomeMarketsByCoin: {},
        outcomeAliasToCoin: {},
        outcomeMarketsByOutcome: {},
        outcomeMarketsByQuestion: {},
        rawPredictedFundings: null,
        rawFundingHistoryByKey: {},
    };
}
function upper(value) {
    return String(value ?? "")
        .trim()
        .toUpperCase();
}
function normalizeDexName(value) {
    const dex = String(value ?? "")
        .trim();
    return !dex || dex === MAIN_DEX ? MAIN_DEX : dex;
}
function dexRequestName(dex) {
    return dex === MAIN_DEX ? undefined : dex;
}
function compact(value) {
    return upper(value)
        .replace(/[:\-_]/g, "")
        .replace(/\s+/g, "");
}
function clampDecimals(value, fallback = 0) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0)
        return fallback;
    return Math.max(0, Math.min(10, Math.floor(parsed)));
}
function stepFromDecimals(decimalsRaw) {
    const decimals = clampDecimals(decimalsRaw, 0);
    return Number((10 ** -decimals).toFixed(decimals));
}
function countIntegerDigits(valueRaw) {
    const value = Math.abs(Number(valueRaw));
    if (!Number.isFinite(value) || value <= 0 || value < 1)
        return 0;
    return Math.floor(Math.log10(value)) + 1;
}
function getMaxPriceDecimals(type, szDecimals) {
    return Math.max(0, (type === "spot" ? 8 : 6) - clampDecimals(szDecimals, 0));
}
function getPriceDecimalsForValue(type, szDecimals, valueRaw) {
    const maxDecimals = getMaxPriceDecimals(type, szDecimals);
    const value = Number(valueRaw);
    if (!Number.isFinite(value) || value <= 0)
        return maxDecimals;
    return Math.max(0, Math.min(maxDecimals, 5 - countIntegerDigits(value)));
}
function getReferencePrice(record) {
    return record.mid ??
        record.context?.markPx ??
        record.context?.midPx ??
        record.context?.oraclePx ??
        record.context?.prevDayPx;
}
function canonicalSymbol(record) {
    return `hyperliquid:${record.base}:${upper(record.quote)}:${record.type}`;
}
function perpDisplayName(coin) {
    return `${coin}-PERP`;
}
function spotDisplayName(base, quote) {
    return `${base}/${quote}`;
}
function uniqueStrings(values) {
    const out = [];
    const seen = new Set();
    for (const value of values) {
        const text = String(value ?? "").trim();
        if (!text || seen.has(text))
            continue;
        seen.add(text);
        out.push(text);
    }
    return out;
}
function baseQuoteTypeKey(base, quote, type) {
    return `${upper(base)}:${upper(quote)}:${upper(type)}`;
}
function assetIdKey(assetId) {
    return String(assetId);
}
function normalizeSpotPairId(value) {
    const text = String(value ?? "").trim();
    if (!text)
        return "";
    if (/^\d+$/.test(text))
        return `@${text}`;
    return text;
}
function tokenName(token, fallback) {
    if (!token || typeof token !== "object")
        return fallback;
    const row = token;
    return String(row.name ?? row.symbol ?? row.fullName ?? fallback).trim() || fallback;
}
function resolvePerpQuote(meta, spotMeta) {
    const collateralToken = Number(meta?.collateralToken);
    const tokens = Array.isArray(spotMeta?.tokens) ? spotMeta.tokens : [];
    if (Number.isFinite(collateralToken) && collateralToken >= 0) {
        const name = upper(tokenName(tokens[collateralToken], ""));
        if (name && !name.startsWith("@"))
            return name;
    }
    return "USDC";
}
function buildFundingHistoryKey(params) {
    return JSON.stringify({
        coin: params.coin,
        startTime: params.startTime,
        endTime: params.endTime ?? null,
    });
}
function normalizeKeys(keys) {
    return keys ? (Array.isArray(keys) ? keys : [keys]) : [];
}
function normalizePolicy(key, input) {
    const base = DEFAULT_POLICIES[key];
    if (typeof input === "boolean")
        return { ...base, enabled: input };
    return {
        ...base,
        ...(input ?? {}),
        enabled: Boolean(input?.enabled),
        persist: input?.persist ?? base.persist,
    };
}
function resolveStorage(storage) {
    if (!storage)
        return null;
    if (storage === "localStorage") {
        const maybeStorage = dntShim.dntGlobalThis.localStorage;
        return maybeStorage ?? null;
    }
    return storage;
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function userKey(user) {
    return String(user ?? "").trim().toLowerCase();
}
function normalizeDexEntries(value, field) {
    const source = isRecord(value) && field in value ? value[field] : value;
    if (Array.isArray(source)) {
        const out = [];
        for (const row of source) {
            if (Array.isArray(row) && row.length >= 2)
                out.push([normalizeDexName(row[0]), row[1]]);
        }
        return out;
    }
    if (isRecord(source)) {
        return Object.entries(source).map(([dex, rows]) => [normalizeDexName(dex), rows]);
    }
    return [];
}
function normalizePerpCtx(ctx) {
    return isRecord(ctx) ? ctx : null;
}
function marginConstraints(asset) {
    const marginMode = typeof asset.marginMode === "string" && asset.marginMode.length > 0 ? asset.marginMode : undefined;
    const onlyIsolated = asset.onlyIsolated === true ? true : undefined;
    const strictIsolated = marginMode === "strictIsolated" ? true : undefined;
    const supportsCross = onlyIsolated === true || marginMode === "noCross" || marginMode === "strictIsolated"
        ? false
        : undefined;
    return { marginMode, onlyIsolated, supportsCross, strictIsolated };
}
function sortMarkets(records) {
    return [...records].sort((left, right) => {
        if (left.type !== right.type)
            return left.type === "perp" ? -1 : 1;
        if (left.dex !== right.dex) {
            if (left.dex === MAIN_DEX)
                return -1;
            if (right.dex === MAIN_DEX)
                return 1;
            return left.dex.localeCompare(right.dex);
        }
        return left.assetId - right.assetId;
    });
}
function parseOutcomeDescription(description) {
    const out = {};
    for (const part of description.split("|")) {
        const separator = part.indexOf(":");
        if (separator < 0)
            continue;
        const key = part.slice(0, separator).trim();
        const value = part.slice(separator + 1).trim();
        if (!value)
            continue;
        if (key === "class")
            out.outcomeClass = value;
        if (key === "underlying")
            out.underlying = value;
        if (key === "expiry")
            out.expiry = value;
        if (key === "targetPrice")
            out.targetPrice = value;
        if (key === "period")
            out.period = value;
    }
    return out;
}
/**
 * Opt-in market metadata/context cache for Hyperliquid applications.
 *
 * The cache is memory-only by default. Browser persistence is enabled only when
 * a storage backend is provided.
 */
class HyperliquidMarketCache {
    transport;
    subscriptionTransport;
    dexs;
    storageKey;
    _policies;
    _storage;
    _snapshot = emptySnapshot();
    _refreshTimers = new Map();
    _allMidsSubscriptions = new Map();
    _allDexsAssetCtxsSubscription = null;
    _allDexsClearinghouseStateSubscriptions = new Map();
    _liveMetadataRefreshRequestedAt = 0;
    _liveMetadataRefreshPromise = null;
    constructor(options) {
        this.transport = options.transport;
        this.subscriptionTransport = options.subscriptionTransport;
        this.dexs = options.dexs ?? false;
        this.storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
        this._storage = resolveStorage(options.storage);
        this._policies = {
            metadata: normalizePolicy("metadata", options.caches?.metadata),
            contexts: normalizePolicy("contexts", options.caches?.contexts),
            allMids: normalizePolicy("allMids", options.caches?.allMids),
            allDexsAssetCtxs: normalizePolicy("allDexsAssetCtxs", options.caches?.allDexsAssetCtxs),
            allDexsClearinghouseState: normalizePolicy("allDexsClearinghouseState", options.caches?.allDexsClearinghouseState),
            outcomeMeta: normalizePolicy("outcomeMeta", options.caches?.outcomeMeta),
            predictedFundings: normalizePolicy("predictedFundings", options.caches?.predictedFundings),
            fundingHistory: normalizePolicy("fundingHistory", options.caches?.fundingHistory),
        };
    }
    /** Create a cache and optionally hydrate persisted data. */
    static async create(options) {
        const cache = new HyperliquidMarketCache(options);
        if (options.hydrate)
            await cache.hydrate();
        return cache;
    }
    /** Load persisted cache state from the configured storage backend. */
    hydrate() {
        if (!this._storage)
            return;
        const text = this._storage.getItem(this.storageKey);
        if (!text)
            return;
        try {
            const parsed = JSON.parse(text);
            if (!isRecord(parsed) || parsed.version !== CACHE_VERSION || !isRecord(parsed.snapshot))
                return;
            this._snapshot = {
                ...emptySnapshot(),
                ...parsed.snapshot,
            };
            if (this._snapshot.rawOutcomeMeta &&
                (Object.keys(this._snapshot.outcomeAliasToCoin ?? {}).length === 0 ||
                    Object.keys(this._snapshot.outcomeMarketsByCoin ?? {}).length === 0)) {
                this._rebuildOutcomeMarkets();
            }
        }
        catch {
            return;
        }
    }
    /** Return a serializable snapshot of current cache state. */
    snapshot() {
        return JSON.parse(JSON.stringify(this._snapshot));
    }
    /** Clear selected cache groups, or all groups when omitted. */
    clear(keys) {
        const selected = normalizeKeys(keys);
        if (selected.length === 0) {
            this._snapshot = emptySnapshot();
            this._storage?.removeItem(this.storageKey);
            return;
        }
        for (const key of selected) {
            delete this._snapshot.updatedAt[key];
            if (key === "metadata" || key === "contexts") {
                this._snapshot.marketsBySymbol = {};
                this._snapshot.marketsBySubscriptionKey = {};
                this._snapshot.marketsByAssetId = {};
                this._snapshot.marketsBySpotPairId = {};
                this._snapshot.marketsByBaseQuoteType = {};
                this._snapshot.aliasToSymbol = {};
                this._snapshot.rawMetaAndAssetCtxsByDex = {};
                this._snapshot.rawSpotMetaAndAssetCtxs = null;
            }
            if (key === "allMids")
                this._snapshot.rawAllMidsByDex = {};
            if (key === "allDexsAssetCtxs") {
                this._snapshot.rawAllDexsAssetCtxsByDex = {};
                this._snapshot.unmappedAllDexsAssetCtxs = [];
                this._snapshot.needsMetadataRefresh = false;
            }
            if (key === "allDexsClearinghouseState")
                this._snapshot.rawAllDexsClearinghouseStateByUser = {};
            if (key === "outcomeMeta") {
                this._snapshot.rawOutcomeMeta = null;
                this._snapshot.outcomeMarketsByCoin = {};
                this._snapshot.outcomeAliasToCoin = {};
                this._snapshot.outcomeMarketsByOutcome = {};
                this._snapshot.outcomeMarketsByQuestion = {};
            }
            if (key === "predictedFundings")
                this._snapshot.rawPredictedFundings = null;
            if (key === "fundingHistory")
                this._snapshot.rawFundingHistoryByKey = {};
        }
        this._persist();
    }
    /** Refresh enabled cache groups, or the explicit cache groups provided. */
    async refresh(keys) {
        const explicitKeys = normalizeKeys(keys);
        const selected = explicitKeys.length > 0
            ? explicitKeys
            : Object.keys(this._policies).filter((key) => this._policies[key].enabled);
        const unique = new Set(selected);
        if (unique.has("metadata") || unique.has("contexts")) {
            await this._refreshMetadataAndContexts(unique.has("metadata"), unique.has("contexts"));
        }
        if (unique.has("allMids"))
            await this._refreshAllMids();
        if (unique.has("outcomeMeta"))
            await this._refreshOutcomeMeta();
        if (unique.has("predictedFundings"))
            await this._refreshPredictedFundings();
        this._persist();
    }
    /** Start interval refreshes for enabled cache groups, or explicit groups. */
    startAutoRefresh(keys) {
        const selected = normalizeKeys(keys);
        const groups = selected.length > 0
            ? selected
            : Object.keys(this._policies).filter((key) => this._policies[key].enabled);
        for (const key of groups) {
            this._stopTimer(key);
            const intervalMs = this._policies[key].refreshIntervalMs;
            if (!intervalMs || intervalMs <= 0)
                continue;
            this._refreshTimers.set(key, setInterval(() => {
                void this.refresh(key).catch(() => undefined);
            }, intervalMs));
        }
    }
    /** Stop interval refreshes for selected groups, or all groups when omitted. */
    stopAutoRefresh(keys) {
        const selected = normalizeKeys(keys);
        const groups = selected.length > 0 ? selected : Array.from(this._refreshTimers.keys());
        for (const key of groups)
            this._stopTimer(key);
    }
    /** Subscribe to live mids for a single DEX. Omit `dex` for default perp DEX plus spot mids. */
    async startAllMids(dex) {
        if (!this.subscriptionTransport)
            throw new Error("SubscriptionTransport is required for allMids");
        const key = normalizeDexName(dex);
        const existing = this._allMidsSubscriptions.get(key);
        if (existing)
            return existing;
        const params = dexRequestName(key) ? { dex: key } : {};
        const subscription = await (0, mod_js_2.allMids)({ transport: this.subscriptionTransport }, params, (event) => this.applyAllMids(event, key));
        this._allMidsSubscriptions.set(key, subscription);
        return subscription;
    }
    /** Subscribe to live mids for the default DEX and every configured builder DEX. */
    async startConfiguredAllMids() {
        const dexEntries = await this._loadDexEntries();
        return await Promise.all(dexEntries.map((entry) => this.startAllMids(entry.name)));
    }
    /** Stop one live mids subscription, or all live mids subscriptions when omitted. */
    async stopAllMids(dex) {
        if (dex !== undefined) {
            const key = normalizeDexName(dex);
            const subscription = this._allMidsSubscriptions.get(key);
            this._allMidsSubscriptions.delete(key);
            await subscription?.unsubscribe();
            return;
        }
        const subscriptions = Array.from(this._allMidsSubscriptions.values());
        this._allMidsSubscriptions.clear();
        await Promise.all(subscriptions.map((subscription) => subscription.unsubscribe()));
    }
    /** Apply a live allMids event to cached markets. */
    applyAllMids(event, dex) {
        const source = isRecord(event) && isRecord(event.mids) ? event.mids : event;
        if (!isRecord(source))
            return;
        const eventDex = isRecord(event) && typeof event.dex === "string" ? event.dex : dex;
        const key = normalizeDexName(eventDex);
        const mids = {};
        for (const [coin, mid] of Object.entries(source)) {
            if (typeof mid === "string")
                mids[coin] = mid;
        }
        this._snapshot.rawAllMidsByDex[key] = mids;
        this._applyMidsForDex(key, mids);
        this._snapshot.updatedAt.allMids = Date.now();
        this._persist();
    }
    /** Subscribe to live asset contexts for all perpetual DEXs. */
    async startAllDexsAssetCtxs() {
        if (!this.subscriptionTransport)
            throw new Error("SubscriptionTransport is required for allDexsAssetCtxs");
        if (this._allDexsAssetCtxsSubscription)
            return this._allDexsAssetCtxsSubscription;
        this._allDexsAssetCtxsSubscription = await (0, mod_js_2.allDexsAssetCtxs)({ transport: this.subscriptionTransport }, (event) => this.applyAllDexsAssetCtxs(event));
        return this._allDexsAssetCtxsSubscription;
    }
    /** Stop the live all-DEX asset context subscription if it is active. */
    async stopAllDexsAssetCtxs() {
        const subscription = this._allDexsAssetCtxsSubscription;
        this._allDexsAssetCtxsSubscription = null;
        await subscription?.unsubscribe();
    }
    /** Subscribe to all-DEX clearinghouse state for a user. */
    async startAllDexsClearinghouseState(user) {
        if (!this.subscriptionTransport) {
            throw new Error("SubscriptionTransport is required for allDexsClearinghouseState");
        }
        const key = userKey(user);
        const existing = this._allDexsClearinghouseStateSubscriptions.get(key);
        if (existing)
            return existing;
        const subscription = await (0, mod_js_2.allDexsClearinghouseState)({ transport: this.subscriptionTransport }, { user }, (event) => this.applyAllDexsClearinghouseState(event));
        this._allDexsClearinghouseStateSubscriptions.set(key, subscription);
        return subscription;
    }
    /** Stop one user's clearinghouse subscription, or all user subscriptions when omitted. */
    async stopAllDexsClearinghouseState(user) {
        if (user) {
            const key = userKey(user);
            const subscription = this._allDexsClearinghouseStateSubscriptions.get(key);
            this._allDexsClearinghouseStateSubscriptions.delete(key);
            await subscription?.unsubscribe();
            return;
        }
        const subscriptions = Array.from(this._allDexsClearinghouseStateSubscriptions.values());
        this._allDexsClearinghouseStateSubscriptions.clear();
        await Promise.all(subscriptions.map((subscription) => subscription.unsubscribe()));
    }
    /** Apply a live all-DEX asset context event to known perp records. */
    applyAllDexsAssetCtxs(event) {
        const entries = normalizeDexEntries(event, "ctxs");
        const unmapped = [];
        for (const [dex, ctxs] of entries) {
            const rows = Array.isArray(ctxs) ? ctxs : [];
            this._snapshot.rawAllDexsAssetCtxsByDex[dex] = rows.filter(isRecord);
            rows.forEach((ctx, localAssetIndex) => {
                const normalizedCtx = normalizePerpCtx(ctx);
                if (!normalizedCtx)
                    return;
                const record = this._resolvePerpByDexAndLocalIndex(dex, localAssetIndex);
                if (!record) {
                    unmapped.push({ dex, localAssetIndex, context: normalizedCtx });
                    return;
                }
                this._applyPerpContext(record, normalizedCtx);
            });
        }
        this._snapshot.unmappedAllDexsAssetCtxs = unmapped;
        this._snapshot.needsMetadataRefresh = unmapped.length > 0;
        this._snapshot.updatedAt.allDexsAssetCtxs = Date.now();
        this._persist();
        if (unmapped.length > 0)
            void this._refreshMetadataForUnmappedLiveData();
    }
    /** Apply a live all-DEX clearinghouse state event to the user cache. */
    applyAllDexsClearinghouseState(event) {
        if (!isRecord(event))
            return;
        const user = typeof event.user === "string" ? userKey(event.user) : "";
        if (!user)
            return;
        const entries = normalizeDexEntries(event, "clearinghouseStates");
        const byDex = this._snapshot.rawAllDexsClearinghouseStateByUser[user] ?? {};
        for (const [dex, state] of entries) {
            if (isRecord(state))
                byDex[dex] = state;
        }
        this._snapshot.rawAllDexsClearinghouseStateByUser[user] = byDex;
        this._snapshot.updatedAt.allDexsClearinghouseState = Date.now();
        this._persist();
    }
    resolveMarket(symbolOrId) {
        const key = String(symbolOrId ?? "").trim();
        if (!key)
            return undefined;
        const normalizedSpotId = normalizeSpotPairId(key);
        const direct = this._snapshot.marketsBySymbol[key] ??
            this._snapshot.marketsByAssetId[key] ??
            this._snapshot.marketsBySubscriptionKey[key] ??
            this._snapshot.marketsBySubscriptionKey[upper(key)] ??
            this._snapshot.marketsBySpotPairId[normalizedSpotId] ??
            this._snapshot.marketsBySpotPairId[upper(normalizedSpotId)];
        if (direct)
            return direct;
        const alias = this._snapshot.aliasToSymbol[upper(key)] ?? this._snapshot.aliasToSymbol[compact(key)];
        if (alias)
            return this._snapshot.marketsBySymbol[alias];
        return undefined;
    }
    getMarkets(filter) {
        const dex = filter?.dex === undefined ? undefined : normalizeDexName(filter.dex);
        return sortMarkets(Object.values(this._snapshot.marketsBySymbol).filter((record) => {
            if (filter?.type !== undefined && record.type !== filter.type)
                return false;
            if (dex !== undefined && record.dex !== dex)
                return false;
            if (filter?.isBuilderDex !== undefined && record.isBuilderDex !== filter.isBuilderDex)
                return false;
            return true;
        }));
    }
    getPerpMarkets(dex) {
        return this.getMarkets({ type: "perp", dex });
    }
    getSpotMarkets() {
        return this.getMarkets({ type: "spot" });
    }
    getBuilderDexMarkets(dex) {
        return this.getMarkets({ type: "perp", dex, isBuilderDex: true });
    }
    getDexNames() {
        const names = Object.keys(this._snapshot.rawMetaAndAssetCtxsByDex);
        return names.sort((left, right) => {
            if (left === MAIN_DEX)
                return -1;
            if (right === MAIN_DEX)
                return 1;
            return left.localeCompare(right);
        });
    }
    getAssetId(symbolOrId) {
        return this.resolveMarket(symbolOrId)?.assetId;
    }
    getBase(symbolOrId) {
        return this.resolveMarket(symbolOrId)?.base;
    }
    getQuote(symbolOrId) {
        return this.resolveMarket(symbolOrId)?.quote;
    }
    getCoin(symbolOrId) {
        return this.resolveMarket(symbolOrId)?.coin;
    }
    getDex(symbolOrId) {
        return this.resolveMarket(symbolOrId)?.dex;
    }
    getQualifiedName(symbolOrId) {
        return this.resolveMarket(symbolOrId)?.qualifiedName;
    }
    getMarketKey(symbolOrId) {
        return this.resolveMarket(symbolOrId)?.marketKey;
    }
    getMarketType(symbolOrId) {
        return this.resolveMarket(symbolOrId)?.type;
    }
    getMaxLeverage(symbolOrId) {
        return this.resolveMarket(symbolOrId)?.maxLeverage;
    }
    getMarginTableId(symbolOrId) {
        return this.resolveMarket(symbolOrId)?.marginTableId;
    }
    getLocalAssetIndex(symbolOrId) {
        return this.resolveMarket(symbolOrId)?.localAssetIndex;
    }
    getContextKey(symbolOrId) {
        return this.resolveMarket(symbolOrId)?.contextKey;
    }
    getSzDecimals(symbolOrId) {
        return this.resolveMarket(symbolOrId)?.szDecimals;
    }
    getPriceDecimals(symbolOrId, referencePrice) {
        const record = this.resolveMarket(symbolOrId);
        if (!record)
            return undefined;
        if (referencePrice !== undefined)
            return getPriceDecimalsForValue(record.type, record.szDecimals, referencePrice);
        return record.priceDecimals;
    }
    getSizeDecimals(symbolOrId) {
        return this.resolveMarket(symbolOrId)?.sizeDecimals;
    }
    getSizeStep(symbolOrId) {
        return this.resolveMarket(symbolOrId)?.sizeStep;
    }
    getMid(symbolOrId) {
        return this.resolveMarket(symbolOrId)?.mid;
    }
    getFundingRate(symbolOrId) {
        return this.resolveMarket(symbolOrId)?.fundingRate;
    }
    getPerpContext(symbolOrId) {
        const record = this.resolveMarket(symbolOrId);
        return record?.type === "perp" ? record.context : undefined;
    }
    getSpotContext(symbolOrId) {
        const record = this.resolveMarket(symbolOrId);
        return record?.type === "spot" ? record.context : undefined;
    }
    getMetaAndAssetCtxs(dex) {
        return this._snapshot.rawMetaAndAssetCtxsByDex[normalizeDexName(dex)];
    }
    getSpotMetaAndAssetCtxs() {
        return this._snapshot.rawSpotMetaAndAssetCtxs;
    }
    getAllMids(dex) {
        return this._snapshot.rawAllMidsByDex[normalizeDexName(dex)];
    }
    getAllDexsAssetCtxs(dex) {
        if (dex !== undefined)
            return this._snapshot.rawAllDexsAssetCtxsByDex[normalizeDexName(dex)] ?? [];
        return this._snapshot.rawAllDexsAssetCtxsByDex;
    }
    getAllDexsClearinghouseState(user, dex) {
        const states = this._snapshot.rawAllDexsClearinghouseStateByUser[userKey(user)];
        if (!states)
            return undefined;
        if (dex !== undefined)
            return states[normalizeDexName(dex)];
        return states;
    }
    getUserPosition(user, symbolOrId) {
        const market = this.resolveMarket(symbolOrId);
        if (!market || market.type !== "perp")
            return undefined;
        return this.getUserPositions(user, market.dex).find((row) => row.market?.symbol === market.symbol);
    }
    getUserPositions(user, dex) {
        const states = this._snapshot.rawAllDexsClearinghouseStateByUser[userKey(user)];
        if (!states)
            return [];
        const selectedDexs = dex !== undefined ? [normalizeDexName(dex)] : Object.keys(states);
        const out = [];
        for (const selectedDex of selectedDexs) {
            const state = states[selectedDex];
            if (!state || !Array.isArray(state.assetPositions))
                continue;
            for (const assetPosition of state.assetPositions) {
                const position = assetPosition.position;
                const market = this._resolvePositionMarket(selectedDex, position.coin);
                out.push({
                    user: userKey(user),
                    dex: selectedDex,
                    market,
                    assetPosition,
                    position,
                });
            }
        }
        return out;
    }
    getPredictedFundings() {
        return this._snapshot.rawPredictedFundings;
    }
    getOutcomeMeta() {
        return this._snapshot.rawOutcomeMeta;
    }
    resolveOutcomeMarket(coinOrId) {
        const raw = String(coinOrId ?? "").trim();
        if (!raw)
            return undefined;
        const alias = this._snapshot.outcomeAliasToCoin[raw] ??
            this._snapshot.outcomeAliasToCoin[upper(raw)] ??
            this._snapshot.outcomeAliasToCoin[raw.startsWith("#") || raw.startsWith("+") ? raw : `#${raw}`];
        return alias ? this._snapshot.outcomeMarketsByCoin[alias] : undefined;
    }
    getOutcomeMarkets(params) {
        if (params?.questionId !== undefined) {
            return this._snapshot.outcomeMarketsByQuestion[String(params.questionId)] ?? [];
        }
        if (params?.outcomeId !== undefined) {
            return this._snapshot.outcomeMarketsByOutcome[String(params.outcomeId)] ?? [];
        }
        return Object.values(this._snapshot.outcomeMarketsByCoin);
    }
    getOutcomeMid(coinOrId) {
        return this.resolveOutcomeMarket(coinOrId)?.mid;
    }
    getOutcomeAssetId(coinOrId) {
        return this.resolveOutcomeMarket(coinOrId)?.assetId;
    }
    getOutcomeTokenName(coinOrId) {
        return this.resolveOutcomeMarket(coinOrId)?.tokenName;
    }
    getOutcomeEncoding(coinOrId) {
        return this.resolveOutcomeMarket(coinOrId)?.encoding;
    }
    getOutcomeOrderInfo(coinOrId) {
        const record = this.resolveOutcomeMarket(coinOrId);
        if (!record)
            return undefined;
        return {
            coin: record.coin,
            encoding: record.encoding,
            spotCoin: record.spotCoin,
            tokenName: record.tokenName,
            assetId: record.assetId,
            outcomeId: record.outcomeId,
            sideIndex: record.sideIndex,
            sideName: record.sideName,
            outcomeName: record.outcomeName,
            questionId: record.questionId,
            questionName: record.questionName,
            mid: record.mid,
        };
    }
    /** Alias for apps that label HIP-4 outcome markets as prediction markets. */
    resolvePredictionMarket(coinOrId) {
        return this.resolveOutcomeMarket(coinOrId);
    }
    async getFundingHistory(params, signal) {
        const key = buildFundingHistoryKey(params);
        const cached = this._snapshot.rawFundingHistoryByKey[key];
        if (cached && !this._isStale("fundingHistory"))
            return cached;
        const rows = await (0, mod_js_1.fundingHistory)({ transport: this.transport }, params, signal);
        this._snapshot.rawFundingHistoryByKey[key] = rows;
        this._snapshot.updatedAt.fundingHistory = Date.now();
        this._persist();
        return rows;
    }
    getOrderPrecision(symbolOrId, referencePrice) {
        const record = this.resolveMarket(symbolOrId);
        if (!record)
            return undefined;
        const effectiveReference = referencePrice ?? getReferencePrice(record);
        const effectiveDecimals = effectiveReference !== undefined
            ? getPriceDecimalsForValue(record.type, record.szDecimals, effectiveReference)
            : record.priceDecimals;
        return {
            szDecimals: record.szDecimals,
            sizeDecimals: record.sizeDecimals,
            sizeStep: record.sizeStep,
            priceDecimals: effectiveReference !== undefined ? effectiveDecimals : record.priceDecimals,
            maxPriceDecimals: record.maxPriceDecimals,
            priceStep: record.priceStep,
            effectivePriceStep: stepFromDecimals(effectiveDecimals),
            marketType: record.type,
            assetId: record.assetId,
            subscriptionKey: record.subscriptionKey,
            spotPairId: record.spotPairId,
        };
    }
    getOrderTicketInfo(symbolOrId, referencePrice) {
        const record = this.resolveMarket(symbolOrId);
        const precision = this.getOrderPrecision(symbolOrId, referencePrice);
        if (!record || !precision)
            return undefined;
        return {
            ...precision,
            symbol: record.symbol,
            type: record.type,
            coin: record.coin,
            base: record.base,
            quote: record.quote,
            dex: record.dex,
            isBuilderDex: record.isBuilderDex,
            qualifiedName: record.qualifiedName,
            marketKey: record.marketKey,
            displayName: record.displayName,
            contextKey: record.contextKey,
            localAssetIndex: record.localAssetIndex,
            pDecimals: precision.priceDecimals,
            sDecimals: precision.sizeDecimals,
            displayPriceStep: precision.priceStep,
            effectiveSubmitPriceStep: precision.effectivePriceStep,
            maxLeverage: record.maxLeverage,
            marginTableId: record.marginTableId,
            collateralToken: record.collateralToken,
            marginMode: record.marginMode,
            onlyIsolated: record.onlyIsolated,
            supportsCross: record.supportsCross,
            strictIsolated: record.strictIsolated,
            mid: record.mid,
            fundingRate: record.fundingRate,
            context: record.context,
        };
    }
    formatOrderPrice(symbolOrId, price) {
        const record = this.resolveMarket(symbolOrId);
        if (!record)
            return undefined;
        return (0, _format_js_1.formatPrice)(price, record.szDecimals, record.type);
    }
    formatOrderSize(symbolOrId, size) {
        const record = this.resolveMarket(symbolOrId);
        if (!record)
            return undefined;
        return (0, _format_js_1.formatSize)(size, record.szDecimals);
    }
    _resolvePerpByDexAndLocalIndex(dex, localAssetIndex) {
        for (const record of Object.values(this._snapshot.marketsBySymbol)) {
            if (record.type === "perp" && record.dex === dex && record.localAssetIndex === localAssetIndex) {
                return record;
            }
        }
        return undefined;
    }
    _resolvePositionMarket(dex, coin) {
        const normalizedDex = normalizeDexName(dex);
        if (normalizedDex === MAIN_DEX) {
            return this.resolveMarket(coin);
        }
        return this.resolveMarket(`${normalizedDex}:${coin}`) ?? this.resolveMarket(coin);
    }
    _applyPerpContext(record, ctx) {
        record.context = ctx;
        record.mid = typeof ctx.midPx === "string" ? ctx.midPx : typeof ctx.markPx === "string" ? ctx.markPx : record.mid;
        record.fundingRate = typeof ctx.funding === "string" ? ctx.funding : record.fundingRate;
    }
    _applyStoredAllDexsAssetCtxs() {
        const unmapped = [];
        for (const [dex, rows] of Object.entries(this._snapshot.rawAllDexsAssetCtxsByDex)) {
            rows.forEach((ctx, localAssetIndex) => {
                const record = this._resolvePerpByDexAndLocalIndex(dex, localAssetIndex);
                if (!record) {
                    unmapped.push({ dex, localAssetIndex, context: ctx });
                    return;
                }
                this._applyPerpContext(record, ctx);
            });
        }
        this._snapshot.unmappedAllDexsAssetCtxs = unmapped;
        this._snapshot.needsMetadataRefresh = unmapped.length > 0;
    }
    _refreshMetadataForUnmappedLiveData() {
        if (!this._policies.metadata.enabled)
            return;
        const now = Date.now();
        if (now - this._liveMetadataRefreshRequestedAt < 60_000)
            return;
        if (this._liveMetadataRefreshPromise)
            return;
        this._liveMetadataRefreshRequestedAt = now;
        this._liveMetadataRefreshPromise = this.refresh(["metadata", "contexts"])
            .catch(() => undefined)
            .then(() => {
            this._liveMetadataRefreshPromise = null;
        });
    }
    async _refreshMetadataAndContexts(updateMetadata, updateContexts) {
        const config = { transport: this.transport };
        const dexEntries = await this._loadDexEntries();
        const [spotTuple, ...perpTuples] = await Promise.all([
            (0, mod_js_1.spotMetaAndAssetCtxs)(config),
            ...dexEntries.map((entry) => (0, mod_js_1.metaAndAssetCtxs)(config, dexRequestName(entry.name) ? { dex: entry.name } : undefined)),
        ]);
        const rawByDex = {};
        dexEntries.forEach((entry, index) => {
            rawByDex[entry.name] = perpTuples[index];
        });
        this._snapshot.rawMetaAndAssetCtxsByDex = rawByDex;
        this._snapshot.rawSpotMetaAndAssetCtxs = spotTuple;
        this._rebuildMarkets(dexEntries, rawByDex, spotTuple);
        this._applyStoredAllDexsAssetCtxs();
        const now = Date.now();
        this._snapshot.loadedAt = this._snapshot.loadedAt || now;
        if (updateMetadata)
            this._snapshot.updatedAt.metadata = now;
        if (updateContexts)
            this._snapshot.updatedAt.contexts = now;
    }
    async _refreshAllMids() {
        const config = { transport: this.transport };
        const dexEntries = await this._loadDexEntries();
        const results = await Promise.all(dexEntries.map((entry) => (0, mod_js_1.allMids)(config, dexRequestName(entry.name) ? { dex: entry.name } : undefined)));
        dexEntries.forEach((entry, index) => {
            this._snapshot.rawAllMidsByDex[entry.name] = results[index];
        });
        this._applyMids();
        this._snapshot.updatedAt.allMids = Date.now();
    }
    async _refreshPredictedFundings() {
        this._snapshot.rawPredictedFundings = await (0, mod_js_1.predictedFundings)({ transport: this.transport });
        this._snapshot.updatedAt.predictedFundings = Date.now();
    }
    async _refreshOutcomeMeta() {
        this._snapshot.rawOutcomeMeta = await (0, mod_js_1.outcomeMeta)({ transport: this.transport });
        this._rebuildOutcomeMarkets();
        this._snapshot.updatedAt.outcomeMeta = Date.now();
    }
    async _loadDexEntries() {
        const entries = [{ name: MAIN_DEX, index: 0 }];
        if (this.dexs === false || this.dexs === undefined || (Array.isArray(this.dexs) && this.dexs.length === 0)) {
            return entries;
        }
        const rows = await (0, mod_js_1.perpDexs)({ transport: this.transport });
        const wanted = Array.isArray(this.dexs) ? new Set(this.dexs.map((dex) => upper(normalizeDexName(dex)))) : null;
        rows.forEach((row, index) => {
            if (!row || index === 0)
                return;
            const name = normalizeDexName(row.name);
            if (!name || name === MAIN_DEX)
                return;
            if (wanted && !wanted.has(upper(name)))
                return;
            entries.push({ name, index });
        });
        return entries;
    }
    _rebuildMarkets(dexEntries, rawByDex, spotTuple) {
        const next = {
            marketsBySymbol: {},
            marketsBySubscriptionKey: {},
            marketsByAssetId: {},
            marketsBySpotPairId: {},
            marketsByBaseQuoteType: {},
            aliasToSymbol: {},
        };
        const spotMeta = spotTuple[0] ?? null;
        for (const entry of dexEntries) {
            const tuple = rawByDex[entry.name];
            if (!tuple)
                continue;
            const [meta, ctxs] = tuple;
            const universe = Array.isArray(meta?.universe) ? meta.universe : [];
            const quote = resolvePerpQuote(meta, spotMeta);
            for (let index = 0; index < universe.length; index += 1) {
                const asset = universe[index];
                if (!asset || asset.isDelisted)
                    continue;
                const rawName = String(asset.name ?? "").trim();
                if (!rawName)
                    continue;
                const coin = entry.name !== MAIN_DEX && rawName.includes(":") ? rawName.split(":").slice(1).join(":") : rawName;
                const qualifiedName = entry.name === MAIN_DEX ? coin : `${entry.name}:${coin}`;
                const base = qualifiedName;
                const szDecimals = clampDecimals(asset.szDecimals, 0);
                const maxPriceDecimals = getMaxPriceDecimals("perp", szDecimals);
                const ctx = isRecord(ctxs?.[index]) ? ctxs[index] : null;
                const referencePrice = ctx?.markPx ?? ctx?.midPx ?? ctx?.oraclePx;
                const priceDecimals = getPriceDecimalsForValue("perp", szDecimals, referencePrice);
                const record = {
                    symbol: canonicalSymbol({ base, quote, type: "perp" }),
                    type: "perp",
                    coin,
                    base,
                    quote,
                    dex: entry.name,
                    isBuilderDex: entry.name !== MAIN_DEX,
                    qualifiedName,
                    marketKey: `${entry.name}:${coin}`,
                    displayName: perpDisplayName(qualifiedName),
                    contextKey: qualifiedName,
                    assetId: entry.name === MAIN_DEX ? index : 100_000 + entry.index * 10_000 + index,
                    localAssetIndex: index,
                    subscriptionKey: qualifiedName,
                    szDecimals,
                    sizeDecimals: szDecimals,
                    sizeStep: stepFromDecimals(szDecimals),
                    priceDecimals,
                    maxPriceDecimals,
                    priceStep: stepFromDecimals(priceDecimals),
                    maxLeverage: Number.isFinite(Number(asset.maxLeverage)) ? Number(asset.maxLeverage) : undefined,
                    marginTableId: Number.isFinite(Number(asset.marginTableId)) ? Number(asset.marginTableId) : undefined,
                    collateralToken: Number.isFinite(Number(meta?.collateralToken)) ? Number(meta.collateralToken) : undefined,
                    ...marginConstraints(asset),
                    context: ctx,
                    mid: typeof ctx?.midPx === "string" ? ctx.midPx : typeof ctx?.markPx === "string" ? ctx.markPx : undefined,
                    fundingRate: typeof ctx?.funding === "string" ? ctx.funding : undefined,
                };
                this._indexRecord(next, record);
            }
        }
        if (!spotMeta) {
            this._snapshot.marketsBySymbol = next.marketsBySymbol;
            this._snapshot.marketsBySubscriptionKey = next.marketsBySubscriptionKey;
            this._snapshot.marketsByAssetId = next.marketsByAssetId;
            this._snapshot.marketsBySpotPairId = next.marketsBySpotPairId;
            this._snapshot.marketsByBaseQuoteType = next.marketsByBaseQuoteType;
            this._snapshot.aliasToSymbol = next.aliasToSymbol;
            return;
        }
        const spotCtxs = Array.isArray(spotTuple[1]) ? spotTuple[1] : [];
        const tokenMap = new Map();
        for (const token of spotMeta?.tokens ?? [])
            tokenMap.set(token.index, token);
        for (let position = 0; position < (spotMeta?.universe?.length ?? 0); position += 1) {
            const market = spotMeta.universe[position];
            if (!market || !Array.isArray(market.tokens) || market.tokens.length < 2)
                continue;
            const baseToken = tokenMap.get(market.tokens[0]);
            const quoteToken = tokenMap.get(market.tokens[1]);
            if (!baseToken || !quoteToken)
                continue;
            const base = tokenName(baseToken, `@${market.tokens[0]}`).toUpperCase();
            const quote = tokenName(quoteToken, `@${market.tokens[1]}`).toUpperCase();
            const index = Number.isFinite(Number(market.index)) ? Number(market.index) : position;
            const spotPairId = `@${index}`;
            const szDecimals = clampDecimals(baseToken.szDecimals, 0);
            const maxPriceDecimals = getMaxPriceDecimals("spot", szDecimals);
            const ctx = this._resolveSpotContext(spotCtxs, spotPairId, position, base, quote);
            const coin = spotDisplayName(base, quote);
            const record = {
                symbol: canonicalSymbol({ base, quote, type: "spot" }),
                type: "spot",
                coin,
                base,
                quote,
                dex: MAIN_DEX,
                isBuilderDex: false,
                qualifiedName: coin,
                marketKey: spotPairId,
                displayName: coin,
                contextKey: spotPairId,
                assetId: 10_000 + index,
                localAssetIndex: index,
                spotPairId,
                activeAssetCtxId: String(index),
                subscriptionKey: spotPairId,
                szDecimals,
                sizeDecimals: szDecimals,
                sizeStep: stepFromDecimals(szDecimals),
                priceDecimals: maxPriceDecimals,
                maxPriceDecimals,
                priceStep: null,
                context: ctx,
                mid: typeof ctx?.midPx === "string" ? ctx.midPx : typeof ctx?.markPx === "string" ? ctx.markPx : undefined,
            };
            this._indexRecord(next, record);
        }
        this._snapshot.marketsBySymbol = next.marketsBySymbol;
        this._snapshot.marketsBySubscriptionKey = next.marketsBySubscriptionKey;
        this._snapshot.marketsByAssetId = next.marketsByAssetId;
        this._snapshot.marketsBySpotPairId = next.marketsBySpotPairId;
        this._snapshot.marketsByBaseQuoteType = next.marketsByBaseQuoteType;
        this._snapshot.aliasToSymbol = next.aliasToSymbol;
        this._applyMids();
    }
    _resolveSpotContext(ctxs, spotPairId, position, base, quote) {
        const expected = new Set([spotPairId, `${base}/${quote}`, base].map(upper));
        for (const ctx of ctxs) {
            if (!isRecord(ctx))
                continue;
            const coin = upper(ctx.coin);
            if (coin && expected.has(coin))
                return ctx;
            const ctxRecord = ctx;
            const asset = Number(ctxRecord.asset ?? ctxRecord.assetId ?? ctxRecord.index);
            if (Number.isFinite(asset) && expected.has(`@${asset >= 10_000 ? asset - 10_000 : asset}`)) {
                return ctx;
            }
        }
        const positional = ctxs[position];
        return isRecord(positional) ? positional : null;
    }
    _indexRecord(next, record) {
        next.marketsBySymbol[record.symbol] = record;
        next.marketsByAssetId[assetIdKey(record.assetId)] = record;
        next.marketsByBaseQuoteType[baseQuoteTypeKey(record.base, record.quote, record.type)] = record;
        for (const key of uniqueStrings([
            record.subscriptionKey,
            upper(record.subscriptionKey),
            record.qualifiedName,
            upper(record.qualifiedName),
            record.marketKey,
            upper(record.marketKey),
            record.contextKey,
            upper(record.contextKey),
            record.displayName,
            upper(record.displayName),
            record.symbol,
            upper(record.symbol),
        ])) {
            if (key)
                next.marketsBySubscriptionKey[key] = record;
        }
        if (record.spotPairId) {
            next.marketsBySpotPairId[record.spotPairId] = record;
            next.marketsBySpotPairId[upper(record.spotPairId)] = record;
            next.marketsBySubscriptionKey[String(record.localAssetIndex)] = record;
        }
        const aliases = record.type === "spot"
            ? [
                record.symbol,
                compact(record.symbol),
                record.qualifiedName,
                record.displayName,
                `${record.base}-SPOT`,
                `${record.base}/${record.quote}`,
                `${record.base}:${record.quote}`,
                `${compact(record.base)}${upper(record.quote)}`,
                record.spotPairId,
                record.localAssetIndex,
                record.assetId,
            ]
            : [
                record.symbol,
                compact(record.symbol),
                record.qualifiedName,
                record.displayName,
                record.marketKey,
                `${record.qualifiedName}-PERP`,
                record.base,
                record.coin,
                `${record.coin}-PERP`,
                `${record.dex}:${record.coin}`,
                `${record.dex}:${record.coin}-PERP`,
                `${compact(record.base)}${upper(record.quote)}:PERP`,
            ];
        for (const alias of aliases) {
            const normalized = upper(alias);
            if (!normalized)
                continue;
            if (record.type === "spot" && next.aliasToSymbol[normalized])
                continue;
            next.aliasToSymbol[normalized] = record.symbol;
            next.aliasToSymbol[compact(alias)] = record.symbol;
        }
    }
    _applyMids() {
        for (const [dex, mids] of Object.entries(this._snapshot.rawAllMidsByDex)) {
            this._applyMidsForDex(dex, mids);
        }
    }
    _applyMidsForDex(dex, mids) {
        for (const [coin, mid] of Object.entries(mids)) {
            if (coin.startsWith("#")) {
                const outcome = this.resolveOutcomeMarket(coin);
                if (outcome && typeof mid === "string")
                    outcome.mid = mid;
                continue;
            }
            const key = dex === MAIN_DEX || coin.includes(":") ? coin : `${dex}:${coin}`;
            const record = this.resolveMarket(key) ?? this.resolveMarket(coin);
            if (record && typeof mid === "string")
                record.mid = mid;
        }
    }
    _rebuildOutcomeMarkets() {
        const meta = this._snapshot.rawOutcomeMeta;
        const byCoin = {};
        const aliasToCoin = {};
        const byOutcome = {};
        const byQuestion = {};
        if (!meta) {
            this._snapshot.outcomeMarketsByCoin = byCoin;
            this._snapshot.outcomeAliasToCoin = aliasToCoin;
            this._snapshot.outcomeMarketsByOutcome = byOutcome;
            this._snapshot.outcomeMarketsByQuestion = byQuestion;
            return;
        }
        const questionByOutcome = new Map();
        for (const question of meta.questions ?? []) {
            for (const outcomeId of question.namedOutcomes ?? [])
                questionByOutcome.set(outcomeId, question);
            if (Number.isFinite(Number(question.fallbackOutcome)))
                questionByOutcome.set(question.fallbackOutcome, question);
        }
        for (const outcome of meta.outcomes ?? []) {
            const outcomeId = Number(outcome.outcome);
            if (!Number.isFinite(outcomeId))
                continue;
            const question = questionByOutcome.get(outcomeId);
            for (let sideIndex = 0; sideIndex < (outcome.sideSpecs?.length ?? 0); sideIndex += 1) {
                if (sideIndex > 1)
                    continue;
                const side = outcome.sideSpecs[sideIndex];
                const encoding = 10 * outcomeId + sideIndex;
                const coin = `#${encoding}`;
                const tokenName = `+${encoding}`;
                const assetId = 100_000_000 + encoding;
                const record = {
                    ...parseOutcomeDescription(outcome.description),
                    coin,
                    encoding,
                    spotCoin: coin,
                    tokenName,
                    assetId,
                    outcomeId,
                    sideIndex,
                    sideName: String(side?.name ?? sideIndex),
                    outcomeName: outcome.name,
                    outcomeDescription: outcome.description,
                    questionId: question?.question,
                    questionName: question?.name,
                    questionDescription: question?.description,
                    fallbackOutcome: question?.fallbackOutcome,
                    isSettled: question?.settledNamedOutcomes?.includes(outcomeId),
                };
                byCoin[coin] = record;
                for (const alias of [coin, upper(coin), String(encoding), tokenName, upper(tokenName), String(assetId)]) {
                    aliasToCoin[alias] = coin;
                }
                byOutcome[String(outcomeId)] = [...(byOutcome[String(outcomeId)] ?? []), record];
                if (question?.question !== undefined) {
                    byQuestion[String(question.question)] = [...(byQuestion[String(question.question)] ?? []), record];
                }
            }
        }
        this._snapshot.outcomeMarketsByCoin = byCoin;
        this._snapshot.outcomeAliasToCoin = aliasToCoin;
        this._snapshot.outcomeMarketsByOutcome = byOutcome;
        this._snapshot.outcomeMarketsByQuestion = byQuestion;
        this._applyMids();
    }
    _isStale(key) {
        const ttlMs = this._policies[key].ttlMs;
        const updatedAt = this._snapshot.updatedAt[key] ?? 0;
        return Boolean(ttlMs && Date.now() - updatedAt > ttlMs);
    }
    _stopTimer(key) {
        const timer = this._refreshTimers.get(key);
        if (timer)
            clearInterval(timer);
        this._refreshTimers.delete(key);
    }
    _persist() {
        if (!this._storage)
            return;
        const persisted = emptySnapshot();
        persisted.loadedAt = this._snapshot.loadedAt;
        const marketsForPersistence = this._marketsForPersistence();
        for (const key of Object.keys(this._policies)) {
            if (!this._policies[key].persist)
                continue;
            if (this._snapshot.updatedAt[key])
                persisted.updatedAt[key] = this._snapshot.updatedAt[key];
            if (key === "metadata" || key === "contexts") {
                persisted.marketsBySymbol = marketsForPersistence.marketsBySymbol;
                persisted.marketsBySubscriptionKey = marketsForPersistence.marketsBySubscriptionKey;
                persisted.marketsByAssetId = marketsForPersistence.marketsByAssetId;
                persisted.marketsBySpotPairId = marketsForPersistence.marketsBySpotPairId;
                persisted.marketsByBaseQuoteType = marketsForPersistence.marketsByBaseQuoteType;
                persisted.aliasToSymbol = this._snapshot.aliasToSymbol;
                persisted.rawMetaAndAssetCtxsByDex = this._snapshot.rawMetaAndAssetCtxsByDex;
                persisted.rawSpotMetaAndAssetCtxs = this._snapshot.rawSpotMetaAndAssetCtxs;
            }
            if (key === "allMids")
                persisted.rawAllMidsByDex = this._snapshot.rawAllMidsByDex;
            if (key === "allDexsAssetCtxs") {
                persisted.rawAllDexsAssetCtxsByDex = this._snapshot.rawAllDexsAssetCtxsByDex;
                persisted.unmappedAllDexsAssetCtxs = this._snapshot.unmappedAllDexsAssetCtxs;
                persisted.needsMetadataRefresh = this._snapshot.needsMetadataRefresh;
            }
            if (key === "allDexsClearinghouseState") {
                persisted.rawAllDexsClearinghouseStateByUser = this._snapshot.rawAllDexsClearinghouseStateByUser;
            }
            if (key === "outcomeMeta") {
                const outcomesForPersistence = this._outcomesForPersistence();
                persisted.rawOutcomeMeta = this._snapshot.rawOutcomeMeta;
                persisted.outcomeMarketsByCoin = outcomesForPersistence.outcomeMarketsByCoin;
                persisted.outcomeAliasToCoin = this._snapshot.outcomeAliasToCoin;
                persisted.outcomeMarketsByOutcome = outcomesForPersistence.outcomeMarketsByOutcome;
                persisted.outcomeMarketsByQuestion = outcomesForPersistence.outcomeMarketsByQuestion;
            }
            if (key === "predictedFundings")
                persisted.rawPredictedFundings = this._snapshot.rawPredictedFundings;
            if (key === "fundingHistory")
                persisted.rawFundingHistoryByKey = this._snapshot.rawFundingHistoryByKey;
        }
        this._storage.setItem(this.storageKey, JSON.stringify({ version: CACHE_VERSION, snapshot: persisted }));
    }
    _marketsForPersistence() {
        if (this._policies.allMids.persist) {
            return {
                marketsBySymbol: this._snapshot.marketsBySymbol,
                marketsBySubscriptionKey: this._snapshot.marketsBySubscriptionKey,
                marketsByAssetId: this._snapshot.marketsByAssetId,
                marketsBySpotPairId: this._snapshot.marketsBySpotPairId,
                marketsByBaseQuoteType: this._snapshot.marketsByBaseQuoteType,
            };
        }
        const bySymbol = {};
        for (const [symbol, record] of Object.entries(this._snapshot.marketsBySymbol)) {
            bySymbol[symbol] = {
                ...record,
                mid: typeof record.context?.midPx === "string"
                    ? record.context.midPx
                    : typeof record.context?.markPx === "string"
                        ? record.context.markPx
                        : undefined,
            };
        }
        const remap = (source) => {
            const out = {};
            for (const [key, record] of Object.entries(source))
                out[key] = bySymbol[record.symbol] ?? record;
            return out;
        };
        return {
            marketsBySymbol: bySymbol,
            marketsBySubscriptionKey: remap(this._snapshot.marketsBySubscriptionKey),
            marketsByAssetId: remap(this._snapshot.marketsByAssetId),
            marketsBySpotPairId: remap(this._snapshot.marketsBySpotPairId),
            marketsByBaseQuoteType: remap(this._snapshot.marketsByBaseQuoteType),
        };
    }
    _outcomesForPersistence() {
        if (this._policies.allMids.persist) {
            return {
                outcomeMarketsByCoin: this._snapshot.outcomeMarketsByCoin,
                outcomeMarketsByOutcome: this._snapshot.outcomeMarketsByOutcome,
                outcomeMarketsByQuestion: this._snapshot.outcomeMarketsByQuestion,
            };
        }
        const byCoin = {};
        for (const [coin, record] of Object.entries(this._snapshot.outcomeMarketsByCoin)) {
            byCoin[coin] = { ...record, mid: undefined };
        }
        const remapRows = (source) => {
            const out = {};
            for (const [key, rows] of Object.entries(source)) {
                out[key] = rows.map((record) => byCoin[record.coin] ?? { ...record, mid: undefined });
            }
            return out;
        };
        return {
            outcomeMarketsByCoin: byCoin,
            outcomeMarketsByOutcome: remapRows(this._snapshot.outcomeMarketsByOutcome),
            outcomeMarketsByQuestion: remapRows(this._snapshot.outcomeMarketsByQuestion),
        };
    }
}
exports.HyperliquidMarketCache = HyperliquidMarketCache;
//# sourceMappingURL=_marketCache.js.map