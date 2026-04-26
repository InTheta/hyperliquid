# Utilities

Helper functions for formatting orders and resolving asset symbols, imported from `@nktkas/hyperliquid/utils`.

## Format prices

`formatPrice` truncates a price to the Hyperliquid
[tick size](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/tick-and-lot-size) precision.

```ts
import { formatPrice } from "@nktkas/hyperliquid/utils";

formatPrice("97123.456789", 0); // "97123"
formatPrice("1.23456789", 5); // "1.2"
formatPrice("0.0000123456789", 0, "spot"); // "0.00001234"
```

## Format sizes

`formatSize` truncates a size to the asset
[lot size](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/tick-and-lot-size) precision.

```ts
import { formatSize } from "@nktkas/hyperliquid/utils";

formatSize("1.23456789", 5); // "1.23456"
formatSize("0.123456789", 2); // "0.12"
formatSize("100", 0); // "100"
```

## Resolve symbols

`SymbolConverter` maps human-readable symbols to Hyperliquid
[asset IDs](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/asset-ids) and formatting metadata. It
fetches data from the API on creation.

```ts
import { HttpTransport } from "@nktkas/hyperliquid";
import { SymbolConverter } from "@nktkas/hyperliquid/utils";

const transport = new HttpTransport();
const converter = await SymbolConverter.create({ transport });
```

### Asset IDs

`getAssetId` returns the numeric ID used in order parameters:

```ts
converter.getAssetId("BTC"); // 0
converter.getAssetId("HYPE/USDC"); // 10107
```

Perpetuals use the coin name. Spot markets use `"BASE/QUOTE"` format. Returns `undefined` if the symbol is not found.

### Size decimals

`getSzDecimals` returns the lot size precision for an asset:

```ts
converter.getSzDecimals("BTC"); // 5
converter.getSzDecimals("HYPE/USDC"); // 2
```

### Spot pair IDs

`getSpotPairId` returns the identifier used in info requests and subscriptions for spot markets:

```ts
converter.getSpotPairId("HYPE/USDC"); // "@107"
converter.getSpotPairId("PURR/USDC"); // "PURR/USDC"
```

### Symbol from spot pair ID

`getSymbolBySpotPairId` resolves a spot pair ID back to its `"BASE/QUOTE"` symbol:

```ts
converter.getSymbolBySpotPairId("@107"); // "HYPE/USDC"
converter.getSymbolBySpotPairId("PURR/USDC"); // "PURR/USDC"
```

### Refresh data

Call `reload` or `refreshNow` to update the symbol mappings when new assets are listed:

```ts
await converter.reload();
await converter.refreshNow();
```

Automatic refresh is disabled by default. Enable it on creation or at runtime when you want the converter to keep its
configured market universe current:

```ts
const converter = await SymbolConverter.create({
  transport,
  autoRefresh: true,
  refreshIntervalMs: 300_000,
});

converter.setAutoRefreshInterval(60_000);
converter.stopAutoRefresh();
converter.startAutoRefresh();
```

### Builder DEX support

Pass `dexs` to include assets from
[builder DEXs](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-3-builder-deployed-perpetuals):

```ts
const converter = await SymbolConverter.create({
  transport,
  dexs: true, // all DEXs
});
```

```ts
const converter = await SymbolConverter.create({
  transport,
  dexs: ["test", "other"], // specific DEXs
});
```

Every manual or automatic refresh uses the same `dexs` setting. With `dexs: true`, refreshes reload default perpetuals,
spot markets, and every builder DEX returned by Hyperliquid. With `dexs: ["test"]`, refreshes only reload the specified
builder DEXs.

Builder DEX assets use `"DEX:ASSET"` format:

```ts
converter.getAssetId("test:ABC"); // 110000
converter.getSzDecimals("test:ABC"); // 0
```

## Cache market metadata and order precision

`HyperliquidMarketCache` is an opt-in cache for browser and server apps that need repeated access to Hyperliquid
metadata, asset contexts, mids, funding, asset IDs, and order-ticket precision.

