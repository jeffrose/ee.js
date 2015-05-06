(function (factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports", "module", "babel-runtime/core-js"], factory);
    } else if (typeof exports !== "undefined" && typeof module !== "undefined") {
        factory(exports, module, require("babel-runtime/core-js"));
    }
})(function (exports, module, _babelRuntimeCoreJs) {
    "use strict";

    var _core = _babelRuntimeCoreJs["default"];
    var events = _core.Symbol("@@events"),
        every = _core.Symbol("@@every"),
        maxListeners = _core.Symbol("@@maxListeners");

    function executeListener(listener) {
        var list = arguments[1] === undefined ? [] : arguments[1];
        var scope = arguments[2] === undefined ? this : arguments[2];

        var data;

        if (typeof listener === "function") {
            switch (list.length) {
                case 1:
                    listener.call(scope);
                    break;
                case 2:
                    listener.call(scope, list[1]);
                    break;
                case 3:
                    listener.call(scope, list[1], list[2]);
                    break;
                default:
                    data = listenerData(list);
                    listener.apply(scope, data);
            }
        } else if (Array.isArray(listener)) {
            var listeners = undefined;

            data = listenerData(list);

            listeners = listener.slice();

            for (var i = 0, _length = listeners.length; i < _length; i++) {
                listeners[i].apply(scope, data);
            }
        }
    }

    function listenerData(list) {
        var length = list.length,
            data = new Array(length - 1);

        for (var i = 1; i < length; i++) {
            data[i - 1] = list[i];
        }

        return data;
    }

    function EventEmitter(bindings) {
        var _this = this;

        if (!this[events] || this[events] === _core.Object.getPrototypeOf(this)[events]) {
            this[events] = Object.create(null);
        }

        if (typeof bindings === "object") {
            for (var type in bindings) {
                (function (type) {
                    var listeners = bindings[type];

                    if (Array.isArray(listeners)) {
                        listeners.forEach(function (listener) {
                            return _this.on(type, listener);
                        });
                    } else {
                        _this.on(type, listeners);
                    }
                })(type);
            }
        }

        this[maxListeners] = this[maxListeners];
    }

    EventEmitter.prototype = Object.create(null);

    EventEmitter.prototype[_core.Symbol.toStringTag] = "EventEmitter";

    EventEmitter.prototype.allOff = function (type) {
        var _this = this;

        var handler;

        if (!this[events]) {
            return this;
        }

        if (!this[events].removeListener) {
            if (arguments.length === 0) {
                this[events] = Object.create(null);
            } else if (this[events][type]) {
                delete this[events][type];
            }

            return this;
        }

        if (arguments.length === 0) {
            for (var eventType in this[events]) {
                if (eventType === "removeListener") {
                    continue;
                }

                this.allOff(eventType);
            }

            this.allOff("removeListener");

            this[events] = Object.create(null);

            return this;
        }

        handler = this[events][type];

        if (typeof handler === "function") {
            this.off(type, handler);
        } else if (Array.isArray(handler)) {
            handler.forEach(function (listener) {
                return _this.off(type, listener);
            });
        }

        delete this[events][type];

        return this;
    };

    EventEmitter.prototype.destroy = function () {
        this.allOff();
        delete this[events];
        delete this[maxListeners];
    };

    EventEmitter.prototype.emit = function (type) {
        var executed = false,
            listener;

        if (!this[events]) {
            this[events] = Object.create(null);
        }

        if (type === "error" && !this[events].error) {
            var error = arguments[1];

            if (error instanceof Error) {
                throw error;
            } else {
                throw Error("Uncaught, unspecified \"error\" event.");
            }

            return executed;
        }

        // Execute listeners for the given type of event
        listener = this[events][type];
        if (typeof listener !== "undefined") {
            executeListener(listener, arguments, this);
            executed = true;
        }

        // Execute listeners listening for all types of events
        listener = this[events][every];
        if (typeof listener !== "undefined") {
            executeListener(listener, arguments, this);
            executed = true;
        }

        return executed;
    };

    EventEmitter.prototype.listeners = function (type) {
        var listeners;

        if (!this[events] || !this[events][type]) {
            listeners = [];
        } else if (typeof this[events][type] === "function") {
            listeners = [this[events][type]];
        } else {
            listeners = this[events][type].slice();
        }

        return listeners;
    };

    EventEmitter.prototype.many = function (_x, times, listener) {
        var type = arguments[0] === undefined ? every : arguments[0];

        // Shift arguments if type is not provided
        if (typeof type === "number" && typeof times === "function" && typeof listener === "undefined") {
            listener = times;
            times = type;
            type = every;
        }

        if (typeof times !== "number") {
            throw new TypeError("times must be a number");
        }

        if (typeof listener !== "function") {
            throw new TypeError("listener must be a function");
        }

        function manyListener() {
            if (--times === 0) {
                this.off(type, manyListener);
            }
            listener.apply(this, arguments);
        }

        manyListener.listener = listener;

        this.on(type, manyListener);

        return this;
    };

    EventEmitter.prototype.off = function (_x, listener) {
        var type = arguments[0] === undefined ? every : arguments[0];

        var handler, index;

        // Shift arguments if type is not provided
        if (typeof type === "function" && typeof listener === "undefined") {
            listener = type;
            type = every;
        }

        if (typeof listener !== "function") {
            throw new TypeError("listener must be a function");
        }

        if (!this[events] || !this[events][type]) {
            return this;
        }

        handler = this[events][type];
        index = -1;

        if (handler === listener || typeof handler.listener === "function" && handler.listener === listener) {
            delete this[events][type];
            if (this[events].removeListener) {
                this.emit("removeListener", type, listener);
            }
        } else if (Array.isArray(handler)) {
            for (var i = handler.length; i-- > 0;) {
                if (handler[i] === listener || handler[i].listener && handler[i].listener === listener) {
                    index = i;
                    break;
                }
            }
        }

        if (index < 0) {
            return this;
        }

        if (handler.length === 1) {
            handler.length = 0;
            delete this[events][type];
        } else {
            handler.splice(index, 1);
        }

        if (this[events].removeListener) {
            this.emit("removeListener", type, listener);
        }

        return this;
    };

    EventEmitter.prototype.on = function (_x, listener) {
        var type = arguments[0] === undefined ? every : arguments[0];

        // Shift arguments if type is not provided
        if (typeof type === "function" && typeof listener === "undefined") {
            listener = type;
            type = every;
        }

        if (typeof listener !== "function") {
            throw new TypeError("listener must be a function");
        }

        if (!this[events]) {
            this[events] = Object.create(null);
        }

        if (this[events].newListener) {
            this.emit("newListener", type, typeof listener.listener === "function" ? listener.listener : listener);
        }

        // Single listener
        if (!this[events][type]) {
            this[events][type] = listener;

            // Multiple listeners
        } else if (Array.isArray(this[events][type])) {
            this[events][type].push(listener);

            // Transition from single to multiple listeners
        } else {
            this[events][type] = [this[events][type], listener];
        }

        if (Array.isArray(this[events][type]) && !this[events][type].warned) {
            var max = typeof this[maxListeners] !== "undefined" ? this[maxListeners] : EventEmitter.defaultMaxListeners;

            if (max && max > 0 && this[events][type].length > max) {
                this.emit("maxListeners", type, listener);
                this[events][type].warned = true;
            }
        }

        return this;
    };

    EventEmitter.prototype.once = function (_x, listener) {
        var type = arguments[0] === undefined ? every : arguments[0];

        // Shift arguments if type is not provided
        if (typeof type === "function" && typeof listener === "undefined") {
            listener = type;
            type = every;
        }

        return this.many(type, 1, listener);
    };

    EventEmitter.prototype.setMaxListeners = function (max) {
        if (typeof max !== "number" || max < 0 || isNaN(max)) {
            throw TypeError("max must be a positive number");
        }

        this[maxListeners] = max;

        return this;
    };

    EventEmitter.prototype.trigger = function (type) {
        var args = arguments[1] === undefined ? [] : arguments[1];

        Array.prototype.unshift.call(args, type);
        return this.emit.apply(this, args);
    };

    // Aliases
    EventEmitter.prototype.addListener = EventEmitter.prototype.on;
    EventEmitter.prototype.addManyListener = EventEmitter.prototype.many;
    EventEmitter.prototype.addOnceListener = EventEmitter.prototype.once;
    EventEmitter.prototype.removeAllListeners = EventEmitter.prototype.allOff;
    EventEmitter.prototype.removeListener = EventEmitter.prototype.off;

    EventEmitter.listenerCount = function (emitter, type) {
        var count;

        // Empty
        if (!emitter[events] || !emitter[events][type]) {
            count = 0;

            // Function
        } else if (typeof emitter[events][type] === "function") {
            count = 1;

            // Array
        } else {
            count = emitter[events][type].length;
        }

        return count;
    };

    EventEmitter.defaultMaxListeners = 10;

    // Backwards-compat with node 0.10.x
    EventEmitter.EventEmitter = EventEmitter;

    Object.defineProperty(EventEmitter, "every", {
        value: every,
        configurable: false,
        enumerable: true,
        writable: false
    });

    module.exports = EventEmitter;
});