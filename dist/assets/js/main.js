'use strict';
import CookiePopUp from "./components/CookiePopup.js";

// Utility script imported by all pages

// Global constants and variables
export const
    API_ROOT = 'https://josephcoppin.com/school/house-points/api',
    COOKIE_KEY = 'hpnea_SessionID',
    COOKIE_ALLOW_COOKIES_KEY = 'hpnea_AllowedCookies',
    ALT_COOKIE_KEY = 'hpnea_AltSessionID',
    HOUSE_NAME = 'Osmond',
    DEFAULT_PASSWORD = 'changeme',
    svgCache = {},
    AWARD_TYPES = [
        { name: 'Tie', required: 18 },
        { name: 'Cuff-links', required: 36 },
        { name: 'Hip-flask', required: 54 },
    ];

export let
    ROOT_PATH = '',
    $nav, $footer, $error,
    currentErrorMessageID = 0,
    currentlyShowingErrorMessageIDs = [],
    currentlyShowingLoadingAnim = false,
    userInfoCallbacks = [],
    userInfoJSON = null,
    altUserInfoJSON = null,
    isSignedIn = false,
    userInfoIsLoaded = false,
    onLoadCBs = [],
    documentLoaded = false;

window.logout = logout;
window.signInAs = signInAs;


// for making relative dates
/** @type {{[ k: 'month'|'hour'|'year'|'day'|'minute'|'second' ]: number}} */
const timeUnits = {
    year  : 24 * 60 * 60 * 1000 * 365,
    month : 24 * 60 * 60 * 1000 * 365 / 12,
    day   : 24 * 60 * 60 * 1000,
    hour  : 60 * 60 * 1000,
    minute: 60 * 1000,
    second: 1000
};

// for making relative dates
const relativeTimeFormat = new Intl.RelativeTimeFormat('en', {
    numeric: 'auto'
});

async function documentIsLoaded () {
    reloadDOM();

    documentLoaded = true;

    for (const cb of onLoadCBs) {
        cb();
    }
}

(async () => {
    if (document.readyState === 'complete') {
        await documentIsLoaded();
    } else {
        window.onload = documentIsLoaded;
    }
})();

/**
 * Must be called first
 * @param {string} rootPath path to root of site
 * @param {boolean} [requireLoggedIn=false] session cookies must be valid
 * @param {boolean} [requireAdmin=false] session cookies must be valid and admin
 * @param {boolean} [noApiTest=false] don't test the API connection
 */
export async function init (rootPath, requireLoggedIn=false, requireAdmin=false, noApiTest=false) {
    ROOT_PATH = rootPath;

    if (requireAdmin && getAltSession()) {
        await setSessionCookie(getAltSession());
        await setAltSessionCookie('');
    }

    if (!noApiTest) {
        await testApiCon();
    }

    if (getSession()) {
        rawAPI(`get/users/from-session/${getSession()}`)
            .then(handleUserInfo)
    } else {
        isSignedIn = false;
        userInfoIsLoaded = true;
        for (const cb of userInfoCallbacks) {
            cb({});
        }
    }

    const user = await userInfo();
    if (requireLoggedIn && (!user || !user['id'])) {
        await navigate('/?error=auth');
        return;
    }
    if (requireAdmin && !user['admin']) {
        await navigate('/?error=auth');
        return;
    }

    await waitForReady();

    // load footer and nav bar
    $nav = document.querySelector(`nav`);
    $footer = document.querySelector(`footer`);

    if ($nav) {
        await loadNav();
    }
    await loadFooter();

    cookiePopUp();

    reloadDOM();

    scrollToTop();
}

/**
 * Caches the user info
 * @param info
 * @returns {Promise<void>}
 */
export async function handleUserInfo (info) {
    if (getAltSession()) {
        const altInfo = await rawAPI(`get/users/from-session/${getAltSession()}`);
        if (altInfo['ok'] && altInfo['admin']) {
            // if we are already an admin with the main code, just delete the alt code
            if (info['admin']) {
                await eraseCookie(ALT_COOKIE_KEY);
            } else {
                altUserInfoJSON = altInfo;
            }
        }
    }

    isSignedIn = info.ok;

    if (!isSignedIn) {
        info = {};
    }
    userInfoJSON = info;
    userInfoIsLoaded = true;

    for (const cb of userInfoCallbacks) {
        cb(info);
    }

    userInfoCallbacks = [];
}

/**
 * Reloads the user info cache
 * @returns {Promise<void>}
 */
export async function reloadUserInfo () {
    userInfoIsLoaded = false;
    await handleUserInfo(await rawAPI(`get/users/from-session/${getSession()}`));
}

// user auth cookie utilities
export function getSession () {
    return getCookie(COOKIE_KEY);
}

export async function setSessionCookie (id) {
    await setCookie(COOKIE_KEY, id);
}

