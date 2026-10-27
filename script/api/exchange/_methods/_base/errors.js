"use strict";
/**
 * Error types and utilities for Exchange API responses.
 * @module
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiRequestError = void 0;
exports.isErrorResponse = isErrorResponse;
exports.assertSuccessResponse = assertSuccessResponse;
const _errors_js_1 = require("../../../_errors.js");
Object.defineProperty(exports, "ApiRequestError", { enumerable: true, get: function () { return _errors_js_1.ApiRequestError; } });
// ============================================================
// Detection (duck-typed)
// ============================================================
/** True if `value` has an `error` field of type string. */
function hasErrorField(value) {
    return typeof value === "object" && value !== null &&
        "error" in value && typeof value.error === "string";
}
/** True if `r` matches `{ status: "err", response: string }`. */
function isTopLevelError(r) {
    return typeof r === "object" && r !== null &&
        "status" in r && r.status === "err";
}
/** True if `r` matches `{ response: { type, data: { statuses: [{ error }, ...] } } }` (any error in array). */
function isBulkError(r) {
    if (typeof r !== "object" || r === null)
        return false;
    const response = r.response;
    if (typeof response?.type !== "string")
        return false;
    const statuses = response.data?.statuses;
    return Array.isArray(statuses) && statuses.some(hasErrorField);
}
/** True if `r` matches `{ response: { data: { status: { error } } } }`. */
function isSingleError(r) {
    if (typeof r !== "object" || r === null)
        return false;
    const status = r.response?.data?.status;
    return hasErrorField(status);
}
/** True if `r` matches any of the three Hyperliquid error response shapes. */
function isErrorResponse(r) {
    return isTopLevelError(r) || isBulkError(r) || isSingleError(r);
}
// ============================================================
// Extraction
// ============================================================
/** Extract a human-readable error message from an error response, or `undefined` if none. */
function getErrorMessage(r) {
    if (isTopLevelError(r)) {
        return r.response;
    }
    if (isBulkError(r)) {
        const prefix = r.response.type;
        const errors = r.response.data.statuses.flatMap((s, i) => hasErrorField(s) ? [`${prefix} ${i}: ${s.error}`] : []);
        if (errors.length > 0)
            return errors.join(", ");
    }
    if (isSingleError(r)) {
        return r.response.data.status.error;
    }
    return undefined;
}
// ============================================================
// Assertion
// ============================================================
/**
 * Throws {@linkcode ApiRequestError} if the response is an error; otherwise returns void.
 *
 * @param response Raw API response to validate.
 *
 * @throws {ApiRequestError} If the response contains an error.
 */
function assertSuccessResponse(response) {
    if (isErrorResponse(response)) {
        throw new _errors_js_1.ApiRequestError(response, getErrorMessage(response));
    }
}
//# sourceMappingURL=errors.js.map