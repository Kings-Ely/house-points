// Utility script imported by all pages

const codeCookieKey = 'hpCode';

function getCode () {
    return getCookie(codeCookieKey);
}

function setCodeCookie (code) {
    setCookie(codeCookieKey, code);
}

const units = {
    year  : 24 * 60 * 60 * 1000 * 365,
    month : 24 * 60 * 60 * 1000 * 365/12,
    day   : 24 * 60 * 60 * 1000,
    hour  : 60 * 60 * 1000,
    minute: 60 * 1000,
    second: 1000
};

const rtf = new Intl.RelativeTimeFormat('en', {
    numeric: 'auto'
});

/**
 *
 * @param {number} d1
 * @param {number} [d2=new Date()]
 * @returns {string}
 */
const getRelativeTime = (d1, d2) => {
    d2 ||= Date.now();
    const elapsed = d1 - d2;

    // "Math.abs" accounts for both "past" & "future" scenarios
    for (const u in units) {
        if (Math.abs(elapsed) > units[u] || u === 'second') {
            return rtf.format(Math.round(elapsed/units[u]), u);
        }
    }
};

// src: https://stackoverflow.com/questions/14573223/set-cookie-and-get-cookie-with-javascript
/**
 * @param {string} name
 * @param {string} value
 * @param {number} days
 */
function setCookie (name, value='', days=1) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

/**
 * @param {string} name
 * @returns {string|null}
 */
function getCookie (name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' '){
            c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length, c.length);
        }
    }
    return null;
}

/**
 * @param {string} name
 */
function eraseCookie (name) {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

/**
 * @param {string} text
 * @returns {Promise<void>}
 */
window.copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
};

/**
 * Cleans a user code
 * @param {string} code
 * @returns {string}
 */
window.cleanCode = (code) => {
    return code
        .split('')
        // remove non-alphabetic characters
        .filter(c => 'abcdefghijklmnopqrstuvwxyz'.indexOf(c.toLowerCase()) !== -1)
        .join('')
        // default to upper case
        .toUpperCase()
        // max length
        .substring(0, 10);
}

/**
 * @param {HTMLElement} self
 * @returns {Promise<void>}
 */
async function loadSVG (self) {
    if (self.hasAttribute('svg-loaded')) {
        return;
    }
    // set before loading, so we don't load twice while waiting for the svg to load
    self.setAttribute('svg-loaded', '1');

    const raw = await fetch(self.attributes['svg'].value);
    self.innerHTML = await raw.text() + self.innerHTML;
}

/**
 * @param {HTMLElement} self
 */
function loadLabel (self) {
    if (self.hasAttribute('label-loaded')) {
        return;
    }
    self.setAttribute('label-loaded', '1');

    self.innerHTML = `
        <span class="label">
            ${self.attributes['label'].value}
        </span> 
        ${self.innerHTML}
    `;
}

// Spinner
const oldFetch = fetch;
let showingLoading = false;

function showSpinner () {
    document.body.style.cursor = 'progress';
    const loader = document.createElement('div');
    document.body.appendChild(loader);
    loader.classList.add('lds-ripple');
    loader.innerHTML = `<div></div><div></div>`;
    return loader;
}

function stopSpinner (loader) {
    showingLoading = false;
    document.body.removeChild(loader);
    document.body.style.cursor = 'default';
}

/**
 * Proxy fetch api to show loading while requests are being made
 * but only show the spinner if no other requests are still pending,
 * which would mean the spinner is already being shown.
 * @returns {Promise<Response>}
 * @param args
 */
window.fetch = async (...args) => {
    let shouldHideAtEnd = false;
    let loader;
    if (!showingLoading) {
        // pre-fetch
        showingLoading = true;
        shouldHideAtEnd = true;

        loader = showSpinner();
    }

    // fetch
    const res = await oldFetch(...args);

    if (shouldHideAtEnd) {
        // post fetch
        stopSpinner(loader);
    }

    return res;
};

/**
 * @returns {Promise<string>}
 * @param args
 */
async function fetchTxt (...args) {
    return await (await fetch(...args)).text();
}

/**
 * @returns {Promise<string>}
 * @param args
 */
async function fetchJSON (...args) {
    return await (await fetch(...args)).json();
}

/**
 * Only to be called by async loaded css onload
 */
function asyncCSS (self) {
    self.onload = null;
    self.rel = 'stylesheet';
}

async function loadSVGs () {
    const allInBody = document.querySelectorAll('*');
    for (const element of allInBody) {
        if (element.attributes['svg']) {
            // don't await, because we don't want to block the page load
            loadSVG(element);
        }

        if (element.attributes['label']) {
            loadLabel(element);
        }
    }
}


function footer (url) {
    $`footer`.load(url);
}
function nav (url) {
    $`nav`.load(url);
}

async function reloadDOM () {
    loadSVGs();
}

window.onload = reloadDOM;

/**
 * Navigates to a webpage
 * @param {string} url
 * @returns {Promise<never>}
 */
const navigate = async (url) => {
    if (!['', './', '.', location.pathname, location.href].includes(url)) {
        window.location.assign(url);
    }
    await new Promise(() => {});
}


let errorDiv;
/**
 * @param {string} message - parsed as HTML
 */
function showError (message) {
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'error-container';
        document.body.appendChild(errorDiv);
    }

    errorDiv.style.display = 'flex';

    errorDiv.innerHTML = `
        <p id="error">
            ${message}
            <span onclick="this.parentElement.parentElement.style.display='none'">&times;</span>
        </p>
    `;

    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}
