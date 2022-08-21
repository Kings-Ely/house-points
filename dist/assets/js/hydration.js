import { escapeHTML } from "./main.js";

export function hydrate ($el=document) {

	if ($el.hasAttribute && $el.hasAttribute('pump-if')) {
		if (!hydrateIf($el)) {
			return;
		}
	}

	if ($el.hasAttribute && $el.hasAttribute('pump')) {
		hydrateDry($el);
	}

	for (const child of $el.children) {
		hydrate(child);
	}
}

class Reservoir {
	constructor () {
		this.__data = {};
	}

	/**
	 *
	 * @param {string | {}} key
	 * @param {any} [item=undefined]
	 */
	set (key, item) {
		if (typeof key === 'object') {
			for (const k in key) {
				this.__data[k] = key[k];
			}
		} else if (typeof key === 'string') {
			this.__data[key] = item;
		} else {
			throw 'Invalid key type - cannot add to reservoir';
		}
		hydrate();
	}

	get (key) {
		const path = key.split('.');
		let current = this.__data;
		for (let key of path) {
			if (!(key in current)) {
				return undefined;
			}
			current = current[key];
		}
		return current;
	}

	has (key) {
		return this.get(key) !== undefined;
	}

	static instance = new Reservoir();
}

export default Reservoir.instance;

function hydrateDry ($el) {
	const key = $el.getAttribute('pump');
	const to = $el.getAttribute('pump-to');
	let dry = $el.getAttribute('dry') ?? $el.innerHTML;
	let value = Reservoir.instance.get(key);

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

function hydrateIf ($el) {
	const key = $el.getAttribute('pump-if');
	let value = Reservoir.instance.get(key);

	if (value) {
		$el.style.display = 'unset';
	}
	return !!value;
}