No cache group is enabled by default, and the cache is memory-only unless you provide storage:

```ts
import { HttpTransport } from "@nktkas/hyperliquid";
import { HyperliquidMarketCache } from "@nktkas/hyperliquid/utils";

const transport = new HttpTransport({ rateLimit: true });
const cache = new HyperliquidMarketCache({
  transport,
  dexs: true,
  caches: {
    metadata: { enabled: true, ttlMs: 300_000 },
    contexts: { enabled: true, ttlMs: 5_000 },
    allMids: { enabled: true, ttlMs: 1_000 },
  },
});

await cache.refresh();
```

With `dexs: true`, metadata refresh loads default perpetuals, spot markets, and every builder DEX returned by
`perpDexs()`. With `dexs: ["test"]`, it loads only those builder DEXs plus the default perpetual universe.

### Browser persistence

Pass `storage: "localStorage"` to persist cache data in a browser. Metadata is allowed to persist by default; volatile
groups such as `allMids`, contexts, and funding are not persisted unless their policy sets `persist: true`.

```ts
const cache = new HyperliquidMarketCache({
  transport,
  dexs: true,
  storage: "localStorage",
  caches: {
    metadata: true,
    allMids: { enabled: true, persist: false },
  },
});

cache.hydrate();
await cache.refresh();
```

### Resolve spot IDs and builder DEX assets

Spot markets are indexed from `spotMeta.tokens` and `spotMeta.universe[*].tokens`, so pair display names do not depend
on the raw exchange market name. A spot ID such as `"@107"` resolves to the token-derived pair:

```ts
const spot = cache.resolveMarket("@107");

spot?.symbol; // "hyperliquid:HYPE:USDC:spot"
spot?.spotPairId; // "@107"
spot?.assetId; // 10107
```

Builder DEX perps use qualified names and global HIP-3 asset IDs:

```ts
const market = cache.resolveMarket("test:ABC");

market?.assetId; // 110000
market?.subscriptionKey; // "test:ABC"
```

The cache accepts the common main, builder DEX, and spot aliases through the same resolver:

```ts
cache.resolveMarket("BTC");
cache.resolveMarket("BTC-PERP");
cache.resolveMarket("main:BTC");

cache.resolveMarket("test:ABC");
cache.resolveMarket("test:ABC-PERP");

cache.resolveMarket("@107");
cache.resolveMarket("107");
cache.resolveMarket("HYPE/USDC");
cache.resolveMarket("HYPE-SPOT");
```

Bare coin aliases prefer default perpetual markets over spot markets. Use the pair, `BASE-SPOT`, or spot `@id` when you
need the spot market explicitly.

### Order-ticket precision

Use `getOrderPrecision()` for limit, market, scale, and TWAP order inputs. It returns the size decimals, step
increments, price decimal limits, effective submit price step, routing asset ID, and spot `@id` when applicable.

```ts
const precision = cache.getOrderPrecision("BTC", 97_123.45);

precision?.assetId; // 0
precision?.szDecimals; // size decimals from Hyperliquid metadata
precision?.sizeStep; // 10 ** -szDecimals
precision?.maxPriceDecimals; // 6 - szDecimals for perps, 8 - szDecimals for spot
precision?.effectivePriceStep; // derived from the reference price and 5 significant-figure rule
```

For spot markets, `priceStep` remains `null` unless Hyperliquid provides a real fixed tick. Prices should still be
normalized with the returned `priceDecimals`, `maxPriceDecimals`, and the 5 significant-figure rule.

Use `getOrderTicketInfo()` when an order ticket needs the full routing and display bundle:

```ts
const ticket = cache.getOrderTicketInfo("test:ABC", 12.345);

ticket?.assetId; // HIP-3 global asset ID
ticket?.coin; // "ABC"
ticket?.qualifiedName; // "test:ABC"
ticket?.marketKey; // "test:ABC"
ticket?.contextKey; // "test:ABC"
ticket?.sizeStep;
ticket?.effectivePriceStep;
ticket?.mid;
ticket?.fundingRate;
ticket?.maxLeverage;
```