export function getAltSession () {
    return getCookie(ALT_COOKIE_KEY);
}

export async function setAltSessionCookie (id) {
    await setCookie(ALT_COOKIE_KEY, id);
}


/**
 * Gets the user info from the session stored in the session cookie
 * @returns {Promise<unknown>}
 */
export async function userInfo () {
    if (userInfoIsLoaded) {
        return userInfoJSON;
    }
    return new Promise(resolve => {
        userInfoCallbacks.push(resolve);
    });
}

/**
 * Gets the user ID from the session stored in the session cookie
 * @returns {Promise<string>}
 */
export async function userID () {
    const user = await userInfo();
    if (!user['id']){
        throw 'no user ID found';
    }
    return user['id'];
}

/**
 * @returns {Promise<boolean>}
 */
export async function isAdmin () {
    return (await userInfo())['admin'];
}

/**
 * Runs the callback when it is confirmed that the user is an admin
 * @param {() => any} cb
 */
export function asAdmin (cb) {
    isAdmin()
        .then((value) => {
            if (value) {
                cb();
            }
        });
}

/**
 * Returns true if the session stored in the cookie is valid
 * @returns {Promise<boolean>}
 */
export async function signedIn () {
    if (userInfoIsLoaded) {
        return isSignedIn;
    }
    return new Promise(resolve => {
        userInfoCallbacks.push(() => {
            resolve(isSignedIn);
        });
    });
}

/**
 * Gets the difference in the timestamps as a human-readable string, like '2 days' (ago)
 * Timestamps are in milliseconds.
 * @param {number} d1
 * @param {number?} [d2=Date.now()]
 * @returns {string}
 */
export function getRelativeTime (d1, d2) {
    if (isNaN(d1)) {
        console.error(`getRelativeTime: d1 '${d1}' is not a number`);
        return 'In the Past';
    }
    d2 ||= Date.now();
    const elapsed = d1 - d2;

    // "Math.abs" accounts for both "past" & "future" scenarios
    for (const u in timeUnits) {
        if (Math.abs(elapsed) > timeUnits[u] || u === 'second') {
            return relativeTimeFormat.format(Math.round(elapsed/timeUnits[u]), u);
        }
    }
}

// Cookie Utilities

// src: https://stackoverflow.com/questions/14573223/set-cookie-and-get-cookie-with-javascript
/**
 * Sets a cookie from a key and value.
 * First checks that the user has allowed cookies, and will navigate away if they haven't.
 * @param {string} name
 * @param {string} value
 * @param {number} [days=1]
 */
