// deno-lint-ignore-file no-import-prefix

import { assertEquals } from "jsr:@std/assert@1";
import type { IRequestTransport, ISubscription, ISubscriptionTransport } from "@nktkas/hyperliquid";
import { HyperliquidMarketCache } from "@nktkas/hyperliquid/utils";

class MockInfoTransport implements IRequestTransport {
  isTestnet = false;
  requests: Record<string, unknown>[] = [];
  mainFunding = "0.0001";
  mainMid = "100000";

  request<T>(endpoint: "info" | "exchange" | "explorer", payload: unknown): Promise<T> {
    if (endpoint !== "info") throw new Error(`Unexpected endpoint: ${endpoint}`);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("Unexpected payload");
    }
    const req = payload as Record<string, unknown>;
    this.requests.push(req);

    if (req.type === "perpDexs") {
      return Promise.resolve([
        null,
        makeDex("dexA"),
        makeDex("dexB"),
        makeDex("dexC"),
      ] as T);
    }

    if (req.type === "metaAndAssetCtxs" && req.dex === "dexA") {
      return Promise.resolve([
        {
          universe: [{ name: "AAA", szDecimals: 1, maxLeverage: 3, marginTableId: 11 }],
          marginTables: [],
          collateralToken: 1,
        },
        [{ markPx: "12.345", midPx: "12.34", funding: "0.0002", openInterest: "100" }],
      ] as T);
    }

    if (req.type === "metaAndAssetCtxs" && req.dex === "dexB") {
      return Promise.resolve([
        {
          universe: [
            { name: "BBB", szDecimals: 2, maxLeverage: 4, marginTableId: 12 },
            { name: "AAA", szDecimals: 3, maxLeverage: 4, marginTableId: 14 },
          ],
          marginTables: [],
          collateralToken: 1,
        },
        [
          { markPx: "0.123456", midPx: "0.12345", funding: "-0.0003", openInterest: "200" },
          { markPx: "11.4", midPx: "11.45", funding: "0.0008", openInterest: "400" },
        ],
      ] as T);
    }

    if (req.type === "metaAndAssetCtxs" && req.dex === "dexC") {
      return Promise.resolve([
        {
          universe: [{ name: "CCC", szDecimals: 0, maxLeverage: 2, marginTableId: 13 }],
          marginTables: [],
          collateralToken: 3,
        },
        [{ markPx: "1.23456", midPx: "1.2345", funding: "0.0004", openInterest: "300" }],
      ] as T);
    }

    if (req.type === "metaAndAssetCtxs") {
      return Promise.resolve([
        {
          universe: [
            { name: "BTC", szDecimals: 5, maxLeverage: 50, marginTableId: 1 },
            { name: "ETH", szDecimals: 4, maxLeverage: 25, marginTableId: 2 },
            { name: "AAA", szDecimals: 3, maxLeverage: 5, marginTableId: 3 },
          ],
          marginTables: [],
          collateralToken: 1,
        },
        [
          { markPx: this.mainMid, midPx: this.mainMid, funding: this.mainFunding, openInterest: "1000" },
          { markPx: "3000", midPx: "3001", funding: "0.00005", openInterest: "500" },
          { markPx: "11", midPx: "11.1", funding: "0.00006", openInterest: "300" },
        ],
      ] as T);
    }

    if (req.type === "spotMetaAndAssetCtxs") {
      return Promise.resolve([
        {
          tokens: [
            token("BTC", 5, 0),
            token("USDC", 6, 1),
            token("PURR", 0, 2),
            token("USDH", 6, 3),
            token("ETH", 4, 4),
          ],
          universe: [
            // Intentionally misleading raw name. The cache must derive BTC/USDC
            // from token indexes, not trust this field.
            { tokens: [0, 1], name: "JEFF/USDC", index: 107, isCanonical: true },
            { tokens: [2, 1], name: "PURR/USDC", index: 0, isCanonical: true },
            // Intentionally conflicts with the real BTC/USDC pair above.
            { tokens: [4, 1], name: "BTC/USDC", index: 108, isCanonical: true },
          ],
        },
        [
          { coin: "@107", markPx: "99999", midPx: "100001", circulatingSupply: "1", totalSupply: "1" },
          { coin: "PURR/USDC", markPx: "0.1", midPx: "0.11", circulatingSupply: "1", totalSupply: "1" },
          { coin: "@108", markPx: "3000", midPx: "3002", circulatingSupply: "1", totalSupply: "1" },
        ],
      ] as T);
    }

    if (req.type === "allMids" && req.dex === "dexA") {
      return Promise.resolve({ AAA: "12.5" } as T);
    }
    if (req.type === "allMids" && req.dex === "dexB") {
      return Promise.resolve({ BBB: "0.12", AAA: "11.5" } as T);
    }
    if (req.type === "allMids" && req.dex === "dexC") {
      return Promise.resolve({ CCC: "1.25" } as T);
    }
    if (req.type === "allMids") {
      return Promise.resolve({
        BTC: "100010",
        ETH: "2999",
        AAA: "11.2",
        "@107": "100002",
        "@108": "3003",
        "#52360": "0.4",
        "#52361": "0.6",
        "#770": "0.2",
        "#771": "0.8",
        "#772": "0.01",
      } as T);
    }

