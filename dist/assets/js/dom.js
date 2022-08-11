import {
	state,
	HOUSE_NAME,
	navigate,
	ROOT_PATH,
	userInfo, LS_THEME
} from "./main.js";
import { loadSVGs } from "./svg.js";

/**
 * Kind of ew way of doing it. But it works.
 * Allows components to be inserted inline.
 * Works by repeatedly checking until it finds
 * the element and then inserting the component.
 * @param {Component} cb
 * @param {*} args
 * @returns {string}
 */
export function inlineComponent (cb, ...args) {

	const id = `insertComponentPlaceHolder${state.inlineComponentIndex++}Element`;

	const interval = setInterval(() => {
		try {
			const $el = document.getElementById(id);
			if ($el?.id !== id) return;

			cb(`#${id}`, ...args);
			clearInterval(interval);
		} catch (e) {
			console.error(e);
			clearInterval(interval);
		}
	}, 10);

	return `<span id="${id}"></span>`;
}


/**
 * Hides an element by setting its display to 'none'
 * @param {string|HTMLElement} el
 */
export function hide (el) {
	if (typeof el === 'string') {
		el = document.querySelector(el);
	}

	if (el) {
		el.style.display = 'none';
	} else {
		console.error(`hide: no element`);
	}
}

/**
 * Shows an element by setting its display to not 'none'
 * @param {string|HTMLElement} el
 * @param {string} [display='block']
 */
export function show (el, display = 'block') {
	if (typeof el === 'string') {
		el = document.querySelector(el);
	}

	if (el) {
		el.style.display = display;
	} else {
		console.error(`show: no element`);
	}
}

/**
 * @param {string} message - is parsed as HTML
 */
export async function showError (message) {
	await waitForReady();

	if (!state.$error) {
		state.$error = document.createElement('div');
		state.$error.id = 'error-container';
		document.body.appendChild(state.$error);
	}

	let myErrId = state.currentErrorMessageID++;

	while (state.currentlyShowingErrorMessageIDs.length > 4) {
		let id = state.currentlyShowingErrorMessageIDs.shift();
		document.getElementById(`error-${id}`).remove();
	}

	let errorMessage = document.createElement('div');
	errorMessage.innerHTML = `
        ${message}
        <span onclick="this.parentElement.remove()">&times;</span>
    `;
	errorMessage.classList.add('error');
	errorMessage.id = `error-${myErrId}`;
	state.$error.appendChild(errorMessage);
	state.currentlyShowingErrorMessageIDs.push(myErrId);

	setTimeout(() => {
		errorMessage.remove();
		state.currentlyShowingErrorMessageIDs = state.currentlyShowingErrorMessageIDs
			.filter(id => id !== myErrId);
	}, 5000);
}


/**
 * Shows an error from a code (a string)
 * @param {string} code
 * @returns {Promise<void>}
 */
export function showErrorFromCode (code) {
	return showError({

		'auth': 'You are not authorized for this action',
		'api-con': 'Lost connection to server',
		'cookies': 'You have not accepted cookies'

	}[code] || 'An Unknown Error has Occurred');
}

/**
 * Returns a promise which resolves once the document has been loaded
 * AND all necessary assets have been loaded from this script
 * @returns {Promise<void>}
 */
export async function waitForReady () {
	return await new Promise(resolve => {
		if (state.documentLoaded) {
			resolve();
			return;
		}
		state.onLoadCBs.push((...args) => resolve(...args));
	});
}

/**
 * Loads the footer into the <footer> element
 * @returns {Promise<void>}
 */
export async function loadFooter () {
	const footerHTMLRes = await fetch(`${ROOT_PATH}/assets/html/footer.html`);
	state.$footer.innerHTML = await footerHTMLRes.text();
}


/**
 * Loads the navbar into the <nav> element
 * and updates it with the current user's info
 * @returns {Promise<void>}
 */
export async function loadNav () {
	const navRes = await fetch(`${ROOT_PATH}/assets/html/nav.html`);
	state.$nav.innerHTML = await navRes.text();

	const $adminLink = document.getElementById('admin-link');
	const $username = document.getElementById('nav-username');
	const $homeLink = document.getElementById('home-link');


	// replace links in nav relative to this page
	document.querySelectorAll('nav a').forEach(a => {
		a.setAttribute('href',
			`${ROOT_PATH}${a.getAttribute('href')}`);
	});

	// show page title
	const $center = document.querySelector('#nav-center');
	$center.innerHTML = `
        <div>
            ${HOUSE_NAME} House Points - ${document.title}
        </div>
    `;

	const user = await userInfo();

	if (!user) return;

	$homeLink.href += `?email=${user.email}`;

	$username.innerText = user['email']?.split ('@')?.[0] || 'Unknown Name';

	if (user['admin']) {
		$adminLink.style.display = 'block';
		$adminLink.setAttribute('aria-hidden', 'false');
		$adminLink.onclick = () => {
			navigate(`/admin`);
		};

	}
}

/**
 * Traverses the DOM and runs some checks and stuff
 * Actually only adds new SVGs at the moment but might do more later.
 */
export function reloadDOM () {
	loadSVGs();
}

export async function domIsLoaded () {
	reloadDOM();

	state.documentLoaded = true;
	await setTheme();

	for (const cb of state.onLoadCBs) {
		cb();
	}
}

/**
 * Scrolls the viewport to the top of the page
 */
export function scrollToTop () {
	document.body.scrollTop = document.documentElement.scrollTop = 0;
}

/**
 * Sets the data-theme attribute of the document body from the value stored in localStorage or the theme preference
 * @returns {Promise<void>}
 */
export async function updateTheme () {
	const theme = localStorage.getItem(LS_THEME) || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
	document.body.setAttribute('data-theme', theme);
}

/**
 * Sets the localStorage theme value and then updates the theme
 * @param value
 */
export function setTheme (value='light') {
	localStorage.setItem(LS_THEME, value);
	document.body.setAttribute('data-theme', value);
}