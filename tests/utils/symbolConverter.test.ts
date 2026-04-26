// deno-lint-ignore-file no-import-prefix

import { assertEquals } from "jsr:@std/assert@1";
import { HttpTransport, type IRequestTransport } from "@nktkas/hyperliquid";
import { SymbolConverter } from "@nktkas/hyperliquid/utils";

// ============================================================
// Test Data
// ============================================================

const PERP_EXPECTATIONS = {
  BTC: { assetId: 0, szDecimals: 5 },
  ETH: { assetId: 1, szDecimals: 4 },
} as const;

const SPOT_EXPECTATIONS = {
  "PURR/USDC": { assetId: 10000, szDecimals: 0, pairId: "PURR/USDC" },
  "HYPE/USDC": { assetId: 10107, szDecimals: 2, pairId: "@107" },
} as const;

const DEX_EXPECTATIONS = {
  "dexA:AAA": { assetId: 110000 },
  "dexB:BBB": { assetId: 120000 },
  "dexC:CCC": { assetId: 130000 },
} as const;

// ============================================================
// Helpers
// ============================================================

class MockInfoTransport implements IRequestTransport {
  isTestnet = false;
  requests: unknown[] = [];

  request<T>(endpoint: "info" | "exchange" | "explorer", payload: unknown): Promise<T> {
    if (endpoint !== "info") throw new Error(`Unexpected endpoint: ${endpoint}`);
    if (!isRecord(payload)) throw new Error("Unexpected payload");

    this.requests.push(payload);

    if (payload.type === "meta" && payload.dex === "dexA") {
      return Promise.resolve({
        universe: [{ name: "dexA:AAA", szDecimals: 1, maxLeverage: 3, marginTableId: 1 }],
        marginTables: [],
        collateralToken: 0,
      } as T);
    }
    if (payload.type === "meta" && payload.dex === "dexB") {
      return Promise.resolve({
        universe: [{ name: "dexB:BBB", szDecimals: 2, maxLeverage: 3, marginTableId: 1 }],
        marginTables: [],
        collateralToken: 0,
      } as T);
    }
    if (payload.type === "meta" && payload.dex === "dexC") {
      return Promise.resolve({
        universe: [{ name: "CCC", szDecimals: 0, maxLeverage: 2, marginTableId: 2 }],
        marginTables: [],
        collateralToken: 1,
      } as T);
    }
    if (payload.type === "meta") {
      return Promise.resolve({
        universe: [{ name: "BTC", szDecimals: 5, maxLeverage: 50, marginTableId: 1 }],
        marginTables: [],
        collateralToken: 0,
      } as T);
    }
    if (payload.type === "spotMeta") {
      return Promise.resolve({
        tokens: [
          {
            name: "AAA",
            szDecimals: 2,
            weiDecimals: 6,
            index: 0,
            tokenId: "0x00000000000000000000000000000000",
            isCanonical: true,
            evmContract: null,
            fullName: null,
            deployerTradingFeeShare: "0",
          },
          {
            name: "USDC",
            szDecimals: 6,
            weiDecimals: 6,
            index: 1,
            tokenId: "0x00000000000000000000000000000001",
            isCanonical: true,
            evmContract: null,
            fullName: null,
            deployerTradingFeeShare: "0",
          },
        ],
        universe: [{ tokens: [0, 1], name: "@1", index: 1, isCanonical: true }],
      } as T);
    }
    if (payload.type === "perpDexs") {
      return Promise.resolve([
        null,
        makeDex("dexA"),
        makeDex("dexB"),
        makeDex("dexC"),
      ] as T);
    }

    throw new Error(`Unexpected request type: ${payload.type}`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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

function countRequests(
  requests: unknown[],
  predicate: (payload: Record<string, unknown>) => boolean,
): number {
  return requests.filter((payload) => isRecord(payload) && predicate(payload)).length;
}

// ============================================================
// Tests
// ============================================================

Deno.test("SymbolConverter", async (t) => {
  const transport = new HttpTransport({ rateLimit: true });
  const converter = await SymbolConverter.create({ transport });

  await t.step("getAssetId()", async (t) => {
    await t.step("perpetuals", () => {
      assertEquals(converter.getAssetId("BTC"), PERP_EXPECTATIONS.BTC.assetId);
      assertEquals(converter.getAssetId("BTC-PERP"), PERP_EXPECTATIONS.BTC.assetId);
      assertEquals(converter.getAssetId("main:BTC"), PERP_EXPECTATIONS.BTC.assetId);
      assertEquals(converter.getAssetId("main:BTC-PERP"), PERP_EXPECTATIONS.BTC.assetId);
      assertEquals(converter.getAssetId("ETH"), PERP_EXPECTATIONS.ETH.assetId);
    });

    await t.step("spot", () => {
      assertEquals(converter.getAssetId("PURR/USDC"), SPOT_EXPECTATIONS["PURR/USDC"].assetId);
      assertEquals(converter.getAssetId("HYPE/USDC"), SPOT_EXPECTATIONS["HYPE/USDC"].assetId);
      assertEquals(converter.getAssetId("HYPE-SPOT"), SPOT_EXPECTATIONS["HYPE/USDC"].assetId);
      assertEquals(converter.getAssetId("@107"), SPOT_EXPECTATIONS["HYPE/USDC"].assetId);
      assertEquals(converter.getAssetId("107"), SPOT_EXPECTATIONS["HYPE/USDC"].assetId);
    });

    await t.step("non-existent returns undefined", () => {
      assertEquals(converter.getAssetId("NONEXISTENT"), undefined);
      assertEquals(converter.getAssetId("NONE/EXISTENT"), undefined);
    });
  });

  await t.step("getSzDecimals()", async (t) => {
    await t.step("perpetuals", () => {
      assertEquals(converter.getSzDecimals("BTC"), PERP_EXPECTATIONS.BTC.szDecimals);
      assertEquals(converter.getSzDecimals("BTC-PERP"), PERP_EXPECTATIONS.BTC.szDecimals);
      assertEquals(converter.getSzDecimals("main:BTC"), PERP_EXPECTATIONS.BTC.szDecimals);
      assertEquals(converter.getSzDecimals("ETH"), PERP_EXPECTATIONS.ETH.szDecimals);
    });

    await t.step("spot", () => {
      assertEquals(converter.getSzDecimals("PURR/USDC"), SPOT_EXPECTATIONS["PURR/USDC"].szDecimals);
      assertEquals(converter.getSzDecimals("HYPE/USDC"), SPOT_EXPECTATIONS["HYPE/USDC"].szDecimals);
      assertEquals(converter.getSzDecimals("HYPE-SPOT"), SPOT_EXPECTATIONS["HYPE/USDC"].szDecimals);
      assertEquals(converter.getSzDecimals("@107"), SPOT_EXPECTATIONS["HYPE/USDC"].szDecimals);
    });

    await t.step("non-existent returns undefined", () => {
      assertEquals(converter.getSzDecimals("NONEXISTENT"), undefined);
      assertEquals(converter.getSzDecimals("NONE/EXISTENT"), undefined);
    });
  });

  await t.step("getSpotPairId()", async (t) => {
    await t.step("existing pair", () => {
      assertEquals(converter.getSpotPairId("PURR/USDC"), SPOT_EXPECTATIONS["PURR/USDC"].pairId);
      assertEquals(converter.getSpotPairId("HYPE/USDC"), SPOT_EXPECTATIONS["HYPE/USDC"].pairId);
      assertEquals(converter.getSpotPairId("HYPE-SPOT"), SPOT_EXPECTATIONS["HYPE/USDC"].pairId);
      assertEquals(converter.getSpotPairId("107"), SPOT_EXPECTATIONS["HYPE/USDC"].pairId);
    });

    await t.step("non-existent returns undefined", () => {
      assertEquals(converter.getSpotPairId("NONE/EXISTENT"), undefined);
      assertEquals(converter.getSpotPairId("BTC"), undefined);
    });
  });

  await t.step("getSymbolBySpotPairId()", async (t) => {
    await t.step("existing pair id", () => {
      assertEquals(converter.getSymbolBySpotPairId(SPOT_EXPECTATIONS["PURR/USDC"].pairId), "PURR/USDC");
      assertEquals(converter.getSymbolBySpotPairId(SPOT_EXPECTATIONS["HYPE/USDC"].pairId), "HYPE/USDC");
      assertEquals(converter.getSymbolBySpotPairId("107"), "HYPE/USDC");
    });

    await t.step("non-existent returns undefined", () => {
      assertEquals(converter.getSymbolBySpotPairId("@999999"), undefined);
      assertEquals(converter.getSymbolBySpotPairId("NONEXISTENT"), undefined);
    });
  });

  await t.step("reload()", async () => {
    const freshConverter = new SymbolConverter({ transport });

    // Before reload, mappings are empty
    const before = freshConverter.getAssetId("BTC");
    assertEquals(before, undefined);

    // After reload, mappings are populated
    await freshConverter.reload();
    const after = freshConverter.getAssetId("BTC");
    assertEquals(after, PERP_EXPECTATIONS.BTC.assetId);
  });

  await t.step("create({ dexs })", async (t) => {
    await t.step("dexs: false excludes all dexs", async () => {
      const conv = await SymbolConverter.create({ transport: new MockInfoTransport(), dexs: false });

      assertEquals(conv.getAssetId("dexA:AAA"), undefined);
      assertEquals(conv.getAssetId("dexB:BBB"), undefined);
      assertEquals(conv.getAssetId("dexC:CCC"), undefined);
    });

    await t.step("dexs: [] excludes all dexs", async () => {
      const conv = await SymbolConverter.create({ transport: new MockInfoTransport(), dexs: [] });

      assertEquals(conv.getAssetId("dexA:AAA"), undefined);
      assertEquals(conv.getAssetId("dexB:BBB"), undefined);
      assertEquals(conv.getAssetId("dexC:CCC"), undefined);
    });

    await t.step("dexs: [specific] includes only specified", async () => {
      const conv = await SymbolConverter.create({ transport: new MockInfoTransport(), dexs: ["dexB"] });

      assertEquals(conv.getAssetId("dexA:AAA"), undefined);
      assertEquals(conv.getAssetId("dexB:BBB"), DEX_EXPECTATIONS["dexB:BBB"].assetId);
      assertEquals(conv.getAssetId("dexC:CCC"), undefined);
    });

    await t.step("dexs: true includes all dexs", async () => {
      const conv = await SymbolConverter.create({ transport: new MockInfoTransport(), dexs: true });

      assertEquals(conv.getAssetId("dexA:AAA"), DEX_EXPECTATIONS["dexA:AAA"].assetId);
      assertEquals(conv.getAssetId("dexB:BBB"), DEX_EXPECTATIONS["dexB:BBB"].assetId);
      assertEquals(conv.getAssetId("dexC:CCC"), DEX_EXPECTATIONS["dexC:CCC"].assetId);
    });
  });

  await t.step("auto refresh controls", async () => {
    const mockTransport = new MockInfoTransport();
    const conv = new SymbolConverter({ transport: mockTransport });

    assertEquals(conv.isAutoRefreshEnabled(), false);

    conv.startAutoRefresh(50);
    assertEquals(conv.isAutoRefreshEnabled(), true);

    conv.setAutoRefreshInterval(100);
    assertEquals(conv.isAutoRefreshEnabled(), true);

    conv.stopAutoRefresh();
    assertEquals(conv.isAutoRefreshEnabled(), false);

    const autoConv = await SymbolConverter.create({
      transport: mockTransport,
      autoRefresh: true,
      refreshIntervalMs: 1_000,
    });
    assertEquals(autoConv.isAutoRefreshEnabled(), true);
    autoConv.stopAutoRefresh();
  });

  await t.step("refreshNow() with dexs: true reloads every builder dex", async () => {
    const mockTransport = new MockInfoTransport();
    const conv = await SymbolConverter.create({ transport: mockTransport, dexs: true });

    assertEquals(conv.getAssetId("BTC"), 0);
    assertEquals(conv.getAssetId("BTC-PERP"), 0);
    assertEquals(conv.getAssetId("main:BTC"), 0);
    assertEquals(conv.getAssetId("AAA/USDC"), 10001);
    assertEquals(conv.getAssetId("AAA-SPOT"), 10001);
    assertEquals(conv.getAssetId("@1"), 10001);
    assertEquals(conv.getAssetId("1"), 10001);
    assertEquals(conv.getSzDecimals("@1"), 2);
    assertEquals(conv.getAssetId("dexA:AAA"), 110000);
    assertEquals(conv.getAssetId("dexA:AAA-PERP"), 110000);
    assertEquals(conv.getAssetId("dexB:BBB"), 120000);
    assertEquals(conv.getAssetId("dexB:BBB-PERP"), 120000);
    assertEquals(conv.getAssetId("dexC:CCC"), DEX_EXPECTATIONS["dexC:CCC"].assetId);
    assertEquals(conv.getAssetId("dexC:CCC-PERP"), DEX_EXPECTATIONS["dexC:CCC"].assetId);
    assertEquals(conv.getSzDecimals("dexC:CCC"), 0);
    assertEquals(
      countRequests(mockTransport.requests, (payload) => payload.type === "meta" && payload.dex === "dexA"),
      1,
    );
    assertEquals(
      countRequests(mockTransport.requests, (payload) => payload.type === "meta" && payload.dex === "dexB"),
      1,
    );
    assertEquals(
      countRequests(mockTransport.requests, (payload) => payload.type === "meta" && payload.dex === "dexC"),
      1,
    );

    await conv.refreshNow();

    assertEquals(
      countRequests(mockTransport.requests, (payload) => payload.type === "meta" && payload.dex === "dexA"),
      2,
    );
    assertEquals(
      countRequests(mockTransport.requests, (payload) => payload.type === "meta" && payload.dex === "dexB"),
      2,
    );
    assertEquals(
      countRequests(mockTransport.requests, (payload) => payload.type === "meta" && payload.dex === "dexC"),
      2,
    );
  });
});
