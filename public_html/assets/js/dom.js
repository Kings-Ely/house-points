import * as core from './main.js';
import { loadSVG } from "./main.js";

/**
 * Hides an element by setting its display to 'none'
 * @param {string|HTMLElement} el
 */
export function hide(el) {
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
export function show(el, display = 'block') {
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
export async function showError(message) {
    await waitForReady();

    if (!state.$error) {
        state.$error = document.createElement('div');
        state.$error.id = 'error-container';
        document.body.appendChild(state.$error);
    }

    let myErrId = state.currentNotificationId++;

    while (state.visibleNotifications.length > core.MAX_NOTIFICATIONS) {
        let id = state.visibleNotifications.shift();
        document.getElementById(`error-${id}`).remove();
    }

    let errorMessage = document.createElement('div');
    errorMessage.innerHTML = `
        ${message}
        <span
        	onclick="this.parentElement.remove()"
        	style="font-size: 18px"
        >&times;</span>
    `;
    errorMessage.classList.add('error');
    errorMessage.id = `error-${myErrId}`;
    state.$error.appendChild(errorMessage);
    state.visibleNotifications.push(myErrId);

    setTimeout(() => {
        errorMessage.remove();
        state.visibleNotifications = state.visibleNotifications.filter(
            id => id !== myErrId
        );
    }, core.NOTIFICATION_SHOW_TIME);
}

/**
 * Shows an error from a code (a string)
 * @param {string} code
 * @returns {Promise<void>}
 */
export function showErrorFromCode(code) {
    return showError(
        {
            auth: 'You need to log in',
            'api-con': 'Lost connection to server',
            cookies: 'You have not accepted cookies',
        }[code] || 'An Unknown Error has Occurred'
    );
}

/**
 * Returns a promise which resolves once the document has been loaded
 * AND all necessary assets have been loaded from this script
 * @returns {Promise<void>}
 */
export async function waitForReady() {
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
export async function loadFooter() {
    const footerHTMLRes = await fetch(
        `${core.ROOT_PATH}/assets/html/footer.html`
    );
    state.$footer.innerHTML = await footerHTMLRes.text();
}

/**
 * Loads the navbar into the <nav> element
 * and updates it with the current user's info
 * @returns {Promise<void>}
 */
export async function loadNav() {
    const navRes = await fetch(`${core.ROOT_PATH}/assets/html/nav.html`);
    state.$nav.innerHTML = await navRes.text();
    document.getElementById('admin-link');
// replace links in nav relative to this page
    document.querySelectorAll('nav a').forEach(a => {
        a.setAttribute('href', `${core.ROOT_PATH}${a.getAttribute('href')}`);
    });

    // show page title
    const $center = document.querySelector('#nav-center');
    $center.innerHTML = `
        <div>
            <span class="hide-mobile">
                ${core.escapeHTML(core.HOUSE_NAME)}
                House Points -
            </span>
            <b>${core.escapeHTML(document.title)}</b>
        </div>
    `;
}

export async function domIsLoaded() {
    updateTheme();

    state.documentLoaded = true;

    for (const cb of state.onLoadCBs) {
        cb();
    }
}

/**
 * Scrolls the viewport to the top of the page
 */
export function scrollToTop() {
    document.body.scrollTop = document.documentElement.scrollTop = 0;
}

/**
 * Sets the data-theme attribute of the document body from the value stored in localStorage or the theme preference
 */
export function updateTheme() {
    const theme =
        getTheme() ||
        (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.body.setAttribute('data-theme', theme);
}

/**
 * Sets the localStorage theme value and then updates the theme
 * @param value
 */
export function setTheme(value = 'light') {
    localStorage.setItem(core.LS_THEME, value);
    updateTheme();
}
/**
 * Gets the localStorage theme value
 */
export function getTheme() {
    return localStorage.getItem(core.LS_THEME);
}

/**
 * Gets the localStorage theme value
 */
export function getInverseTheme() {
    return getTheme() === 'dark' ? 'light' : 'dark';
}

export function loadSettings() {
    let settingsButton = document.querySelector('.settings-button');
    if (!settingsButton) {
        settingsButton = document.createElement('button');
        settingsButton.classList.add('settings-button');
        settingsButton.setAttribute('svg', 'settings.svg');
    }

    window.hydrate.set({
        themeButtonSVG: 'light-theme.svg',
    });

    settingsButton.onclick = () => {
        const popup = document.createElement('full-page-popup');
        document.body.appendChild(popup);
        popup.innerHTML = window.hydrate.html`
            <button
                class="icon bordered"
                $svg="themeButtonSVG"
                @click="${() => {
                    core.setTheme(core.getInverseTheme());
                    const svg =
                        getTheme() === 'light' ? 'light-theme.svg' : 'dark-theme.svg';
                    window.hydrate.set('themeButtonSVG', svg);
                }}()"
            ></button>
        `;
        popup.setAttribute('title', 'Settings');
    };
}
