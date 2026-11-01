"use strict";
/**
 * Subscription lifecycle manager: tracks listeners per subscription payload,
 * resubscribes on reconnect, and enforces per-connection subscription limits.
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketSubscriptionManager = void 0;
const mod_js_1 = require("../../deps/jsr.io/@nktkas/rews/4.1.0/mod.js");
const abort = __importStar(require("../_abort.js"));
const _dispatcher_js_1 = require("./_dispatcher.js");
const _id_js_1 = require("./_id.js");
/**
 * Maximum number of subscriptions; the server rejects the excess without
 * echoing the request, so the guard must run client-side.
 *
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/rate-limits-and-user-limits
 */
const MAX_SUBSCRIPTIONS = 1000;
/**
 * Maximum number of unique users across subscriptions; the server rejects the
 * excess without echoing the request, so the guard must run client-side.
 *
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/rate-limits-and-user-limits
 */
const MAX_UNIQUE_USERS = 15;
/** Tracks listeners per subscription payload, resubscribes on reconnect, enforces server-side limits. */
class WebSocketSubscriptionManager {
    /** Enable automatic re-subscription to Hyperliquid subscription after reconnection. */
    resubscribe;
    _socket;
    _dispatcher;
    _hlEvents;
    _subscriptions = new Map();
    constructor(socket, dispatcher, hlEvents, resubscribe) {
        this._socket = socket;
        this._dispatcher = dispatcher;
        this._hlEvents = hlEvents;
        this.resubscribe = resubscribe;
        socket.addEventListener("open", () => this._handleOpen());
        socket.addEventListener("close", () => this._handleClose());
        socket.addEventListener("error", () => this._handleClose());
    }
    // ===========================================================================
    // Public API
    // ===========================================================================
    /**
     * Subscribes to a Hyperliquid event channel.
     *
     * @param options.signal Stops waiting for the confirmation and detaches the listener.
     * @param options.onError Callback invoked at most once, when an already confirmed subscription fails:
     *                        - the server rejects a re-subscription after a reconnect;
     *                        - the connection is permanently terminated;
     *                        - the connection goes down while re-subscription is disabled.
     *
     *                        Failures before the confirmation reject the `subscribe()` promise instead.
     *                        After the callback fires, the subscription is removed and no further events or errors follow.
     *
     * @throws {WebSocketRequestError} When the subscription request fails or limits are exceeded.
     */
    async subscribe(channel, payload, listener, options) {
        const { signal, onError } = options ?? {};
        if (signal?.aborted) {
            throw new _dispatcher_js_1.WebSocketRequestError("Subscription was aborted", { cause: signal.reason, request: payload });
        }
        const id = (0, _id_js_1.requestToId)(payload);
        // --- Subscription state --------------------------------------------------
        let subscription = this._subscriptions.get(id);
        if (!subscription) {
            if (this._subscriptions.size >= MAX_SUBSCRIPTIONS) {
                throw new _dispatcher_js_1.WebSocketRequestError(`Cannot subscribe to more than ${MAX_SUBSCRIPTIONS} channels.`, {
                    request: payload,
                });
            }
            if (this._exceedsUserLimit(payload)) {
                throw new _dispatcher_js_1.WebSocketRequestError(`Cannot track more than ${MAX_UNIQUE_USERS} total users.`, {
                    request: payload,
                });
            }
            const promise = this._dispatcher.request("subscribe", payload)
                .finally(() => created.promiseFinished = true);
            const created = { channel, listeners: new Map(), promise, promiseFinished: false };
            this._subscriptions.set(id, created);
            subscription = created;
            // Each subscriber awaits this promise through its own abort.race below,
            // and an aborting subscriber stops awaiting early. If every subscriber
            // aborts before the request settles, a later rejection would have no
            // handler left and crash the process as an unhandled rejection; this
            // no-op handler absorbs exactly that case.
            promise.catch(() => { });
        }
        // --- Listener registration -----------------------------------------------
        let registration = subscription.listeners.get(listener);
        const createdRegistration = registration === undefined;
        if (!registration) {
            const unsubscribe = async () => {
                this._hlEvents.removeEventListener(channel, listener);
                const current = this._subscriptions.get(id);
                current?.listeners.delete(listener);
                if (current?.listeners.size === 0) {
                    this._subscriptions.delete(id);
                    if (this._socket.readyState === mod_js_1.ReconnectingWebSocket.OPEN) {
                        await this._dispatcher.request("unsubscribe", payload);
                    }
                }
            };
            this._hlEvents.addEventListener(channel, listener);
            registration = { unsubscribe, onError, failureController: new AbortController(), confirmed: false };
            subscription.listeners.set(listener, registration);
        }
        // --- Server confirmation -------------------------------------------------
        try {
            await abort.race(subscription.promise, signal);
            registration.confirmed = true;
        }
        catch (error) {
            // Roll back only what this call registered: the subscription entry itself
            // may legitimately survive (a re-subscription rejected by a disconnect is
            // retried on the next open), but a listener whose subscribe() failed must
            // never receive events — its caller holds no handle to remove it.
            if (createdRegistration) {
                this._hlEvents.removeEventListener(channel, listener);
                const current = this._subscriptions.get(id);
                if (current === subscription) {
                    subscription.listeners.delete(listener);
                    if (subscription.listeners.size === 0) {
                        this._subscriptions.delete(id);
                        // On abort the shared request stays in flight and may still confirm:
                        // free the server-side slot nobody is listening to.
                        if (signal && error === signal.reason && this._socket.readyState === mod_js_1.ReconnectingWebSocket.OPEN) {
                            this._dispatcher.request("unsubscribe", payload).catch(() => { });
                        }
                    }
                }
            }
            if (signal && error === signal.reason) {
                throw new _dispatcher_js_1.WebSocketRequestError("Subscription was aborted", { cause: error, request: payload });
            }
            throw error;
        }
        return {
            unsubscribe: registration.unsubscribe,
            failureSignal: registration.failureController.signal,
        };
    }
    // ===========================================================================
    // Event handlers
    // ===========================================================================
    /** Resubscribes to every completed subscription when the socket re-opens. */
    _handleOpen() {
        // Snapshot before iterating: _failSubscription mutates `_subscriptions`.
        for (const [id, subscription] of [...this._subscriptions.entries()]) {
            if (!subscription.promiseFinished)
                continue;
            // A subscription that survived a disconnect cannot be served when
            // re-subscription was disabled while the socket was down.
            if (!this.resubscribe) {
                this._failSubscription(id, subscription, new _dispatcher_js_1.WebSocketRequestError("WebSocket connection closed", { request: JSON.parse(id) }));
                continue;
            }
            const promise = this._dispatcher.request("subscribe", JSON.parse(id));
            subscription.promise = promise;
            subscription.promiseFinished = false;
            promise
                .catch((error) => {
                // A rejection on a live socket means the server refused the
                // re-subscription or it timed out — either way the channel cannot be
                // trusted anymore. A rejection on a dead socket is the disconnect
                // clearing the queue; the next open retries.
                if (this._socket.readyState === mod_js_1.ReconnectingWebSocket.OPEN) {
                    // The dispatcher rejects only with WebSocketRequestError.
                    this._failSubscription(id, subscription, error);
                }
            })
                .finally(() => subscription.promiseFinished = true);
        }
    }
    /**
     * Fails every subscription when the connection stops serving them: the socket is
     * terminated, or it closes while re-subscription is disabled.
     */
    _handleClose() {
        const terminal = this._socket.terminationSignal.aborted;
        if (this.resubscribe && !terminal)
            return;
        // Snapshot before teardown: each call mutates `_subscriptions` during iteration.
        for (const [id, subscription] of [...this._subscriptions.entries()]) {
            const error = terminal
                ? new _dispatcher_js_1.WebSocketRequestError("WebSocket connection permanently terminated", {
                    cause: this._socket.terminationSignal.reason,
                    request: JSON.parse(id),
                })
                : new _dispatcher_js_1.WebSocketRequestError("WebSocket connection closed", { request: JSON.parse(id) });
            this._failSubscription(id, subscription, error);
        }
    }
    // ===========================================================================
    // Teardown
    // ===========================================================================
    /**
     * Removes the subscription with all its listeners, then notifies each
     * confirmed listener's `onError` once. Sends nothing to the server: every
     * caller deals with a subscription the server no longer serves — refused,
     * or cut off by a close.
     */
    _failSubscription(id, subscription, error) {
        if (this._subscriptions.get(id) !== subscription)
            return;
        this._subscriptions.delete(id);
        for (const [listener, registration] of subscription.listeners) {
            this._hlEvents.removeEventListener(subscription.channel, listener);
            // An unconfirmed listener observes the failure through its still-pending
            // subscribe() call instead.
            if (!registration.confirmed)
                continue;
            registration.failureController.abort(error);
            try {
                registration.onError?.(error);
            }
            catch {
                // A throwing onError must not affect other listeners.
            }
        }
    }
    // ===========================================================================
    // Subscription limit checks
    // ===========================================================================
    /** True when subscribing `payload` would track one user above the limit. */
    _exceedsUserLimit(payload) {
        const userOf = (p) => typeof p === "object" && p !== null && "user" in p && typeof p.user === "string"
            ? p.user.toLowerCase()
            : undefined;
        const user = userOf(payload);
        if (user === undefined)
            return false;
        const users = new Set();
        for (const id of this._subscriptions.keys()) {
            const tracked = userOf(JSON.parse(id));
            if (tracked !== undefined)
                users.add(tracked);
        }
        return !users.has(user) && users.size >= MAX_UNIQUE_USERS;
    }
}
exports.WebSocketSubscriptionManager = WebSocketSubscriptionManager;
//# sourceMappingURL=_subscriptionManager.js.map