"use strict";
/**
 * Shared error types for Hyperliquid API responses.
 * @module
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiRequestError = void 0;
const _base_js_1 = require("../_base.js");
/** Thrown when the API returns an error response. */
class ApiRequestError extends _base_js_1.HyperliquidError {
    /** Raw API response that contains the error. */
    response;
    /**
     * @param response Raw API response that contains the error.
     * @param message Human-readable error message extracted from the response.
     */
    constructor(response, message) {
        super(message ?? "An unknown error occurred while processing an API request. See `response` for more details.");
        this.name = "ApiRequestError";
        this.response = response;
    }
}
exports.ApiRequestError = ApiRequestError;
//# sourceMappingURL=_errors.js.map