    if (req.type === "outcomeMeta") {
      return Promise.resolve({
        outcomes: [
          {
            outcome: 5236,
            name: "Recurring",
            description: "class:priceBinary|underlying:BTC|expiry:20260427-0300|targetPrice:77516|period:1d",
            sideSpecs: [{ name: "Yes" }, { name: "No" }],
          },
          {
            outcome: 9,
            name: "Who will win the HL 100 meter dash?",
            description: "This race is yet to be scheduled.",
            sideSpecs: [{ name: "Hypurr", token: 90 }, { name: "Usain Bolt", token: 91 }],
          },
          {
            outcome: 77,
            name: "Three-way metadata should still expose binary sides only",
            description: "class:binary|underlying:EDGE",
            sideSpecs: [{ name: "Yes" }, { name: "No" }, { name: "Ignored" }],
          },
        ],
        questions: [
          {
            question: 1,
            name: "Will BTC close above target?",
            description: "A testnet HIP-4 binary price question.",
            fallbackOutcome: 9,
            namedOutcomes: [5236],
            settledNamedOutcomes: [],
          },
          {
            question: 2,
            name: "Settled edge-case outcome",
            description: "Tests settled metadata and extra side filtering.",
            fallbackOutcome: 77,
            namedOutcomes: [],
            settledNamedOutcomes: [77],
          },
        ],
      } as T);
    }

    if (req.type === "predictedFundings") {
      return Promise.resolve([["BTC", [["HlPerp", { fundingRate: "0.0002", nextFundingTime: 1 }]]]] as T);
    }

    if (req.type === "fundingHistory") {
      return Promise.resolve([
        { coin: req.coin, fundingRate: "0.0001", premium: "0", time: req.startTime },
      ] as T);
    }

    throw new Error(`Unexpected request type: ${String(req.type)}`);
  }
}

class MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
}

class MockSubscriptionTransport implements ISubscriptionTransport {
  isTestnet = false;
  subscriptions: {
    channel: string;
    payload: unknown;
    listener: (data: CustomEvent<unknown>) => void;
    unsubscribed: boolean;
  }[] = [];

  subscribe<T>(channel: string, payload: unknown, listener: (data: CustomEvent<T>) => void): Promise<ISubscription> {
    const row = {
      channel,
      payload,
      listener: listener as (data: CustomEvent<unknown>) => void,
      unsubscribed: false,
    };
    this.subscriptions.push(row);
    return Promise.resolve({
      failureSignal: new AbortController().signal,
      unsubscribe: () => {
        row.unsubscribed = true;
        return Promise.resolve();
      },
    });
  }

  emit(channel: string, detail: unknown): void {
    for (const row of this.subscriptions) {
      if (!row.unsubscribed && row.channel === channel) {
        row.listener(new CustomEvent(channel, { detail }));
      }
    }
  }
}

function makeDex(name: string): Record<string, unknown> {
  return {
    name,
    fullName: name,
    deployer: "0x0000000000000000000000000000000000000000",
    oracleUpdater: null,
    feeRecipient: null,
    assetToStreamingOiCap: [],
    subDeployers: [],
    deployerFeeScale: "1",
    lastDeployerFeeScaleChangeTime: "2026-01-01T00:00:00",
    assetToFundingMultiplier: [],
    assetToFundingInterestRate: [],
  };
}

function token(name: string, szDecimals: number, index: number): Record<string, unknown> {
  return {
    name,
    szDecimals,
    weiDecimals: 6,
    index,
    tokenId: `0x${String(index).padStart(32, "0")}`,
    isCanonical: true,
    evmContract: null,
    fullName: null,
    deployerTradingFeeShare: "0",
  };
}

function perpCtx(markPx: string, funding: string): Record<string, unknown> {
  return {
    prevDayPx: markPx,
    dayNtlVlm: "1",
    markPx,
    midPx: markPx,
    funding,
    openInterest: "10",
    premium: "0",
    oraclePx: markPx,
    impactPxs: null,
    dayBaseVlm: "1",
  };
}

function clearinghouseState(coin: string, szi: string): Record<string, unknown> {
  return {
    marginSummary: { accountValue: "100", totalNtlPos: "10", totalRawUsd: "100", totalMarginUsed: "1" },
    crossMarginSummary: { accountValue: "100", totalNtlPos: "10", totalRawUsd: "100", totalMarginUsed: "1" },
    crossMaintenanceMarginUsed: "0",
    withdrawable: "99",
    assetPositions: [
      {
        type: "oneWay",
        position: {
          coin,
          szi,
          leverage: { type: "cross", value: 3 },
          entryPx: "10",
          positionValue: "10",
          unrealizedPnl: "1",
          returnOnEquity: "0.1",
          liquidationPx: null,
          marginUsed: "1",
          maxLeverage: 10,
          cumFunding: { allTime: "0", sinceOpen: "0", sinceChange: "0" },
        },
      },
    ],
    time: 1,
  };
}

function countRequests(
  transport: MockInfoTransport,
  predicate: (payload: Record<string, unknown>) => boolean,
): number {
  return transport.requests.filter(predicate).length;
}

