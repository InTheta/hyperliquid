"use strict";
/**
 * Base infrastructure for Exchange API methods.
 * @module
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeUserSignedAction = exports.executeL1Action = exports.ApiRequestError = void 0;
var errors_js_1 = require("./errors.js");
Object.defineProperty(exports, "ApiRequestError", { enumerable: true, get: function () { return errors_js_1.ApiRequestError; } });
var execute_js_1 = require("./execute.js");
Object.defineProperty(exports, "executeL1Action", { enumerable: true, get: function () { return execute_js_1.executeL1Action; } });
Object.defineProperty(exports, "executeUserSignedAction", { enumerable: true, get: function () { return execute_js_1.executeUserSignedAction; } });
//# sourceMappingURL=mod.js.map