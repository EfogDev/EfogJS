import * as _ from 'lodash';

class EventEmitter {
    private $key: number = 0;
    private listeners: Array<{id: number, event: string, callback: Function}> = [];

    addEventListener(event: string, callback: Function): number {
        return this.listeners.push({id: this.$key++, event: event, callback: callback});
    }

    removeEventListener(key: number) {
        _.remove(this.listeners, {
            key: this.$key
        });
    }

    protected emit(event: string) {
        _.each(_.filter(this.listeners, {event: event}), (listener) => {
            listener.callback();
        });
    }
}

class HTTP {
    static load(config: {url: string, method: string, data?: Object}) {
        var reqest = new XMLHttpRequest();
        reqest.open(config.method, config.  url);

        if (config.method == 'POST')
            reqest.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

        var data = '';
        _.each(config.data || {}, function (key, value) {
            data += encodeURI(key) + '' + encodeURI(value);
        });

        reqest.send(data);

        return new Promise(function (resolve, reject) {
            reqest.onreadystatechange = () => {
                if (reqest.readyState != 4)
                    return;

                if (reqest.status < 200 || reqest.status > 300)
                    reject(reqest);

                resolve(reqest.responseText);
            };
        });
    }
}

class Loader {
    private static cached = {};

    static loadResource(filename: string, cache: boolean = true): Promise<string> {
        return new Promise(function (resolve, reject) {
            if (cache && Loader.cached[filename])
                resolve(Loader.cached[filename]);

            HTTP.load({url: filename, method: 'GET'}).then(function (data) {
                resolve(data);
            }, function (request) {
                reject(request);
            });
        });
    }

    static loadHTML(filename: string, asDOM: boolean = false): Promise<any> {
        if (!asDOM)
            return Loader.loadResource(filename);

        return new Promise(function (resolve, reject) {
            Loader.loadResource(filename).then(function (data) {
                var temp = document.createElement('component');
                temp.innerHTML = data;
                resolve(temp);
            }, function (request) {
                reject(request);
            });
        });
    }
}

class Component extends EventEmitter {
    private children: Array<Component> = [];
    private template: Node;
    private node: Node;
    templateUrl: string = null;

    constructor(config: {templateUrl: string, parent?: Component}) {
        super();

        var context = this;
        this.templateUrl = config.templateUrl;

        App.register(this);

        Loader.loadHTML(context.templateUrl, true).then(function (data) {
            context.template = data;
            context.update();
        });

        if (config.parent) {
            config.parent.addChild(this);
        } else {
            App.init(this);
        }
    }

    private compile(template: Node): Node {
        var context = this;
        var node = template.cloneNode(true);

        function compileText(text: Text) {
            var temp = text.textContent.replace(/<\!--(.*?)-->/gim, ''); //removing comments

            _.each(temp.match(/\{\{(.+?)\}\}/gim), function (expr) {
                text.textContent = text.textContent.replace(expr, App.compile(expr, context));

                Watcher.watchSimple(expr, context)
            });
        }

        function compileNode(node: Node) {
            _.each(node.childNodes, function (node) {
                if (node instanceof Text)
                    compileText(node);
                else
                    compileNode(node);
            });
        }

        compileNode(node);
        return node;
    }

    private addChild(child) {

    }

    setAsRoot() {
        this.node = this.render();
        document.body.appendChild(this.node);
    }

    update() {
        if (!this.node.parentNode)
            return;

        var parent = this.node.parentNode;
        var rendered = this.render();
        parent.replaceChild(rendered, this.node);
        this.node = rendered;
    }

    render(): Node {
        if (this.template)
            return this.compile(this.template);

        return document.createElement('component');
    }
}

class Watcher {
    private static watched: Array<{variable: any, previousValue: any, component: Component}> = [];

    static update() {
        _.each(Watcher.watched, function (watched) {
            if (!_.isEqual(App.compile(watched.variable, watched.component), watched.previousValue)) {
                watched.component.update();
            }

            watched.previousValue = App.compile(watched.variable, watched.component);
        });
    }

    static watchSimple(variable: any, component: Component) {
        if (Watcher.watched.filter(function (item) { return item.variable == variable }).length > 0)
            return;

        Watcher.watched.push({variable: variable, previousValue: App.compile(variable, component), component: component});
    }
}

abstract class App {
    private static digestInProgress = false;
    private static components: Array<Component> = [];
    private static started: boolean = false;
    public static version = '0.0.1';

    public static getVersion() {
        return App.version;
    }

    static compile(expression: any, context: Component) {
        return (() => {return eval(expression)}).apply(context);
    }

    static digest() {
        if (App.digestInProgress)
            return;

        App.digestInProgress = true;
        setTimeout(() => {
            _.each(App.components, function (component) {
                component.update();
            });

            App.digestInProgress = false;
        }, 0);
    }

    static register(component: Component) {
        App.components.push(component);
    }

    static init(rootComponent: Component) {
        if (this.started)
            throw new Error('Application already started!');

        document.addEventListener('DOMContentLoaded', function () {
            rootComponent.setAsRoot();
        });
        this.started = true;
    }
}

new Component({templateUrl: 'templates/hello_world.html'});