"use strict";
/**
 * Error detection for Explorer API responses.
 * @module
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiRequestError = void 0;
exports.assertSuccessResponse = assertSuccessResponse;
const _errors_js_1 = require("../../../_errors.js");
Object.defineProperty(exports, "ApiRequestError", { enumerable: true, get: function () { return _errors_js_1.ApiRequestError; } });
/** True if `r` matches the explorer error response shape `{ "type": "error", "message": "..." }`. */
function isErrorResponse(r) {
    return typeof r === "object" && r !== null &&
        "type" in r && r.type === "error";
}
/**
 * Throws {@linkcode ApiRequestError} if the response is an error; otherwise returns void.
 *
 * @param response Raw API response to validate.
 *
 * @throws {ApiRequestError} If the response contains an error.
 */
function assertSuccessResponse(response) {
    if (isErrorResponse(response)) {
        throw new _errors_js_1.ApiRequestError(response, typeof response.message === "string" ? response.message : undefined);
    }
}
//# sourceMappingURL=_errors.js.map