export async function setCookie (name, value, days=1) {

    if (getCookie(COOKIE_ALLOW_COOKIES_KEY) !== '1' && name !== COOKIE_ALLOW_COOKIES_KEY) {
        await showError('You must allow cookies to use this site.');
        return;
    }

    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

/**
 * Gets a cookie from a key.
 * @param {string} name
 * @returns {string|null}
 */
export function getCookie (name) {
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
 * Deletes a cookie with a given key.
 * First checks that the user has allowed cookies, and will navigate away if they haven't.
 * @param {string} name
 */
export async function eraseCookie (name) {
    if (getCookie(COOKIE_ALLOW_COOKIES_KEY) !== '1') {
        await showError('You must allow cookies to use this site.');
        return;
    }

    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

/**
 * Gets a GET parameter from the URL of the page
 * @param name
 */
export function GETParam (name) {
    let result = null,
        tmp = [];

    location.search
        .substring(1)
        .split("&")
        .forEach(function (item) {
            tmp = item.split("=");
            if (tmp[0] === name) {
                result = decodeURIComponent(tmp[1]);
            }
        });

    return result;
}

/**
 * Gets the SVG file content as plain text by fetching it
 * @param {string} uri
 * @returns {Promise<string|void>}
 */
export async function getSVGFromURI (uri) {
    if (svgCache[uri]) {
        return svgCache[uri];
    }

    // if not cached, then go get it
    const raw = await fetch(uri);
    if (!raw.ok) {
        console.error(`Failed to load SVG at '${uri}' for `, self);
        return;
    }
    let svg = await raw.text();

    svgCache[uri] = svg;
    return svg;
}

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
    currentlyShowingLoadingAnim = false;
    document.body.removeChild($spinner);
    document.body.style.cursor = 'default';
}


/**
 * Connect to the API without all the checks and spinners and stuff
 * @param path
 * @returns {Promise<{}>}
 */
export async function rawAPI (path) {
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
 * @param args
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

    let shouldHideAtEnd = false;
    let loader;
    if (!currentlyShowingLoadingAnim) {
        // pre-fetch
        currentlyShowingLoadingAnim = true;
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

/**
 * Looks at all DOM elements with an 'svg' attribute and loads the SVG
 * file into that element.
 */
export function loadSVGs () {
    const allInBody = document.querySelectorAll('[svg]');
    for (const element of allInBody) {
        // don't await, because we don't want to block the page load
        loadSVG(element)
            .then();
    }
}

/**
 * Caches the SVG file content
 * @param {string} uris
 */
export function preloadSVGs (...uris) {
    for (const uri of uris) {
        if (svgCache[uri]) {
            continue;
        }
        // don't await, because we want to load them all at the same time
        getSVGFromURI(ROOT_PATH + '/assets/img/' + uri)
            .then();
    }
}

/**
 * Loads the SVG file content into the element
 * Adds the SVG HTML before the rest of the contents
 * of the element.
 * @param {HTMLElement} $el
 * @returns {Promise<void>}
 */
export async function loadSVG ($el) {
    // if the SVG has already been loaded then skip
    if ($el.hasAttribute('svg-loaded')) {
        return;
    }
    // set before loading, so we don't load twice while waiting for the svg to load
    $el.setAttribute('svg-loaded', '1');

    const uri = ROOT_PATH + '/assets/img/' + $el.attributes['svg'].value;

    $el.innerHTML = await getSVGFromURI(uri) + $el.innerHTML;
}

/**
 * Loads the navbar into the <nav> element
 * and updates it with the current user's info
 * @returns {Promise<void>}
 */
export async function loadNav () {
    const navRes = await fetch(`${ROOT_PATH}/assets/html/nav.html`);
    $nav.innerHTML = await navRes.text();

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

    const username = user['email']?.split('@')?.[0] || 'Unknown Name';

    $username.innerText = username;

    if (user['admin']) {
        $adminLink.style.display = 'block';
        $adminLink.setAttribute('aria-hidden', 'false');
        $adminLink.onclick = () => {
            navigate(`/admin`);
        };

    } else if (altUserInfoJSON) {

        const altUsername = altUserInfoJSON['email']
            .split('@')?.[0] || 'Unknown Alt';

        $adminLink.style.display = 'block';
        $adminLink.setAttribute('aria-hidden', 'false');
        $adminLink.onclick = () => {
            setSessionCookie(getAltSession());
            navigate(`/admin`);
        };

        $username.innerHTML = `${username} (${altUsername})`;
    }
}


/**
 * Tries to sign you in as the user with the given ID.
 * @param {string} id
 * @param {string} email
 * @returns {Promise<void>}
 */
async function signInAs (id, email) {
    if (!await isAdmin()) {
        return;
    }

    if (!confirm(`Sign in as ${email}?`)) {
        return;
    }

    const { sessionID } = await api`create/sessions/from-user-id/${id}`;

    if (!sessionID) {
        return;
    }

    await setAltSessionCookie(getSession());
    await setSessionCookie(sessionID);
    await navigate(`/user/?email=${email}`);
}

/**
 * Loads the footer into the <footer> element
 * @returns {Promise<void>}
 */
export async function loadFooter () {
    const footerHTMLRes = await fetch(`${ROOT_PATH}/assets/html/footer.html`);
    $footer.innerHTML = await footerHTMLRes.text();
}

/**
 * Traverses the DOM and runs some checks and stuff
 * Actually only adds new SVGs at the moment but might do more later.
 */
export function reloadDOM () {
    loadSVGs();
}

/**
 * Navigates to a webpage
 * @param {string} url
 * @returns {Promise<never>}
 */
export const navigate = async (url) => {
    await waitForReady();

    if (url[0] === '/') {
        url = ROOT_PATH + url;
    }

    window.location.assign(url);
    // never resolve promise as just wait for the page to load
    await new Promise(() => {});
}

/**
 * @param {string} message - is parsed as HTML
 */
export async function showError (message) {
    await waitForReady();

    if (!$error) {
        $error = document.createElement('div');
        $error.id = 'error-container';
        document.body.appendChild($error);
    }

    let myErrId = currentErrorMessageID++;

    while (currentlyShowingErrorMessageIDs.length > 4) {
        let id = currentlyShowingErrorMessageIDs.shift();
        document.getElementById(`error-${id}`).remove();
    }

    let errorMessage = document.createElement('div');
    errorMessage.innerHTML = `
        ${message}
        <span onclick="this.parentElement.remove()">&times;</span>
    `;
    errorMessage.classList.add('error');
    errorMessage.id = `error-${myErrId}`;
    $error.appendChild(errorMessage);
    currentlyShowingErrorMessageIDs.push(myErrId);

    setTimeout(() => {
        errorMessage.remove();
        currentlyShowingErrorMessageIDs = currentlyShowingErrorMessageIDs
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
 * Checks if the user has allowed cookies
 * and if not then shows a popup to get them to allow them
 */
export function cookiePopUp () {
    if (getCookie(COOKIE_ALLOW_COOKIES_KEY)) {
        return;
    }

    const $cookiePopUp = document.createElement('div');
    $cookiePopUp.id = 'cookie-popup';
    CookiePopUp($cookiePopUp);
    document.body.appendChild($cookiePopUp);
}



/**
 * Prompts the user with 'confirm' and then
 * removes all authentication cookies and
 * redirects to the login page
 * @returns {Promise<void>}
 */
export async function logout () {
    if (!confirm(`Are you sure you want to sign out?`)) {
        return;
    }
    await logoutAction();
}

/**
 * Deletes all authentication cookies and
 * redirects to the login page
 * @returns {Promise<void>}
 */
export async function logoutAction () {
    await eraseCookie(COOKIE_KEY);
    await eraseCookie(ALT_COOKIE_KEY);
    await navigate(ROOT_PATH);
}

/**
 * Pings the server and if the ping fails
 * navigates the user to the login page
 * which will show that this error
 * @returns {Promise<void>}
 */
export async function testApiCon () {
    const res = await api`get/server/ping`
        .catch(err => {
            console.error(err);
            if (GETParam('error') !== 'api-con') {
                navigate('/?error=api-con');
            }
        });

    if (!res.ok || res.status !== 200) {
        console.error(res);
        if (GETParam('error') !== 'api-con') {
            await navigate('/?error=api-con')
        }
    }
}

/**
 * Returns a promise which resolves once the document has been loaded
 * AND all necessary assets have been loaded from this script
 * @returns {Promise<void>}
 */
export async function waitForReady () {
    return await new Promise(resolve => {
        if (documentLoaded) {
            resolve();
            return;
        }
        onLoadCBs.push((...args) => resolve(...args));
    });
}

/**
 * Returns a promise which resolves after a set amount of time
 * @param {number} ms
 * @returns {Promise<void>}
 */
export async function sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Scrolls the viewport to the top of the page
 */
export function scrollToTop () {
    document.body.scrollTop = document.documentElement.scrollTop = 0;
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
 * Hides an element by setting its opacity to '0'
 * @param {string|HTMLElement} el
 */
export function makeTransparent (el) {
    if (typeof el === 'string') {
        el = document.querySelector(el);
    }

    if (el) {
        el.style.opacity = '0';
    } else {
        console.error(`makeTransparent: no element`);
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
 * Limits the length of a string by cutting it and adding '...'
 * to the end if it's too long
 * @param {string} str
 * @param {number} [maxLength=50]
 * @returns {string}
 */
export function limitStrLength (str, maxLength=50) {
    if (str.length > maxLength - 3) {
        return str.substring(0, maxLength-3) + '...';
    }
    return str;
}

/**
 * Gets the contents of the file as a string
 * @param {string|HTMLInputElement} $el
 * @param {string} encoding
 * @returns {Promise<string>}
 */
export async function getFileContent ($el, encoding='UTF-8') {
    if (typeof $el === 'string') {
        $el = document.querySelector($el);
    }

    // assumed to be file input element
    const file = $el.files[0];

    if (!file) return '';

    const reader = new FileReader();
    reader.readAsText(file, encoding);

    return await new Promise((resolve, reject) => {
        reader.onload = evt => {
            resolve(evt.target.result);
        }
        reader.onerror = async () => {
            await showError("Error reading file, please try again");
            reject("Error reading file");
        }
    });
}

/**
 * ref: http://stackoverflow.com/a/1293163/2343
 * This will parse a delimited string into an array of arrays.
 * The default delimiter is the comma, but this can be overriden
 * with the second argument.
 * @param {string} strData
 * @param {string} [strDelimiter=undefined]
 * @returns {*[][]}
 */
export function CSVToArray (strData, strDelimiter) {
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter ||= ',';

    // Create a regular expression to parse the CSV values.
    const objPattern = new RegExp(
        (
            // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

            // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
    );

    // Create an array to hold our data. Give the array
    // a default empty first row.
    let arrData = [[]];

    // Create an array to hold our individual pattern
    // matching groups.
    let arrMatches;

    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec(strData)) {
        // Get the delimiter that was found.
        let strMatchedDelimiter = arrMatches[1];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (
            strMatchedDelimiter.length &&
            strMatchedDelimiter !== strDelimiter
        ) {

            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push([]);
        }

        let strMatchedValue;

        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[2]) {

            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            strMatchedValue = arrMatches[2].replace(
                new RegExp( "\"\"", "g" ),
                "\""
            );

        } else {
            // We found a non-quoted value.
            strMatchedValue = arrMatches[3];
        }

        // Now that we have our value string, let's add
        // it to the data array.
        arrData[arrData.length - 1].push(strMatchedValue);
    }

    // Return the parsed data.
    return arrData;
}