import { escapeHTML } from "./main.js";

// for debugging
window.reservoirErrors = [];

/**
 *
 * @param {HTMLElement} $el
 * @param {string} start
 * @returns {string[]}
 */
function attrsStartWith ($el, start) {
    const result = [];
    for (let attr of $el.attributes) {
        if (attr.name.startsWith(start)) {
            result.push(attr.name);
        }
    }
    return result;
}

class Reservoir {
    #data;
    #lsData;
    localStorageKey;
    
    constructor () {
        this.#data = {};
        this.#lsData = {};
        this.localStorageKey = 'reservoir';
    }
    
    loadFromLocalStorage (hydrate=true) {
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
        
        this.#lsData = lsData;
        this.#data = { ...this.#lsData };
        
        if (hydrate) {
            this.hydrate();
        }
    }
    
    saveToLocalStorage () {
        localStorage.setItem(this.localStorageKey, JSON.stringify(this.#lsData));
    }

    /**
     * @param {string | {}} key
     * @param {any} [item=undefined]
     * @param {boolean} [persist=false]
     */
    set(key, item, persist=false) {
        let areChanges = false;
        
        if (typeof key === 'object') {
            persist = !!item;
            
            for (const k in key) {
                areChanges ||= this.#data[k] !== key[k];
                this.#data[k] = key[k];
                
                if (persist) {
                    this.#lsData[k] = key[k];
                }
            }
            
        } else if (typeof key === 'string') {
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
            this.hydrate();
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
        }
        
        let parent = $el;
        while (parent) {
            for (let attr of attrsStartWith(parent, 'pour.')) {
                const key = attr.split('.', 2)[1];
                parameters[key] = JSON.parse(parent.getAttribute(attr));
            }
            parent = parent.parentElement;
        }
        
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
            } else {
                console.error(`Error executing '${key}': ${e}`);
            }
            return null;
        }
    }

    has(key) {
        return this.get(key) !== undefined;
    }
    
    #hydrateDry($el) {
        const key = $el.getAttribute('pump');
        const to = $el.getAttribute('pump-to');
        let dry = $el.getAttribute('dry') ?? $el.innerHTML;
        let value = this.execute(key, $el);
        
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
        const key = $el.getAttribute('if');
        const value = this.execute(key, $el);
        
        if (!!value) {
            $el.style.visibility = 'visible';
            $el.setAttribute('aria-hidden', 'false');
        } else {
            $el.style.visibility = 'collapse';
            $el.setAttribute('aria-hidden', 'true');
        }
        return !!value;
    }
    
    #bind($el) {
        if (!($el instanceof HTMLInputElement)) {
            throw 'Cannot bind to non-input element';
        }
        
        const key = $el.getAttribute('bind');
        
        if (!$el.getAttribute('bound')) {
            $el.addEventListener('change', () => {
                reservoir.set(key, $el.value);
            });
        }
    
        $el.setAttribute('bound', 'true');
    
        reservoir.set(key, $el.value);
    }
    
    #hydrateAttribute ($el, attrName) {
        const key = '`' + $el.getAttribute(attrName) + '`';
        let value = this.execute(key, $el);
        const attr = attrName.split('.', 2)[1]
        $el.setAttribute(attr, value);
        
        if (attr === 'args' && 'reloadComponent' in $el) {
            $el.reloadComponent();
        }
    }
    
    #hydrateFor ($el) {
        const key = $el.getAttribute('foreach');
        
        let dry = $el.getAttribute('foreach-dry') ?? $el.innerHTML;
        if (!$el.hasAttribute('foreach-dry')) {
            $el.setAttribute('foreach-dry', dry);
        }
        
        const [ symbol, value ] = key.split(' in ');
        let iterator = this.execute(value, $el);
        
        if (iterator === null) return;
        
        if (!Array.isArray(iterator)) {
            console.error(`foreach '${key}' requires an array: ${iterator} is not an array`);
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
            itemDiv.style.display = 'contents';
            itemDiv.innerHTML = dry;
            itemDiv.setAttribute(`pour.${symbol}`, JSON.stringify(item));
            
            for (let attr of eachAttrs) {
                const key = '`' + $el.getAttribute(attr) + '`';
                const value = this.execute(key, itemDiv);
                itemDiv.setAttribute(attr.split('.', 2)[1], value);
            }
            
            $el.appendChild(itemDiv);
        }
        
        $el.style.visibility = 'visible';
    }
    
    /**
     * @param {HTMLElement|Document|Body} $el
     */
    hydrate($el = document) {
        if ($el?.hasAttribute?.('if')) {
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
                break;
            }
        }
        
        if ($el?.hasAttribute?.('foreach')) {
            this.#hydrateFor($el);
        }
    
        if ($el?.hasAttribute?.('args') && 'reloadComponent' in $el) {
            //$el.reloadComponent();
        }
        
        for (const child of $el?.children || []) {
            this.hydrate(child);
        }
    }
}

const reservoir = new Reservoir();
export default reservoir;