"use strict";
/**
 * This module re-exports all explorer-related API request functions and types.
 *
 * You can use raw functions to maximize tree-shaking in your app,
 * or to access {@link https://github.com/fabian-hiller/valibot | valibot} schemas Request/Response.
 *
 * @example
 * ```ts
 * import { HttpTransport } from "@nktkas/hyperliquid";
 * import { blockDetails } from "@nktkas/hyperliquid/api/explorer";
 * //       ^^^^^^^^^^^^
 * //       same name as in `ExplorerClient`
 *
 * const transport = new HttpTransport(); // only `HttpTransport` supports this API
 *
 * const data = await blockDetails(
 *   { transport }, // same params as in `ExplorerClient`
 *   { height: 123 },
 * );
 * ```
 * @example
 * ```ts
 * import { WebSocketTransport } from "@nktkas/hyperliquid";
 * import { explorerBlock } from "@nktkas/hyperliquid/api/explorer";
 * //       ^^^^^^^^^^^^^
 * //       same name as in `ExplorerClient`
 *
 * const transport = new WebSocketTransport({ url: "wss://rpc.hyperliquid.xyz/ws" }); // only `WebSocketTransport` supports this API
 *
 * await explorerBlock(
 *   { transport }, // same params as in `ExplorerClient`
 *   (data) => console.log(data),
 * );
 * ```
 *
 * @module
 */
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiRequestError = void 0;
var mod_js_1 = require("./_methods/_base/mod.js");
Object.defineProperty(exports, "ApiRequestError", { enumerable: true, get: function () { return mod_js_1.ApiRequestError; } });
__exportStar(require("./_methods/blockDetails.js"), exports);
__exportStar(require("./_methods/explorerBlock.js"), exports);
__exportStar(require("./_methods/explorerTxs.js"), exports);
__exportStar(require("./_methods/txDetails.js"), exports);
__exportStar(require("./_methods/userDetails.js"), exports);
//# sourceMappingURL=mod.js.map