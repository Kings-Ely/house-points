import { escapeHTML } from './main.js';

// for debugging
window.reservoirErrors = [];

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
    
    execute(key) {
        const parameters = {
            ...this.#data,
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
                console.error(`Error executing ${key}: ${e}`);
            }
        }
    }

    has(key) {
        return this.get(key) !== undefined;
    }
    
    hydrateDry($el) {
        const key = $el.getAttribute('pump');
        const to = $el.getAttribute('pump-to');
        let dry = $el.getAttribute('dry') ?? $el.innerHTML;
        let value = this.execute(key);
        
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
    
    hydrateIf($el) {
        const key = $el.getAttribute('pump-if');
        const value = this.execute(key);
        
        if (!!value) {
            $el.style.visibility = 'visible';
            $el.setAttribute('aria-hidden', 'false');
        } else {
            $el.style.visibility = 'collapse';
            $el.setAttribute('aria-hidden', 'true');
        }
        return !!value;
    }
    
    bind($el) {
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
    
    hydrateAttribute ($el, attrName) {
        const key = '`' + $el.getAttribute(attrName) + '`';
        const value = this.execute(key);
        $el.setAttribute(attrName.split('.', 2)[1], value);
    }
    
    /**
     * @param {Node} $el
     */
    hydrate($el = document) {
        if ($el?.hasAttribute?.('pump-if')) {
            if (!reservoir.hydrateIf($el)) {
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
            reservoir.bind($el);
        }
        
        if ($el?.hasAttribute?.('pump')) {
            reservoir.hydrateDry($el);
        }
        
        for (let attr of $el?.getAttributeNames?.() || []) {
            if (attr.startsWith('pump.')) {
                reservoir.hydrateAttribute($el, attr);
                break;
            }
        }
        
        for (const child of $el?.children || []) {
            this.hydrate(child);
        }
    }
}

const reservoir = new Reservoir();
export default reservoir;