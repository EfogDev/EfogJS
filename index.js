"use strict";
var EventEmitter = (function () {
    function EventEmitter() {
        this.$key = 0;
        this.listeners = [];
    }
    EventEmitter.prototype.addEventListener = function (event, callback) {
        return this.listeners.push({ id: this.$key++, event: event, callback: callback });
    };
    EventEmitter.prototype.removeEventListener = function (key) {
    };
    return EventEmitter;
}());
//# sourceMappingURL=index.js.map