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
            c = c.substring(1,c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length,c.length);
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
 * @param {RequestInfo} input
 * @param {RequestInit|undefined} [init=undefined]
 * @returns {Promise<Response>}
 */
window.fetch = async (input, init) => {
    let shouldHideAtEnd = false;
    let loader;
    if (!showingLoading) {
        // pre-fetch
        showingLoading = true;
        shouldHideAtEnd = true;

        loader = showSpinner();
    }

    // fetch
    const res = await oldFetch(input, init);

    if (shouldHideAtEnd) {
        // post fetch
        stopSpinner(loader);
    }

    return res;
};

/**
 * Only to be called by async loaded css onload
 */
function asyncCSS (self) {
    self.onload = null;
    self.rel = 'stylesheet';
}
