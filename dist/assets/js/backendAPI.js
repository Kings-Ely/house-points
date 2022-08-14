import { API_ROOT, showError, waitForReady, state, getSession } from "./main.js";

let spinnerQueue = [];
let spinnerFrameID = 0;

// Spinner

/**
 * Adds a spinner to the page.
 * Must wait for the DOM to be ready first.
 * @returns {Promise<int>}
 */
export async function showSpinner () {
	await waitForReady();

	document.body.style.cursor = 'progress';

	const current = document.querySelector('.spinner');
	if (current) {
		spinnerFrameID++
		spinnerQueue.push(spinnerFrameID);
		return spinnerFrameID;
	}

	const loader = document.createElement('div');
	loader.classList.add('spinner');
	loader.innerHTML = `<div><div></div><div></div><div></div><div></div></div>`;

	document.body.appendChild(loader);

	return spinnerFrameID;
}

/**
 * Hides the spinner by removing it from the DOM
 * @param {int} id
 */
export function stopSpinner (id) {
	if (spinnerQueue.includes(id)) {
		spinnerQueue.splice(spinnerQueue.indexOf(id), 1);
	}

	if (spinnerQueue.length > 0) return;
	setTimeout(() => {
		if (spinnerQueue.length === 0) {
			const current = document.querySelector('.spinner');
			state.currentlyShowingLoadingAnim = false;
			document.body.removeChild(current);
			document.body.style.cursor = 'default';
		}
	}, 200);
}


/**
 * Connect to the API without all the checks and spinners and stuff
 * @param {string} path
 * @param {any} body
 * @returns {Promise<Record<string, any>>}
 */
export async function rawAPI (path, body) {
	return await new Promise(async (resolve) => {
		let res;

		body ||= {};
		body.session = getSession();

		try {
			res = await fetch(`${API_ROOT}/?${path}`, {
				method: 'POST',
				mode: 'cors',
				cache: 'no-cache',
				redirect: 'follow',
				body: JSON.stringify(body)
			}).catch((e) => {
				resolve({
					error: `Failed to fetch ${path}: ${e}`
				});
			});
		} catch (e) {
			resolve({
				error: `Failed to fetch ${path}: ${e}`
			});
		}

		let asJSON;
		try {
			asJSON = await res.json();
		} catch (e) {
			asJSON = {
				error: 'Failed to parse response as JSON'
			};
		}

		resolve(asJSON);
	});

}

/**
 * Show loading while requests are being made
 * but only show the spinner if no other requests are still pending,
 * which would mean the spinner is already being shown.

 * @param {string} path
 * @param {*} [body={}]
 * @returns {Promise<Record<string, any>>}
 */
export async function api (path, body=null) {
	let spinnerID = await showSpinner();

	if (typeof body !== 'object') {
		console.error('api called with non-object body: ', body);
		body = {};
	}
	body ||= {};
	body.session = getSession();

	// fetch
	// include '/' in request as otherwise you get redirected, which takes more time
	const res = await fetch(`${API_ROOT}/?${path}`, {
		method: 'POST',
		mode: 'cors',
		cache: 'no-cache',
		redirect: 'follow',
		body: JSON.stringify(body)
	}).catch(async err => {
		console.error(`Error with API request (${path}): `, err);
		stopSpinner(spinnerID);
		await showError('Something went wrong!');
	});

	if (res.status === 404) {
		await showError('Something went wrong! (404)');
		stopSpinner(spinnerID);
		return {};
	}

	let asJSON = {};
	try {
		// this might fail if the response is not JSON
		asJSON = await res.json();

		// don't try to show error in response if there is no response, so also in try block
		if (asJSON.error) {
			if (asJSON.status === 502) {
				await showError(`Looks like the server is down. Please try again later.`);
			} else {
				await showError(asJSON.error);
			}
		}

	} catch (err) {
		console.error('Error with API request: ', err);
		await showError('Something went wrong!');
	}

	stopSpinner(spinnerID);

	return asJSON;
}