Deno.test("HyperliquidMarketCache", async (t) => {
  await t.step("refresh() makes no requests when all caches are disabled", async () => {
    const transport = new MockInfoTransport();
    const cache = new HyperliquidMarketCache({ transport });

    await cache.refresh();

    assertEquals(transport.requests.length, 0);
  });

  await t.step("metadata cache loads main perps, spot, and every builder dex", async () => {
    const transport = new MockInfoTransport();
    const cache = new HyperliquidMarketCache({
      transport,
      dexs: true,
      caches: { metadata: true },
    });

    await cache.refresh();

    assertEquals(countRequests(transport, (p) => p.type === "perpDexs"), 1);
    assertEquals(countRequests(transport, (p) => p.type === "metaAndAssetCtxs" && p.dex === undefined), 1);
    assertEquals(countRequests(transport, (p) => p.type === "metaAndAssetCtxs" && p.dex === "dexA"), 1);
    assertEquals(countRequests(transport, (p) => p.type === "metaAndAssetCtxs" && p.dex === "dexB"), 1);
    assertEquals(countRequests(transport, (p) => p.type === "metaAndAssetCtxs" && p.dex === "dexC"), 1);
    assertEquals(countRequests(transport, (p) => p.type === "spotMetaAndAssetCtxs"), 1);
    assertEquals(cache.getAssetId("BTC"), 0);
    assertEquals(cache.getAssetId("dexA:AAA"), 110000);
    assertEquals(cache.getAssetId("dexB:BBB"), 120000);
    assertEquals(cache.getAssetId("dexB:AAA"), 120001);
    assertEquals(cache.getAssetId("dexC:CCC"), 130000);
  });

  await t.step("selected dex list limits builder dex fetches", async () => {
    const transport = new MockInfoTransport();
    const cache = new HyperliquidMarketCache({
      transport,
      dexs: ["dexB"],
      caches: { metadata: true },
    });

    await cache.refresh();

    assertEquals(countRequests(transport, (p) => p.type === "metaAndAssetCtxs" && p.dex === "dexA"), 0);
    assertEquals(countRequests(transport, (p) => p.type === "metaAndAssetCtxs" && p.dex === "dexB"), 1);
    assertEquals(cache.resolveMarket("dexA:AAA"), undefined);
    assertEquals(cache.getAssetId("dexB:BBB"), 120000);
  });

  await t.step("spot ids resolve to token-derived pairs and do not override perp aliases", async () => {
    const transport = new MockInfoTransport();
    const cache = new HyperliquidMarketCache({ transport, dexs: true, caches: { metadata: true } });

    await cache.refresh();

    const byAtId = cache.resolveMarket("@107");
    const byNumericId = cache.resolveMarket("107");
    const byPair = cache.resolveMarket("BTC/USDC");
    const byAssetId = cache.resolveMarket(10107);

    assertEquals(byAtId?.symbol, "hyperliquid:BTC:USDC:spot");
    assertEquals(byNumericId?.symbol, byAtId?.symbol);
    assertEquals(byPair?.symbol, byAtId?.symbol);
    assertEquals(byAssetId?.symbol, byAtId?.symbol);
    assertEquals(cache.resolveMarket("ETH/USDC")?.symbol, "hyperliquid:ETH:USDC:spot");
    assertEquals(cache.resolveMarket("@108")?.symbol, "hyperliquid:ETH:USDC:spot");
    assertEquals(cache.resolveMarket("JEFF/USDC"), undefined);
    assertEquals(cache.resolveMarket("BTC")?.type, "perp");
    assertEquals(cache.resolveMarket("BTC")?.symbol, "hyperliquid:BTC:USDC:perp");
    assertEquals(cache.resolveMarket("ETH")?.type, "perp");
    assertEquals(cache.resolveMarket("ETH")?.symbol, "hyperliquid:ETH:USDC:perp");
  });

  await t.step("main, builder dex, and spot markets resolve through seamless aliases", async () => {
    const transport = new MockInfoTransport();
    const cache = new HyperliquidMarketCache({ transport, dexs: true, caches: { metadata: true } });

    await cache.refresh();

    const btc = cache.resolveMarket("BTC");
    assertEquals(cache.resolveMarket("BTC-PERP")?.symbol, btc?.symbol);
    assertEquals(cache.resolveMarket("main:BTC")?.symbol, btc?.symbol);
    assertEquals(cache.resolveMarket("main:BTC-PERP")?.symbol, btc?.symbol);
    assertEquals(cache.resolveMarket(0)?.symbol, btc?.symbol);
    assertEquals(cache.getMarketKey("BTC"), "main:BTC");
    assertEquals(cache.getQualifiedName("BTC"), "BTC");

    const mainDuplicate = cache.resolveMarket("AAA");
    assertEquals(mainDuplicate?.symbol, "hyperliquid:AAA:USDC:perp");
    assertEquals(mainDuplicate?.assetId, 2);

    const builder = cache.resolveMarket("dexA:AAA");
    assertEquals(cache.resolveMarket("dexA:AAA-PERP")?.symbol, builder?.symbol);
    assertEquals(cache.resolveMarket("hyperliquid:dexA:AAA:USDC:perp")?.symbol, builder?.symbol);
    assertEquals(cache.resolveMarket(110000)?.symbol, builder?.symbol);
    assertEquals(cache.getCoin("dexA:AAA"), "AAA");
    assertEquals(cache.getMarketKey("dexA:AAA"), "dexA:AAA");
    assertEquals(cache.resolveMarket("dexB:AAA")?.assetId, 120001);
    assertEquals(cache.resolveMarket("dexB:AAA-PERP")?.symbol, "hyperliquid:dexB:AAA:USDC:perp");

    const collateral = cache.resolveMarket("dexC:CCC");
    assertEquals(cache.resolveMarket("dexC:CCC-PERP")?.symbol, collateral?.symbol);
    assertEquals(cache.resolveMarket(130000)?.symbol, collateral?.symbol);
    assertEquals(collateral?.quote, "USDH");
    assertEquals(collateral?.collateralToken, 3);

    const spot = cache.resolveMarket("@107");
    assertEquals(cache.resolveMarket("107")?.symbol, spot?.symbol);
    assertEquals(cache.resolveMarket(10107)?.symbol, spot?.symbol);
    assertEquals(cache.resolveMarket("BTC-SPOT")?.symbol, spot?.symbol);
    assertEquals(cache.resolveMarket("hyperliquid:BTC:USDC:spot")?.symbol, spot?.symbol);
    assertEquals(cache.getMarketKey("@107"), "@107");
    assertEquals(cache.getQualifiedName("@107"), "BTC/USDC");
    assertEquals(cache.resolveMarket(10107)?.symbol, "hyperliquid:BTC:USDC:spot");
    assertEquals(cache.resolveMarket(100052360), undefined);
  });

  await t.step("order precision matches Hyperliquid and Omni order-ticket rules", async () => {
    const transport = new MockInfoTransport();
    const cache = new HyperliquidMarketCache({ transport, dexs: true, caches: { metadata: true } });

    await cache.refresh();

    assertEquals(cache.getOrderPrecision("BTC", 100000), {
      szDecimals: 5,
      sizeDecimals: 5,
      sizeStep: 0.00001,
      priceDecimals: 0,
      maxPriceDecimals: 1,
      priceStep: 1,
      effectivePriceStep: 1,
      marketType: "perp",
      assetId: 0,
      subscriptionKey: "BTC",
      spotPairId: undefined,
    });
    assertEquals(cache.getOrderPrecision("@107", 100000)?.marketType, "spot");
    assertEquals(cache.getOrderPrecision("@107", 100000)?.maxPriceDecimals, 3);
    assertEquals(cache.getOrderPrecision("@107", 100000)?.priceStep, null);
    assertEquals(cache.getOrderPrecision("dexB:BBB", 0.123456)?.assetId, 120000);
    assertEquals(cache.getOrderPrecision("dexB:BBB", 0.123456)?.effectivePriceStep, 0.0001);
    assertEquals(cache.getOrderPrecision("dexC:CCC", 1.23456)?.assetId, 130000);
    assertEquals(cache.getOrderPrecision("dexC:CCC", 1.23456)?.sizeStep, 1);
  });

  await t.step("order-ticket helpers return routing, precision, live data, and submit-safe formatting", async () => {
    const transport = new MockInfoTransport();
    const cache = new HyperliquidMarketCache({ transport, dexs: true, caches: { metadata: true, allMids: true } });

    await cache.refresh();

    const btc = cache.getOrderTicketInfo("BTC", 100000);
    assertEquals(btc?.base, "BTC");
    assertEquals(btc?.coin, "BTC");
    assertEquals(btc?.dex, "main");
    assertEquals(btc?.marketKey, "main:BTC");
    assertEquals(btc?.contextKey, "BTC");
    assertEquals(btc?.assetId, 0);
    assertEquals(btc?.szDecimals, 5);
    assertEquals(btc?.sDecimals, 5);
    assertEquals(btc?.pDecimals, 0);
    assertEquals(btc?.sizeStep, 0.00001);
    assertEquals(btc?.displayPriceStep, 1);
    assertEquals(btc?.effectivePriceStep, 1);
    assertEquals(btc?.effectiveSubmitPriceStep, 1);
    assertEquals(btc?.mid, "100010");
    assertEquals(btc?.fundingRate, "0.0001");
    assertEquals(btc?.maxLeverage, 50);

    const builder = cache.getOrderTicketInfo("dexA:AAA", 12.345);
    assertEquals(builder?.base, "dexA:AAA");
    assertEquals(builder?.coin, "AAA");
    assertEquals(builder?.dex, "dexA");
    assertEquals(builder?.qualifiedName, "dexA:AAA");
    assertEquals(builder?.assetId, 110000);
    assertEquals(builder?.priceStep, 0.001);
    assertEquals(builder?.sizeStep, 0.1);
    assertEquals(builder?.maxLeverage, 3);

    const collateral = cache.getOrderTicketInfo("dexC:CCC", 1.23456);
    assertEquals(collateral?.base, "dexC:CCC");
    assertEquals(collateral?.coin, "CCC");
    assertEquals(collateral?.quote, "USDH");
    assertEquals(collateral?.collateralToken, 3);
    assertEquals(collateral?.assetId, 130000);
    assertEquals(collateral?.sDecimals, 0);
    assertEquals(collateral?.pDecimals, 4);
    assertEquals(collateral?.sizeStep, 1);
    assertEquals(collateral?.displayPriceStep, 0.0001);
    assertEquals(collateral?.effectiveSubmitPriceStep, 0.0001);

    const spot = cache.getOrderTicketInfo("BTC-SPOT", 100000);
    assertEquals(spot?.base, "BTC");
    assertEquals(spot?.coin, "BTC/USDC");
    assertEquals(spot?.type, "spot");
    assertEquals(spot?.marketKey, "@107");
    assertEquals(spot?.spotPairId, "@107");
    assertEquals(spot?.priceStep, null);
    assertEquals(spot?.maxPriceDecimals, 3);

    assertEquals(cache.getBase("dexA:AAA"), "dexA:AAA");
    assertEquals(cache.getQuote("dexA:AAA"), "USDC");
    assertEquals(cache.getDex("dexA:AAA"), "dexA");
    assertEquals(cache.getMarketType("@107"), "spot");
    assertEquals(cache.getLocalAssetIndex("@107"), 107);
    assertEquals(cache.getContextKey("@107"), "@107");
    assertEquals(cache.getMarginTableId("BTC"), 1);

    assertEquals(cache.formatOrderPrice("BTC", "100000.123"), "100000");
    assertEquals(cache.formatOrderSize("BTC", "0.123456789"), "0.12345");
    assertEquals(cache.formatOrderPrice("dexA:AAA", "12.345678"), "12.345");
    assertEquals(cache.formatOrderSize("dexA:AAA", "1.234"), "1.2");
    assertEquals(cache.formatOrderPrice("@107", "100000.123456"), "100000");
    assertEquals(cache.formatOrderSize("@107", "1.123456"), "1.12345");
  });

  await t.step("allMids loads main plus configured dexs and updates records", async () => {
    const transport = new MockInfoTransport();
    const cache = new HyperliquidMarketCache({
      transport,
      dexs: true,
      caches: { metadata: true, allMids: true },
    });

    await cache.refresh();

    assertEquals(countRequests(transport, (p) => p.type === "allMids" && p.dex === undefined), 1);
    assertEquals(countRequests(transport, (p) => p.type === "allMids" && p.dex === "dexA"), 1);
    assertEquals(countRequests(transport, (p) => p.type === "allMids" && p.dex === "dexB"), 1);
    assertEquals(countRequests(transport, (p) => p.type === "allMids" && p.dex === "dexC"), 1);
    assertEquals(cache.getMid("BTC"), "100010");
    assertEquals(cache.getMid("AAA"), "11.2");
    assertEquals(cache.getMid("dexA:AAA"), "12.5");
    assertEquals(cache.getMid("dexB:AAA"), "11.5");
    assertEquals(cache.getMid("dexC:CCC"), "1.25");
    assertEquals(cache.getMid("@107"), "100002");
    assertEquals(cache.getMid("@108"), "3003");
  });

  await t.step("HIP-4 outcome metadata is opt-in and allMids overlays prediction mids", async () => {
    const transport = new MockInfoTransport();
    const cache = new HyperliquidMarketCache({
      transport,
      caches: { outcomeMeta: true, allMids: true },
    });

    await cache.refresh();

    assertEquals(countRequests(transport, (p) => p.type === "outcomeMeta"), 1);
    assertEquals(cache.resolveMarket("#52360"), undefined);
    const yes = cache.resolveOutcomeMarket("#52360");
    assertEquals(yes?.coin, "#52360");
    assertEquals(yes?.encoding, 52360);
    assertEquals(yes?.spotCoin, "#52360");
    assertEquals(yes?.tokenName, "+52360");
    assertEquals(yes?.assetId, 100052360);
    assertEquals(cache.resolveOutcomeMarket("52360")?.coin, yes?.coin);
    assertEquals(cache.resolveOutcomeMarket("+52360")?.coin, yes?.coin);
    assertEquals(cache.resolveOutcomeMarket(100052360)?.coin, yes?.coin);
    assertEquals(cache.resolvePredictionMarket("52360")?.sideName, "Yes");
    assertEquals(cache.resolveOutcomeMarket("#52361")?.sideName, "No");
    assertEquals(cache.resolveOutcomeMarket("#52361")?.encoding, 52361);
    assertEquals(cache.resolveOutcomeMarket("#52361")?.tokenName, "+52361");
    assertEquals(cache.resolveOutcomeMarket("#52361")?.assetId, 100052361);
    assertEquals(cache.resolveOutcomeMarket("#52360")?.outcomeClass, "priceBinary");
    assertEquals(cache.resolveOutcomeMarket("#52360")?.underlying, "BTC");
    assertEquals(cache.resolveOutcomeMarket("#52360")?.expiry, "20260427-0300");
    assertEquals(cache.resolveOutcomeMarket("#52360")?.targetPrice, "77516");
    assertEquals(cache.resolveOutcomeMarket("#52360")?.period, "1d");
    assertEquals(cache.resolveOutcomeMarket("#52360")?.questionId, 1);
    assertEquals(cache.getOutcomeMarkets({ outcomeId: 5236 }).map((row) => row.coin), ["#52360", "#52361"]);
    assertEquals(cache.getOutcomeMarkets({ questionId: 1 }).map((row) => row.coin), ["#52360", "#52361", "#90", "#91"]);
    assertEquals(cache.getOutcomeMarkets({ questionId: 2 }).map((row) => row.coin), ["#770", "#771"]);
    assertEquals(cache.resolveOutcomeMarket("#770")?.isSettled, true);
    assertEquals(cache.resolveOutcomeMarket("#770")?.outcomeClass, "binary");
    assertEquals(cache.resolveOutcomeMarket("#771")?.sideName, "No");
    assertEquals(cache.resolveOutcomeMarket("#772"), undefined);
    assertEquals(cache.getOutcomeMid("#52360"), "0.4");
    assertEquals(cache.getOutcomeMid(52361), "0.6");
    assertEquals(cache.getOutcomeMid("#770"), "0.2");
    assertEquals(cache.getOutcomeAssetId("+52360"), 100052360);
    assertEquals(cache.getOutcomeTokenName(100052360), "+52360");
    assertEquals(cache.getOutcomeEncoding(100052360), 52360);
    assertEquals(cache.getOutcomeOrderInfo("#52360"), {
      coin: "#52360",
      encoding: 52360,
      spotCoin: "#52360",
      tokenName: "+52360",
      assetId: 100052360,
      outcomeId: 5236,
      sideIndex: 0,
      sideName: "Yes",
      outcomeName: "Recurring",
      questionId: 1,
      questionName: "Will BTC close above target?",
      mid: "0.4",
    });
    assertEquals(cache.getOrderPrecision("#52360"), undefined);
  });

  await t.step("outcome mids can arrive before outcome metadata and are applied after discovery", async () => {
    const transport = new MockInfoTransport();
    const cache = new HyperliquidMarketCache({
      transport,
      caches: { outcomeMeta: true, allMids: true },
    });

    await cache.refresh("allMids");
    assertEquals(cache.getOutcomeMid("#52360"), undefined);

    await cache.refresh("outcomeMeta");
    assertEquals(cache.getOutcomeMid("#52360"), "0.4");
    assertEquals(cache.resolveOutcomeMarket(100052360)?.tokenName, "+52360");
  });

  await t.step("live allMids updates HIP-4 outcome mids without creating perp or spot markets", async () => {
    const transport = new MockInfoTransport();
    const cache = new HyperliquidMarketCache({
      transport,
      caches: { outcomeMeta: true },
    });

    await cache.refresh();
    cache.applyAllMids({ "#52360": "0.41", BTC: "100040" });

    assertEquals(cache.getOutcomeMid("#52360"), "0.41");
    assertEquals(cache.resolveMarket("#52360"), undefined);
    assertEquals(cache.resolveMarket(100052360), undefined);
    assertEquals(cache.getMid("BTC"), undefined);
  });

  await t.step("live allMids updates default, spot, and configured builder dex mids", async () => {
    const transport = new MockInfoTransport();
    const subscriptionTransport = new MockSubscriptionTransport();
    const cache = new HyperliquidMarketCache({
      transport,
      subscriptionTransport,
      dexs: true,
      caches: { metadata: true, allMids: true },
    });

    await cache.refresh("metadata");
    await cache.startConfiguredAllMids();
    subscriptionTransport.emit("allMids", { dex: "", mids: { BTC: "100040", "@107": "100041", "@108": "3004" } });
    subscriptionTransport.emit("allMids", { dex: "dexA", mids: { AAA: "13.1" } });
    subscriptionTransport.emit("allMids", { dex: "dexB", mids: { "dexB:BBB": "0.14", AAA: "11.6" } });
    subscriptionTransport.emit("allMids", { dex: "dexC", mids: { CCC: "1.3" } });

    assertEquals(subscriptionTransport.subscriptions.map((row) => row.payload), [
      { type: "allMids", dex: undefined },
      { type: "allMids", dex: "dexA" },
      { type: "allMids", dex: "dexB" },
      { type: "allMids", dex: "dexC" },
    ]);
    assertEquals(cache.getMid("BTC"), "100040");
    assertEquals(cache.getMid("@107"), "100041");
    assertEquals(cache.getMid("@108"), "3004");
    assertEquals(cache.getMid("dexA:AAA"), "13.1");
    assertEquals(cache.getMid("dexB:BBB"), "0.14");
    assertEquals(cache.getMid("dexB:AAA"), "11.6");
    assertEquals(cache.getMid("dexC:CCC"), "1.3");

    await cache.stopAllMids("dexA");
    assertEquals(subscriptionTransport.subscriptions[1].unsubscribed, true);
    await cache.stopAllMids();
    assertEquals(subscriptionTransport.subscriptions[0].unsubscribed, true);
    assertEquals(subscriptionTransport.subscriptions[2].unsubscribed, true);
    assertEquals(subscriptionTransport.subscriptions[3].unsubscribed, true);
  });

  await t.step("context refresh updates funding and market context", async () => {
    const transport = new MockInfoTransport();
    const cache = new HyperliquidMarketCache({ transport, caches: { metadata: true, contexts: true } });

    await cache.refresh("metadata");
    assertEquals(cache.getFundingRate("BTC"), "0.0001");

    transport.mainFunding = "-0.0004";
    transport.mainMid = "100050";
    await cache.refresh("contexts");

    assertEquals(cache.getFundingRate("BTC"), "-0.0004");
    assertEquals(cache.getPerpContext("BTC")?.openInterest, "1000");
    assertEquals(cache.getMid("BTC"), "100050");
  });

  await t.step(
    "allDexsAssetCtxs overlays live main and builder perp contexts without changing spot records",
    async () => {
      const transport = new MockInfoTransport();
      const cache = new HyperliquidMarketCache({ transport, dexs: true, caches: { metadata: true } });

      await cache.refresh("metadata");
      cache.applyAllDexsAssetCtxs({
        ctxs: [
          ["main", [perpCtx("100020", "0.0009")]],
          ["dexA", [perpCtx("12.9", "-0.0007")]],
        ],
      });
      cache.applyAllMids({ dex: "dexA", mids: { AAA: "13.2" } });

      assertEquals(cache.getMid("BTC"), "100020");
      assertEquals(cache.getFundingRate("BTC"), "0.0009");
      assertEquals(cache.getMid("dexA:AAA"), "13.2");
      assertEquals(cache.getFundingRate("dexA:AAA"), "-0.0007");
      assertEquals(cache.getOrderTicketInfo("dexA:AAA", 12.345)?.sizeStep, 0.1);
      assertEquals(cache.getSpotContext("@107")?.markPx, "99999");
      assertEquals(cache.getAllDexsAssetCtxs("dexA")[0].markPx, "12.9");
    },
  );

  await t.step("allDexsAssetCtxs accepts object-map events and marks unmapped rows for metadata refresh", async () => {
    const transport = new MockInfoTransport();
    const cache = new HyperliquidMarketCache({ transport, dexs: true, caches: { metadata: true } });

    await cache.refresh("metadata");
    transport.requests = [];
    cache.applyAllDexsAssetCtxs({
      ctxs: {
        dexB: [perpCtx("0.13", "0.0001"), perpCtx("11.7", "0.0002"), perpCtx("0.2", "0.0003")],
      },
    });
    await Promise.resolve();
    await Promise.resolve();

    assertEquals(cache.getMid("dexB:BBB"), "0.13");
    assertEquals(cache.getMid("dexB:AAA"), "11.7");
    assertEquals(cache.snapshot().needsMetadataRefresh, true);
    assertEquals(cache.snapshot().unmappedAllDexsAssetCtxs[0]?.dex, "dexB");
    assertEquals(cache.snapshot().unmappedAllDexsAssetCtxs[0]?.localAssetIndex, 2);
    assertEquals(countRequests(transport, (p) => p.type === "perpDexs"), 1);
  });

  await t.step("unmapped allDexsAssetCtxs does not trigger REST refresh when metadata cache is disabled", async () => {
    const transport = new MockInfoTransport();
    const cache = new HyperliquidMarketCache({ transport, dexs: true });

    await cache.refresh("metadata");
    transport.requests = [];
    cache.applyAllDexsAssetCtxs({ ctxs: [["dexA", [perpCtx("12.9", "0"), perpCtx("13", "0")]]] });
    await Promise.resolve();

    assertEquals(cache.snapshot().needsMetadataRefresh, true);
    assertEquals(transport.requests.length, 0);
  });

  await t.step("allDexsAssetCtxs subscription starts, applies events, and unsubscribes", async () => {
    const transport = new MockInfoTransport();
    const subscriptionTransport = new MockSubscriptionTransport();
    const cache = new HyperliquidMarketCache({
      transport,
      subscriptionTransport,
      dexs: true,
      caches: { metadata: true, allDexsAssetCtxs: true },
    });

    await cache.refresh("metadata");
    await cache.startAllDexsAssetCtxs();
    subscriptionTransport.emit("allDexsAssetCtxs", { ctxs: [["main", [perpCtx("100030", "0.0003")]]] });

    assertEquals(subscriptionTransport.subscriptions[0].payload, { type: "allDexsAssetCtxs" });
    assertEquals(cache.getMid("BTC"), "100030");

    await cache.stopAllDexsAssetCtxs();
    assertEquals(subscriptionTransport.subscriptions[0].unsubscribed, true);
  });

  await t.step("allDexsClearinghouseState caches states per user and resolves positions to markets", async () => {
    const transport = new MockInfoTransport();
    const cache = new HyperliquidMarketCache({ transport, dexs: true, caches: { metadata: true } });
    const userA = "0x00000000000000000000000000000000000000aa";
    const userB = "0x00000000000000000000000000000000000000bb";

    await cache.refresh("metadata");
    cache.applyAllDexsClearinghouseState({
      user: userA,
      clearinghouseStates: [["dexA", clearinghouseState("AAA", "2")]],
    });
    cache.applyAllDexsClearinghouseState({
      user: userB,
      clearinghouseStates: { main: clearinghouseState("BTC", "0.5") },
    });

    assertEquals(cache.getAllDexsClearinghouseState(userA, "dexA")?.assetPositions.length, 1);
    assertEquals(cache.getUserPosition(userA, "dexA:AAA")?.position.szi, "2");
    assertEquals(cache.getUserPosition(userA, "dexA:AAA")?.market?.assetId, 110000);
    assertEquals(cache.getUserPosition(userB, "BTC")?.position.szi, "0.5");
    assertEquals(cache.getUserPosition(userA, "BTC"), undefined);
  });

  await t.step("allDexsClearinghouseState subscription is user scoped and volatile by default", async () => {
    const storage = new MemoryStorage();
    const transport = new MockInfoTransport();
    const subscriptionTransport = new MockSubscriptionTransport();
    const user = "0x00000000000000000000000000000000000000aa";
    const cache = new HyperliquidMarketCache({
      transport,
      subscriptionTransport,
      dexs: true,
      storage,
      caches: { metadata: true, allDexsClearinghouseState: true },
    });

    await cache.refresh("metadata");
    await cache.startAllDexsClearinghouseState(user);
    subscriptionTransport.emit("allDexsClearinghouseState", {
      user,
      clearinghouseStates: [["dexA", clearinghouseState("AAA", "3")]],
    });

    assertEquals(cache.getUserPosition(user, "dexA:AAA")?.position.szi, "3");
    await cache.stopAllDexsClearinghouseState(user);
    assertEquals(subscriptionTransport.subscriptions[0].unsubscribed, true);

    const hydrated = new HyperliquidMarketCache({ transport, dexs: true, storage });
    hydrated.hydrate();
    assertEquals(hydrated.getAllDexsClearinghouseState(user), undefined);
  });

  await t.step("funding history is cached by full request parameters", async () => {
    const transport = new MockInfoTransport();
    const cache = new HyperliquidMarketCache({
      transport,
      caches: { fundingHistory: { enabled: true, ttlMs: 60_000 } },
    });

    await cache.getFundingHistory({ coin: "BTC", startTime: 1, endTime: 2 });
    await cache.getFundingHistory({ coin: "BTC", startTime: 1, endTime: 2 });
    await cache.getFundingHistory({ coin: "BTC", startTime: 1, endTime: 3 });

    assertEquals(countRequests(transport, (p) => p.type === "fundingHistory"), 2);
  });

  await t.step("localStorage-style persistence is opt-in and skips volatile groups by default", async () => {
    const storage = new MemoryStorage();
    const transport = new MockInfoTransport();
    const cache = new HyperliquidMarketCache({
      transport,
      dexs: true,
      storage,
      caches: { metadata: true, allMids: true },
    });

    await cache.refresh();

    const hydrated = new HyperliquidMarketCache({ transport, dexs: true, storage });
    hydrated.hydrate();

    assertEquals(hydrated.getAssetId("dexA:AAA"), 110000);
    assertEquals(hydrated.getAllMids(), undefined);
    assertEquals(hydrated.getMid("BTC"), "100000");
  });

  await t.step("outcome metadata persists without volatile mids unless allMids persistence is enabled", async () => {
    const storage = new MemoryStorage();
    const transport = new MockInfoTransport();
    const cache = new HyperliquidMarketCache({
      transport,
      storage,
      caches: { outcomeMeta: true, allMids: true },
    });

    await cache.refresh();

    const hydrated = new HyperliquidMarketCache({ transport, storage });
    hydrated.hydrate();
    assertEquals(hydrated.resolveOutcomeMarket(100052360)?.assetId, 100052360);
    assertEquals(hydrated.getOutcomeMid("#52360"), undefined);

    const persistentStorage = new MemoryStorage();
    const persistent = new HyperliquidMarketCache({
      transport,
      storage: persistentStorage,
      caches: {
        outcomeMeta: true,
        allMids: { enabled: true, persist: true },
      },
    });
    await persistent.refresh();

    const persistentHydrated = new HyperliquidMarketCache({ transport, storage: persistentStorage });
    persistentHydrated.hydrate();
    assertEquals(persistentHydrated.getOutcomeMid("#52360"), "0.4");
  });

  await t.step("hydrate rebuilds outcome alias maps from older persisted outcome metadata snapshots", () => {
    const storage = new MemoryStorage();
    const transport = new MockInfoTransport();
    storage.setItem(
      "old-outcomes",
      JSON.stringify({
        version: 1,
        snapshot: {
          loadedAt: 1,
          updatedAt: { outcomeMeta: 1 },
          rawOutcomeMeta: {
            outcomes: [
              {
                outcome: 5236,
                name: "Recurring",
                description: "class:priceBinary|underlying:BTC",
                sideSpecs: [{ name: "Yes" }, { name: "No" }],
              },
            ],
            questions: [],
          },
          outcomeMarketsByCoin: {},
          outcomeMarketsByOutcome: {},
          outcomeMarketsByQuestion: {},
        },
      }),
    );
    const cache = new HyperliquidMarketCache({ transport, storage, storageKey: "old-outcomes" });

    cache.hydrate();

    assertEquals(cache.resolveOutcomeMarket("#52360")?.assetId, 100052360);
    assertEquals(cache.resolveOutcomeMarket("+52360")?.coin, "#52360");
    assertEquals(cache.resolveOutcomeMarket(100052360)?.encoding, 52360);
  });

  await t.step("metadata, contexts, and allMids persistence hydrate with configured volatility", async () => {
    const storage = new MemoryStorage();
    const transport = new MockInfoTransport();
    const cache = new HyperliquidMarketCache({
      transport,
      dexs: true,
      storage,
      caches: {
        metadata: true,
        contexts: { enabled: true, persist: true },
        allMids: { enabled: true, persist: true },
      },
    });

    await cache.refresh();

    const hydrated = new HyperliquidMarketCache({ transport, dexs: true, storage });
    hydrated.hydrate();
    assertEquals(hydrated.getAssetId("dexB:AAA"), 120001);
    assertEquals(hydrated.getPerpContext("dexA:AAA")?.openInterest, "100");
    assertEquals(hydrated.getAllMids("dexB")?.AAA, "11.5");
    assertEquals(hydrated.getMid("dexB:AAA"), "11.5");
  });
});