For submit values, `formatOrderPrice()` and `formatOrderSize()` use the SDK's existing submit-safe truncation helpers.
They produce values that satisfy Hyperliquid's accepted tick and lot-size constraints: max 5 significant price figures,
`6 - szDecimals` price decimals for perps, `8 - szDecimals` for spot, and `szDecimals` size decimals.

```ts
cache.formatOrderPrice("BTC", "97123.456789");
cache.formatOrderSize("BTC", "0.00123456789");
```

See Hyperliquid's official docs for
[asset IDs](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/asset-ids) and
[tick and lot size](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/tick-and-lot-size).

### Runtime control

```ts
await cache.refresh("metadata");
await cache.refresh(["contexts", "allMids"]);

cache.startAutoRefresh(["contexts", "allMids"]);
cache.stopAutoRefresh("allMids");

cache.clear("fundingHistory");
```

Current funding is read from perpetual asset contexts:

```ts
cache.getFundingRate("BTC");
```

Historical funding is cached by the full request parameters:

```ts
await cache.getFundingHistory({
  coin: "BTC",
  startTime: Date.now() - 24 * 60 * 60 * 1000,
  endTime: Date.now(),
});
```

### HIP-4 outcome and prediction markets

The SDK already exposes the raw `outcomeMeta()` info endpoint. `HyperliquidMarketCache` adds an opt-in cache layer for
apps that want to display HIP-4 outcome markets alongside perps and spot markets:

```ts
const cache = new HyperliquidMarketCache({
  transport,
  caches: {
    outcomeMeta: true,
    allMids: true,
  },
});

await cache.refresh();

const yes = cache.resolveOutcomeMarket("#52360");

yes?.encoding; // 52360 = 10 * outcomeId + sideIndex
yes?.spotCoin; // "#52360"
yes?.tokenName; // "+52360"
yes?.assetId; // 100052360 = 100_000_000 + encoding
yes?.outcomeName; // "Recurring"
yes?.sideName; // "Yes"
yes?.outcomeClass; // "priceBinary" when encoded in the description
yes?.underlying; // "BTC" when encoded in the description
yes?.expiry;
yes?.targetPrice;
yes?.mid; // overlaid from allMids when available
```

`outcomeMeta` is discovery metadata for HIP-4 outcomes/questions. The `allMids` feed can include `#...` outcome leg
mids, and the cache overlays those onto outcome records. Outcome records are intentionally separate from
`resolveMarket()` and order-ticket precision because HIP-4 testnet outcomes are not represented in the normal perp/spot
metadata maps.

Outcome routing identifiers follow Hyperliquid's official asset ID rules: `encoding = 10 * outcome + side`, spot coin
`#<encoding>`, token name `+<encoding>`, and order/cancel asset ID `100_000_000 + encoding`. The cache resolves all of
those forms:

```ts
cache.resolveOutcomeMarket("#52360");
cache.resolveOutcomeMarket("+52360");
cache.resolveOutcomeMarket(52360);
cache.resolveOutcomeMarket(100052360);

cache.getOutcomeAssetId("#52360"); // 100052360
cache.getOutcomeTokenName("#52360"); // "+52360"
cache.getOutcomeEncoding(100052360); // 52360
cache.getOutcomeOrderInfo("#52360"); // routing identifiers plus latest cached mid
```

For prediction-market naming, `resolvePredictionMarket()` is an alias of `resolveOutcomeMarket()`:

```ts
cache.resolvePredictionMarket(52360);
cache.getOutcomeMarkets({ questionId: 1 });
cache.getOutcomeMid("#52360");
```

Outcome trading is still live-evolving. The cache exposes routing metadata and mids for outcomes, but does not invent
price or lot-size precision for outcome orders until Hyperliquid exposes stable metadata for that path. See the official
[asset IDs](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/asset-ids) and
[tick and lot size](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/tick-and-lot-size) docs.

