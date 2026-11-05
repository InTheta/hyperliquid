"use strict";
// deno-lint-ignore-file no-explicit-any
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomEvent_ = exports.DOMException_ = exports.Promise_ = void 0;
/**
 * Runtime shims for APIs missing on some supported platforms, mainly React Native.
 * @module
 */
/** @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise */
exports.Promise_ = (() => {
    return {
        /** @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers */
        withResolvers: Promise.withResolvers ? () => Promise.withResolvers() : () => {
            let resolve;
            let reject;
            const promise = new Promise((res, rej) => (resolve = res, reject = rej));
            return { promise, resolve, reject };
        },
    };
})();
/** @see https://developer.mozilla.org/en-US/docs/Web/API/DOMException */
exports.DOMException_ = (() => {
    return globalThis.DOMException || class DOMException extends Error {
        constructor(message = "", name = "Error") {
            super(message);
            this.name = name;
        }
    };
})();
/** @see https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent */
exports.CustomEvent_ = (() => {
    return globalThis.CustomEvent || class CustomEvent extends Event {
        detail;
        constructor(type, eventInitDict) {
            super(type, eventInitDict);
            this.detail = eventInitDict?.detail ?? null;
        }
        initCustomEvent() { }
    };
})();
//# sourceMappingURL=_polyfills.js.map