import { escapeHTML } from "./main.js";

export function hydrate ($el=document) {
	const elements = $el.querySelectorAll('[pump]');
	for (const element of elements) {
		hydrateAction(element);
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

	has (key) {
		return key in this.__data;
	}

	get (key) {
		if (!(key in this.__data)) {
			throw new Error(`Key ${key} not found in reservoir`);
		}
		return this.__data[key];
	}

	static instance = new Reservoir();
}

export default Reservoir.instance;

function hydrateAction ($el) {
	const key = $el.getAttribute('pump');
	const to = $el.getAttribute('pump-to');
	let value = Reservoir.instance.get(key);

	if ($el.hasAttribute('pump-clean')) {
		value = escapeHTML(value);
	}

	let html;

	if (to === 'end') {
		html = $el.innerHTML + value;
	}

	else if (to === 'replace') {
		html = value;
	}

	else {
		html = value + $el.innerHTML;
	}

	$el.innerHTML = html;
}