### Live all-DEX streams

REST metadata refresh remains the source of truth for symbols, spot `@id` mappings, precision, max leverage, and builder
DEX asset IDs. The `allDexsAssetCtxs` WebSocket stream is a live overlay for perpetual asset contexts across all DEXs;
it does not include spot markets or enough metadata to create new symbol records by itself.

Pass a subscription transport to let the cache own live subscriptions:

```ts
import { HttpTransport, WebSocketTransport } from "@nktkas/hyperliquid";
import { HyperliquidMarketCache } from "@nktkas/hyperliquid/utils";

const cache = new HyperliquidMarketCache({
  transport: new HttpTransport({ rateLimit: true }),
  subscriptionTransport: new WebSocketTransport(),
  dexs: true,
  caches: {
    metadata: true,
    allDexsAssetCtxs: true,
  },
});

await cache.refresh("metadata");
await cache.startConfiguredAllMids(); // default DEX, spot mids, and configured builder DEX mids
await cache.startAllDexsAssetCtxs();

cache.getMid("BTC"); // latest live mid when available
cache.getMid("@107"); // spot mids come from the default allMids feed
cache.getPerpContext("BTC"); // latest live context when available
cache.getPerpContext("test:ABC"); // builder DEX context
cache.getSpotContext("@107"); // still comes from spotMetaAndAssetCtxs()
```

Use `startAllMids("test")` to subscribe to a single builder DEX, or omit the DEX for the default feed. Hyperliquid's
default `allMids` feed is the one that includes spot mids; builder DEX feeds contain only that DEX's perp mids.

If an `allDexsAssetCtxs` row cannot be mapped to existing metadata by DEX and local asset index, the cache marks
`snapshot().needsMetadataRefresh`. When the metadata cache is enabled, it also attempts a throttled REST metadata
refresh so new builder DEX symbols can be discovered through the normal metadata path.

`allDexsClearinghouseState` is user-specific account state across DEXs. It is stored separately from global market
metadata and is not persisted by default:

```ts
await cache.startAllDexsClearinghouseState("0x...");

const state = cache.getAllDexsClearinghouseState("0x...", "test");
const positions = cache.getUserPositions("0x...", "test");
const position = cache.getUserPosition("0x...", "test:ABC");

position?.market?.assetId; // resolved from cached metadata
position?.position.szi; // live user position size
```

To use Deno locally, install it with:

```sh
curl -fsSL https://deno.land/install.sh | sh
export DENO_INSTALL="$HOME/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"
```

For a temporary non-global binary, download the Linux release zip from Deno releases, extract it with `bsdtar`, and run
that `deno` binary directly.

Applications like Omni Terminal can use `getOrderPrecision()`, `resolveMarket()`, and the symbol lookup maps to replace
local order-ticket precision and asset-ID fallback logic once this SDK branch is adopted.

## Format and place an order

```ts
import { ExchangeClient, HttpTransport } from "@nktkas/hyperliquid";
import { formatPrice, formatSize, SymbolConverter } from "@nktkas/hyperliquid/utils";
import { privateKeyToAccount } from "viem/accounts";

const wallet = privateKeyToAccount("0x...");

const transport = new HttpTransport();
const converter = await SymbolConverter.create({ transport });
const client = new ExchangeClient({ transport, wallet });

// Parameters
const coin = "BTC";
const price = "97123.456789";
const size = "0.00123456789";
const isBuy = true;

// ! asserts the symbol exists - handle undefined in production
const assetId = converter.getAssetId(coin)!;
const szDecimals = converter.getSzDecimals(coin)!;

await client.order({
  orders: [{
    a: assetId, // asset index
    b: isBuy, // buy
    p: formatPrice(price, szDecimals), // price
    s: formatSize(size, szDecimals), // size
    r: false, // not reduce-only
    t: { limit: { tif: "Gtc" } }, // Good-Til-Cancelled
  }],
  grouping: "na",
});
```
