import _ = require('./bower_components/lodash/dist/lodash.js');

class EventEmitter {
    private $key: Number = 0;
    private listeners: Array<{id: Number, event: String, callback: Function}> = [];

    addEventListener(event: String, callback: Function) {
        return this.listeners.push({id: this.$key++, event: event, callback: callback});
    }

    removeEventListener(key) {

    }
}