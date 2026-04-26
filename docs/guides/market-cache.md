# Market cache examples

`HyperliquidMarketCache` is useful when an app needs one normalized lookup layer for default perps, builder DEX perps,
spot pairs, live mids, live contexts, funding, and HIP-4 outcome routing metadata.

## Order-ticket data

```ts
import { HttpTransport } from "@nktkas/hyperliquid";
import { HyperliquidMarketCache } from "@nktkas/hyperliquid/utils";

const transport = new HttpTransport({ rateLimit: true });
const cache = new HyperliquidMarketCache({
  transport,
  dexs: true,
  caches: {
    metadata: true,
    contexts: true,
    allMids: true,
  },
});

await cache.refresh();

const btc = cache.getOrderTicketInfo("BTC", 100_000);
const builder = cache.getOrderTicketInfo("test:ABC", 12.345);
const spot = cache.getOrderTicketInfo("@107", 100_000);

const loadedDexs = cache.getDexNames();
const perps = cache.getPerpMarkets();
const builderPerps = cache.getBuilderDexMarkets();
const spotPairs = cache.getSpotMarkets();

btc?.assetId; // 0
builder?.assetId; // HIP-3 global asset ID
spot?.spotPairId; // "@107"

btc?.sizeStep;
btc?.effectiveSubmitPriceStep;

cache.formatOrderPrice("BTC", "100000.123");
cache.formatOrderSize("BTC", "0.123456789");
```

## Browser persistence

```ts
const cache = new HyperliquidMarketCache({
  transport,
  dexs: true,
  storage: "localStorage",
  caches: {
    metadata: true,
    contexts: { enabled: true, persist: false },
    allMids: { enabled: true, persist: false },
  },
});

cache.hydrate();
await cache.refresh();
```

Metadata can persist safely across page loads. Volatile contexts, mids, funding, and user-specific state stay
memory-only unless their cache policy explicitly sets `persist: true`.

## Live all-DEX overlays

```ts
import { HttpTransport, WebSocketTransport } from "@nktkas/hyperliquid";
import { HyperliquidMarketCache } from "@nktkas/hyperliquid/utils";

const cache = new HyperliquidMarketCache({
  transport: new HttpTransport({ rateLimit: true }),
  subscriptionTransport: new WebSocketTransport(),
  dexs: true,
  caches: {
    metadata: true,
    allMids: true,
    allDexsAssetCtxs: true,
  },
});

await cache.refresh("metadata");
await cache.startConfiguredAllMids();
await cache.startAllDexsAssetCtxs();

cache.getMid("BTC");
cache.getMid("test:ABC");
cache.getPerpContext("test:ABC");
cache.getSpotContext("@107");
```

REST metadata remains the source of truth for symbols and precision. Live streams only overlay mids and context data.

## HIP-4 outcomes

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

yes?.encoding; // 52360
yes?.spotCoin; // "#52360"
yes?.tokenName; // "+52360"
yes?.assetId; // 100052360
yes?.mid;

cache.resolveOutcomeMarket("+52360");
cache.resolveOutcomeMarket(52360);
cache.resolveOutcomeMarket(100052360);
cache.getOutcomeOrderInfo("#52360");
```

Outcome routing follows Hyperliquid's official rule: `encoding = 10 * outcome + side`, `#<encoding>` for the outcome
spot coin, `+<encoding>` for the token name, and `100_000_000 + encoding` for the order/cancel asset ID.
