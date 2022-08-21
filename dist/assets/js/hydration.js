import { escapeHTML } from './main.js';

class Reservoir {
    #data = {};

    /**
     * @param {string | {}} key
     * @param {any} [item=undefined]
     */
    set(key, item) {
        if (typeof key === 'object') {
            for (const k in key) {
                this.#data[k] = key[k];
            }
        } else if (typeof key === 'string') {
            this.#data[key] = item;
        } else {
            throw 'Invalid key type - cannot add to reservoir';
        }
        hydrate();
    }

    get(key) {
        const path = key.split('.');
        let current = this.#data;
        for (let key of path) {
            if (!(key in current)) {
                return undefined;
            }
            current = current[key];
        }
        return current;
    }
    
    execute(key) {
        const envVarNames = Object.keys(this.#data);
        const envVarValues = Object.keys(this.#data).map(k => this.#data[k]);
        const thisParam = this.#data;
        const execBody = `return (${key});`;
        
        return new Function(...envVarNames, execBody).call(thisParam, ...envVarValues);
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
        const value = !!this.execute(key);
        
        if (value) {
            $el.style.visibility = 'visible';
            $el.setAttribute('aria-hidden', 'false');
        } else {
            $el.setAttribute('aria-hidden', 'true');
        }
        return !!value;
    }
}

const reservoir = new Reservoir();
export default reservoir;

/**
 * @param $el
 * @returns {void}
 */
export function hydrate($el = document) {
    if ($el.hasAttribute && $el.hasAttribute('pump-if')) {
        if (!reservoir.hydrateIf($el)) {
            return;
        }
    }
    
    if ($el.hasAttribute && $el.hasAttribute('pump')) {
        reservoir.hydrateDry($el);
    }
    
    for (const child of $el.children) {
        hydrate(child);
    }
}