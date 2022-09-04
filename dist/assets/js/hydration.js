// for debugging
import { reloadDOM } from "./dom.js";
import { loadSVG } from "./svg.js";
import { escapeHTML } from "./main.js";

window.reservoirErrors = [];

/**
 * @param {HTMLElement} $el
 * @param {string} start
 * @returns {string[]}
 */
function attrsStartWith($el, start) {
    const result = [];
    for (let attr of $el.attributes) {
        if (attr.name.startsWith(start)) {
            result.push(attr.name);
        }
    }
    return result;
}

class Reservoir {
    #data = {};
    #lsData = {};
    localStorageKey = 'reservoir';
    executeError = Symbol('__reservoirExecuteError');
    #loaded = false;
    /** @type Function[] */
    #loadedCBs = [];

    loadFromLocalStorage(hydrate = true) {
        this.#lsData = this.#getFromLS();
        this.#data = {
            ...this.#data,
            ...this.#lsData
        };
        
        if (hydrate) {
            this.hydrate();
        }
        this.#loaded = true;
        for (let cb of this.#loadedCBs) {
            cb();
        }
    }
    
    waitForLoaded (cb) {
        if (this.#loaded) return void cb();
        this.#loadedCBs.push(cb);
    }

    saveToLocalStorage() {
        this.waitForLoaded(() => {
            localStorage.setItem(this.localStorageKey, JSON.stringify(this.#lsData));
        });
    }
    
    setFromObj (obj, persist=false) {
        // only update the DOM if there are changes to the state
        let areChanges = false;
        for (const k in obj) {
            areChanges ||= this.#data[k] !== obj[k];
            this.#data[k] = obj[k];
        
            if (persist) {
                this.#lsData[k] = obj[k];
            }
        }
    
        if (areChanges) {
            if (persist) this.saveToLocalStorage();
            reloadDOM();
        }
    }
    
    setDefaults (obj, persist=false) {
        let areChanges = false;
        for (const k in obj) {
            areChanges ||= this.#data[k] !== obj[k];
            this.#data[k] ??= obj[k];
            
            if (persist) {
                this.#lsData[k] = this.#data[k];
            }
        }
    
        if (areChanges) {
            if (persist) this.saveToLocalStorage();
            reloadDOM();
        }
    }

    /**
     * @param {string | Record<string, *>} key
     * @param {any} [item=undefined]
     * @param {boolean} [persist=false]
     */
    set(key, item, persist = false) {
        if (typeof key === 'object') {
            this.setFromObj(key, !!item);
            return;
        }
    
        let areChanges = false;
        
        if (typeof key === 'string') {
            areChanges ||= this.#data[key] !== item;
            this.#data[key] = item;
            if (persist === true) {
                this.#lsData[key] = item;
            }
        } else {
            throw 'Invalid key type - cannot add to reservoir';
        }
        
        if (areChanges) {
            if (persist) {
                this.saveToLocalStorage();
            }
            reloadDOM();
        }
    }

    get(key) {
        const path = key.split('.');
        let current = this.#data;
        for (let key of path) {
            if (!(key in current)) {
                reservoirErrors.push([key, new Error('Key not found in reservoir')]);
                return undefined;
            }
            current = current[key];
        }
        return current;
    }

    /**
     * @param {string} key
     * @param {HTMLElement|Document|Body} $el
     * @returns {*}
     */
    execute(key, $el) {
        const parameters = {
            ...this.#data,
        };

        let parent = $el;
        while (parent) {
            for (let attr of attrsStartWith(parent, 'pour.')) {
                const key = attr.split('.', 2)[1];
                const value = this.execute(parent.getAttribute(attr), $el.parentElement);
                if (value === this.executeError) continue;
                parameters[key] = value;
            }
            parent = parent.parentElement;
        }

        parameters['$el'] = $el;

        const envVarNames = Object.keys(parameters);
        const envVarValues = Object.keys(parameters).map(k => parameters[k]);
        const thisParam = this;
        const execBody = `
            return (${key});
        `;

        try {
            return new Function(...envVarNames, execBody).call(thisParam, ...envVarValues);
        } catch (e) {
            if (e instanceof ReferenceError || e instanceof TypeError) {
                reservoirErrors.push([key, e]);
            } else if (e.toString() === 'SyntaxError: Arg string terminates parameters early') {
                console.error(`Error executing '${key}': ${e}`, envVarNames, envVarValues);
            } else {
                console.error(`Error executing '${key}': ${e}`);
            }
            return this.executeError;
        }
    }

    has(key) {
        return this.get(key) !== undefined;
    }
    
    /**
     * @param {HTMLElement|Document|Body} $el
     */
    hydrate($el = document) {
        //const start = performance.now();
        
        if ($el?.hasAttribute?.('hidden') || $el?.hasAttribute?.('hidden-dry')) {
            if (!this.#hydrateIf($el)) {
                return;
            }
        }
        
        if ($el?.getAttribute?.('aria-hidden') === 'true') {
            return;
        }
        
        if ($el?.hasAttribute?.('waterproof')) {
            return;
        }
        
        if ($el?.hasAttribute?.('bind')) {
            this.#bind($el);
        }
        
        if ($el?.hasAttribute?.('pump')) {
            this.#hydrateDry($el);
        }
        
        for (let attr of $el?.getAttributeNames?.() || []) {
            if (attr.startsWith('pump.')) {
                this.#hydrateAttribute($el, attr);
            } else if (attr.startsWith('bind.')) {
                this.#bindListener($el, attr.split('.', 2)[1]);
            }
        }
        
        if ($el?.hasAttribute?.('foreach')) {
            this.#hydrateFor($el);
        }
        
        if ($el?.hasAttribute?.('args') && 'reloadComponent' in $el) {
            $el.reloadComponent();
        }
        
        if ($el?.hasAttribute?.('svg')) {
            loadSVG($el).then();
        }
        
        for (const child of $el.children) {
            // don't await, because we don't want to block the page load
            reloadDOM(child);
        }
        
        if ($el === document) {
            //console.trace('Hydrated document in ' + (performance.now() - start) + 'ms');
        }
    }

    #hydrateDry($el) {
        const key = $el.getAttribute('pump');
        const to = $el.getAttribute('pump-to');
        let dry = $el.getAttribute('dry') ?? $el.innerHTML;
        let value = this.execute(key, $el);
        if (value === this.executeError) return;
        
        if (typeof value === 'object') {
            value = JSON.stringify(value);
        }

        if (!$el.hasAttribute('pump-dirty')) {
            value = escapeHTML(value);
        }

        let html;

        if (to === 'end') {
            html = dry + value;
        } else if (to === 'replace') {
            html = value;
        } else {
            html = value + dry;
        }

        if (!$el.hasAttribute('dry')) {
            $el.setAttribute('dry', dry);
        }

        $el.innerHTML = html;
    }

    #hydrateIf($el) {
        let key = $el.getAttribute('hidden-dry');
        
        if (!key || typeof key !== 'string') {
            key = $el.getAttribute('hidden');
            if (key === '') return;
            $el.setAttribute('hidden-dry', key);
        }

        const value = this.execute(key, $el);
        const isShown = !value && value !== this.executeError;

        if (isShown) {
            $el.removeAttribute('aria-hidden');
            $el.removeAttribute('hidden');
        } else {
            $el.setAttribute('aria-hidden', 'true');
            $el.setAttribute('hidden', '');
        }
        return isShown;
    }

    #bind($el) {
        if (!('value' in $el)) {
            throw 'Cannot bind to element without value attribute';
        }
    
        const key = $el.getAttribute('bind');
        const persist = $el.hasAttribute('bind-persist');
        
        const self = this;
    
        if (!$el.getAttribute('bound')) {
            
            function update() {
                self.set(key, $el.value, persist);
    
            }
            $el.addEventListener('change', update);
            $el.addEventListener('keyup', update);
            $el.addEventListener('keydown', update);
            $el.addEventListener('click', update);
        }
    
        $el.setAttribute('bound', 'true');
    
        if (this.has(key)) {
            $el.value = this.get(key);
        } else {
            this.set(key, $el.value);
        }
    }

    #bindListener($el, name) {
        const onEvent = $el.getAttribute(`bind.${name}`);
        const self = this;

        if ($el.hasAttribute(`bound-${name}`)) {
            return;
        }

        $el.setAttribute(`bound-${name}`, 'true');

        $el.addEventListener(name, () => {
            self.execute(onEvent, $el);
        });
    }

    #hydrateAttribute($el, attrName) {
        const key = '`' + $el.getAttribute(attrName) + '`';
        let value = this.execute(key, $el);
        if (value === this.executeError) return;

        const attr = attrName.split('.', 2)[1];
        $el.setAttribute(attr, value);

        if (attr === 'args' && 'reloadComponent' in $el) {
            $el.reloadComponent();
        }
    }

    #hydrateFor($el) {
        const key = $el.getAttribute('foreach');

        let dry = $el.getAttribute('foreach-dry') ?? $el.innerHTML;

        const [symbol, value] = key.split(' in ');

        let iterator = this.execute(value, $el);

        if (iterator === this.executeError) {
            $el.innerHTML = '';
            if (!$el.hasAttribute('foreach-dry')) {
                $el.setAttribute('foreach-dry', dry);
            }
            return;
        }

        if (!Array.isArray(iterator)) {
            console.error(`foreach '${key}' value is not an array: `, iterator);
            return;
        }

        const eachAttrs = [];

        for (let attr of $el?.getAttributeNames?.() || []) {
            if (attr.startsWith('each.')) {
                eachAttrs.push(attr);
            }
        }

        $el.innerHTML = '';

        for (let item of iterator) {
            const itemDiv = document.createElement('div');
            itemDiv.innerHTML = dry;
            itemDiv.setAttribute(`pour.${symbol}`, JSON.stringify(item));

            for (let attr of eachAttrs) {
                const key = '`' + $el.getAttribute(attr) + '`';
                const value = this.execute(key, itemDiv);
                if (value === this.executeError) continue;
                itemDiv.setAttribute(attr.split('.', 2)[1], value);
            }

            $el.classList.add('reservoir-container');
            $el.appendChild(itemDiv);
        }

        // do at end so that the element stays hidden until it has been
        // fully initialised.
        if (!$el.hasAttribute('foreach-dry')) {
            $el.setAttribute('foreach-dry', dry);
        }
    }
    
    /**
     * @returns {Record<string, *>}
     */
    #getFromLS () {
        const lsDataRaw = localStorage.getItem(this.localStorageKey);
        let lsData;
        
        try {
            lsData = JSON.parse(lsDataRaw);
        } catch (E) {
            console.error('Error parsing reservoir data from local storage');
            lsData = {};
        }
        
        if (typeof lsData !== 'object' || Array.isArray(lsData) || lsData === null) {
            console.error('Error parsing reservoir data from local storage - must be object');
            lsData = {};
        }
        return lsData;
    }
}

const reservoir = new Reservoir();
export default reservoir;
