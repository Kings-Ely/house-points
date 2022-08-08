import { API_ROOT, showError, waitForReady, state } from "./main.js";
// Spinner

/**
 * Adds a spinner to the page.
 * Must wait for the DOM to be ready first.
 * @returns {Promise<HTMLElement>}
 */
export async function showSpinner () {
	await waitForReady();

	document.body.style.cursor = 'progress';

	const current = document.querySelector('.spinner');
	if (current) current.remove();

	const loader = document.createElement('div');
	loader.classList.add('spinner');
	loader.innerHTML = `<div><div></div><div></div><div></div><div></div></div>`;

	document.body.appendChild(loader);

	return loader;
}

/**
 * Hides the spinner by removing it from the DOM
 * @param {HTMLElement} $spinner
 */
export function stopSpinner ($spinner) {
	state.currentlyShowingLoadingAnim = false;
	document.body.removeChild($spinner);
	document.body.style.cursor = 'default';
}


/**
 * Connect to the API without all the checks and spinners and stuff
 * @param {string|TemplateStringsArray} path
 * @param {*} args
 * @returns {Promise<Record<string, any>>}
 */
export async function rawAPI (path, ...args) {

	if (typeof path !== 'string') {
		path = path.reduce((acc, cur, i) => {
			if (typeof args[i] === 'object') {
				args[i] = JSON.stringify(args[i]);
			}
			let paramStr = (args[i] || '').toString();
			return acc + cur + paramStr;
		}, '');
	}

	if (path[0] === '/') {
		path = path.substring(1);
	}

	// fetch
	let res;
	let asJSON;
	try {
		res = await fetch(`${API_ROOT}/?${path}`, {
			method: 'GET',
			mode: 'cors',
			cache: 'no-cache',
			redirect: 'follow',
			credentials: 'include'
		}).catch(console.error);
	} catch (e) {
		return {
			error: `Failed to fetch ${path}`
		};
	}

	try {
		asJSON = await res.json();
	} catch (e) {
		asJSON = {
			error: 'Failed to parse response as JSON'
		};
	}

	return asJSON;
}

/**
 * Show loading while requests are being made
 * but only show the spinner if no other requests are still pending,
 * which would mean the spinner is already being shown.

 * @param {string|TemplateStringsArray} path
 * @param {*} args
 * @returns {Promise<Record<string, any>>}
 */
export async function api (path, ...args) {

	if (typeof path !== 'string') {
		path = path.reduce((acc, cur, i) => {
			if (typeof args[i] === 'object') {
				args[i] = JSON.stringify(args[i]);
			}
			let paramStr = (args[i] || '').toString();
			return acc + cur + paramStr;
		}, '');
	}

	if (path[0] === '/') {
		path = path.substring(1);
	}

	let shouldHideAtEnd = false;
	let loader;
	if (!state.currentlyShowingLoadingAnim) {
		// pre-fetch
		state.currentlyShowingLoadingAnim = true;
		shouldHideAtEnd = true;

		loader = await showSpinner();
	}

	if (path[0] === '/') {
		path = path.substring(1);
	}

	// fetch
	// include '/' in request as otherwise you get redirected, which takes lots of time
	const res = await fetch(`${API_ROOT}/?${path}`, {
		method: 'GET',
		mode: 'cors',
		cache: 'no-cache',
		redirect: 'follow',
		credentials: 'include'
	}).catch(err => {
		console.error(`Error with API request (${path}): `, err);
		if (shouldHideAtEnd) {
			stopSpinner(loader);
		}
		showError('Something went wrong!');
	});

	if (res.status === 404) {
		showError('Something went wrong! (404 in API)')
			.then();
		if (shouldHideAtEnd) {
			stopSpinner(loader);
		}
		return {};
	}

	let asJSON = {};
	try {
		// this might fail if the response is not JSON
		asJSON = await res.json();

		// don't try to show error in response if there is no response, so also in try block
		if (asJSON.error) {
			showError(asJSON.error)
				.then();
		}

	} catch (err) {
		console.error('Error with API request: ', err);
		showError('Something went wrong!')
			.then();
	}

	if (shouldHideAtEnd) {
		stopSpinner(loader);
	}

	return asJSON;
}