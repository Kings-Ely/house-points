// Utility script imported by all pages


// Global constants and variables
const
    API_ROOT = 'https://josephcoppin.com/school/house-points/api',
    COOKIE_KEY = 'hpnea_SessionID',
    COOKIE_ALLOW_COOKIES_KEY = 'hpnea_AllowedCookies',
    ALT_COOKIE_KEY = 'hpnea_AltSessionID',
    HOUSE_NAME = 'Osmond',
    DEFAULT_PASSWORD = 'changeme',
    svgCache = {};

let
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
    onLoadCBs = [ () => console.log('Document Loaded') ],
    documentLoaded = false;


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
(async () => {

    if (document.readyState === 'complete') {
        documentIsLoaded();
    } else {
        window.onload = documentIsLoaded;
    }

    await testApiCon();

    async function documentIsLoaded () {
        reloadDOM();

        documentLoaded = true;

        for (const cb of onLoadCBs) {
            cb();
        }
    }
})();

/**
 * Must be called first
 * @param {string} rootPath
 * @param {boolean} requireLoggedIn
 * @param {boolean} requireAdmin
 */
async function init (rootPath, requireLoggedIn=false, requireAdmin=false) {
    ROOT_PATH = rootPath;

    if (requireAdmin && getAltSession()) {
        await setSessionCookie(getAltSession());
        await setAltSessionCookie('');
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

    // load footer and nav bar
    $nav = document.querySelector(`nav`);
    $footer = document.querySelector(`footer`);

    $footer.innerHTML = await (await fetch(`${ROOT_PATH}/assets/html/footer.html`)).text();
    if ($nav) {
        await loadNav();
    }

    reloadDOM();

    await loadScript('/assets/js/components.js');

    await waitForReady();

    scrollToTop();
    cookiePopUp();
}

async function handleUserInfo (info) {
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
}

async function reloadUserInfo () {
    await handleUserInfo(await rawAPI(`get/users/from-session/${getSession()}`));
}

// user auth cookie utilities
function getSession () {
    return getCookie(COOKIE_KEY);
}

async function setSessionCookie (id) {
    await setCookie(COOKIE_KEY, id);
}

function getAltSession () {
    return getCookie(ALT_COOKIE_KEY);
}

async function setAltSessionCookie (id) {
    await setCookie(ALT_COOKIE_KEY, id);
}


/**
 * Gets the user info from the session stored in the session cookie
 * @returns {Promise<unknown>}
 */
async function userInfo () {
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
async function userID () {
    const user = await userInfo();
    if (!user['id']){
        throw 'no user ID found';
    }
    return user['id'];
}

async function isAdmin () {
    return (await userInfo())['admin'];
}

function asAdmin (cb) {
    isAdmin().then((value) => {
        if (value) cb();
    });
}

/**
 * Returns true if the session stored in the cookie is valid
 * @returns {Promise<boolean>}
 */
async function signedIn () {
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
function getRelativeTime (d1, d2) {
    if (isNaN(d1)) {
        console.error('getRelativeTime: d1 is not a number');
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

/**
 * Loads a JS script from an url.
 * If the url starts with '/', imports relative to ROOT_PATH.
 * Resolves the promise once the script has been loaded.
 * @param {string} url
 * @returns {Promise<unknown>}
 */
async function loadScript (url) {

    const script = document.createElement('script');
    script.type = 'text/javascript';

    if (url[0] === '/') {
        url = ROOT_PATH + url;
    }

    script.src = url;

    return await new Promise(resolve => {
        // Then bind the event to the callback function.
        // There are several events for cross browser compatibility.
        script.onreadystatechange = resolve;
        script.onload = resolve;

        // Fire the loading
        document.head.appendChild(script);
    });
}

// Cookie Utilities

// src: https://stackoverflow.com/questions/14573223/set-cookie-and-get-cookie-with-javascript
/**
 * @param {string} name
 * @param {string} value
 * @param {number} days
 */
async function setCookie (name, value='', days=1) {

    if (getCookie(COOKIE_ALLOW_COOKIES_KEY) !== '1' && name !== COOKIE_ALLOW_COOKIES_KEY) {
        await navigate('/?error=cookies');
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
async function eraseCookie (name) {
    if (getCookie(COOKIE_ALLOW_COOKIES_KEY) !== '1') {
        await navigate('/?error=cookies');
        return;
    }

    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

/**
 * Gets a GET parameter from the URL of the page
 * @param name
 */
function GETParam (name) {
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
async function getSVGFromURI (uri) {
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

async function preloadSVGs (...uris) {
    for (const uri of uris) {
        await getSVGFromURI(ROOT_PATH + '/assets/img/' + uri);
    }
}

/**
 * @param {HTMLElement} self
 * @returns {Promise<void>}
 */
async function loadSVG (self) {
    // if the SVG has already been loaded then skip
    if (self.hasAttribute('svg-loaded')) {
        return;
    }
    // set before loading, so we don't load twice while waiting for the svg to load
    self.setAttribute('svg-loaded', '1');

    const uri = ROOT_PATH + '/assets/img/' + self.attributes['svg'].value;

    self.innerHTML = await getSVGFromURI(uri) + self.innerHTML;
}

// Spinner

async function showSpinner () {
    await waitForReady();

    document.body.style.cursor = 'progress';

    const loader = document.createElement('div');
    loader.classList.add('spinner');
    loader.innerHTML = `<div><div></div><div></div><div></div><div></div></div>`;

    document.body.appendChild(loader);

    return loader;
}

function stopSpinner (loader) {
    currentlyShowingLoadingAnim = false;
    document.body.removeChild(loader);
    document.body.style.cursor = 'default';
}


/**
 * Connect to the API without all the checks and spinners and stuff
 * @param path
 * @returns {Promise<{}>}
 */
async function rawAPI (path) {
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

 * @param {string | TemplateStringsArray} path
 * @param args
 * @returns {Promise<Record<string, any>>}
 */
async function api (path, ...args) {

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
 * Only to be called by async loaded css onload
 */
function asyncCSS (self) {
    self.onload = null;
    self.rel = 'stylesheet';
}

function loadSVGs () {
    const allInBody = document.querySelectorAll('*');
    for (const element of allInBody) {
        if (element.attributes['svg']) {
            // don't await, because we don't want to block the page load
            loadSVG(element).then();
        }
    }
}

async function loadNav () {
    $nav.innerHTML = await (await fetch(`${ROOT_PATH}/assets/html/nav.html`)).text();

    const $adminLink = document.getElementById('admin-link');
    const $username = document.getElementById('nav-username');

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

    const username = user['email']?.split('@')?.[0] || 'Unknown Name';

    $username.innerText = username;

    if (user['admin']) {
        $adminLink.style.display = 'block';
        $adminLink.setAttribute('aria-hidden', 'false');
        $adminLink.onclick = () => {
            navigate(`/admin`);
        };
    } else if (altUserInfoJSON) {

        const altUsername = altUserInfoJSON['email']?.split('@')?.[0] || 'Unknown Alt';

        $adminLink.style.display = 'block';
        $adminLink.setAttribute('aria-hidden', 'false');
        $adminLink.onclick = () => {
            setSessionCookie(getAltSession());
            navigate(`/admin`);
        };

        $username.innerHTML = `${username} (${altUsername})`;
    }
}

function reloadDOM () {
    loadSVGs();
}

/**
 * Navigates to a webpage
 * @param {string} url
 * @returns {Promise<never>}
 */
const navigate = async (url) => {
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
async function showError (message) {
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
        currentlyShowingErrorMessageIDs = currentlyShowingErrorMessageIDs.filter(id => id !== myErrId);
    }, 5000);
}


/**
 * Shows an error from a code (a string)
 * @param {string} code
 * @returns {Promise<void>}
 */
function showErrorFromCode (code) {
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
function cookiePopUp () {
    if (getCookie(COOKIE_ALLOW_COOKIES_KEY)) {
        return;
    }

    const $cookiePopUp = document.createElement('div');
    $cookiePopUp.id = 'cookie-popup';
    insertComponent($cookiePopUp).cookiePopUp();
    document.body.appendChild($cookiePopUp);
}



/**
 * Removes all authentication cookies and redirects to the login page
 * @returns {Promise<void>}
 */
async function logout () {
    if (!confirm(`Are you sure you want to sign out?`)) {
        return;
    }
    await logoutAction();
}

async function logoutAction () {
    await eraseCookie(COOKIE_KEY);
    await eraseCookie(ALT_COOKIE_KEY);
    await navigate(ROOT_PATH);
}

async function testApiCon () {

    const res = await api`get/server/ping`
        .catch(err => {
            console.error(err);
            navigate('/?error=api-con');
        });

    if (!res.ok || res.status === 200) {
        console.log('API connection OK');
    } else {
        console.error(res);
        await navigate('/?error=api-con')
    }
}

/**
 * Returns a promise which resolves once the document has been loaded
 * AND all necessary assets have been loaded from this script
 * @returns {Promise<void>}
 */
function waitForReady () {
    return new Promise(resolve => {
        if (documentLoaded) {
            resolve();
            return;
        }
        onLoadCBs.push((...args) => resolve(...args));
    });
}

async function sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function scrollToTop () {
    document.body.scrollTop = document.documentElement.scrollTop = 0;
}

/**
 * Hides an element by setting its display to 'none'
 * @param {string|HTMLElement} el
 */
function hide (el) {
    if (typeof el === 'string') {
        el = document.querySelector(el);
    }
    if (el) {
        el.style.display = 'none';
    } else {
        console.error(`hide: no element with id '${el?.id}'`);
    }
}

/**
 * Shows an element by setting its display to not 'none'
 * @param {string|HTMLElement} el
 * @param {string} [display='block']
 */
function show (el, display = 'block') {
    if (typeof el === 'string') {
        el = document.querySelector(el);
    }
    if (el) {
        el.style.display = display;
    } else {
        console.error(`showWithID: no element with id '${el.id}'`);
    }
}

/**
 * Limits the length of a string by cutting it and adding '...' to the end if it's too long
 * @param {string} str
 * @param {number} [maxLength=50]
 * @returns {string}
 */
function limitStrLength (str, maxLength=50) {
    if (str.length > maxLength-3) {
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
async function getFileContent ($el, encoding='UTF-8') {
    if (typeof $el === 'string') {
        $el = document.querySelector($el);
    }

    const file = $el.files[0];

    if (!file) return '';

    return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsText(file, encoding);

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
function CSVToArray (strData, strDelimiter) {
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter = (strDelimiter || ",");

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
    let arrMatches = null;

    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec( strData )){
        // Get the delimiter that was found.
        let strMatchedDelimiter = arrMatches[ 1 ];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (
            strMatchedDelimiter.length &&
            strMatchedDelimiter !== strDelimiter
        ){

            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push( [] );
        }

        let strMatchedValue;

        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[ 2 ]){

            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            strMatchedValue = arrMatches[ 2 ].replace(
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