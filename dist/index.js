// Utility script imported by all pages

const units = {
    year  : 24 * 60 * 60 * 1000 * 365,
    month : 24 * 60 * 60 * 1000 * 365/12,
    day   : 24 * 60 * 60 * 1000,
    hour  : 60 * 60 * 1000,
    minute: 60 * 1000,
    second: 1000
};

const rtf = new Intl.RelativeTimeFormat('en', {
    numeric: 'auto',
});

const getRelativeTime = (d1, d2 = new Date()) => {
    const elapsed = d1 - d2;

    // "Math.abs" accounts for both "past" & "future" scenarios
    for (const u in units) {
        if (Math.abs(elapsed) > units[u] || u === 'second') {
            return rtf.format(Math.round(elapsed/units[u]), u);
        }
    }
};

window.copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
};

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

// Proxy fetch api to show loading while requests are being made
// but only show the spinner if no other requests are still pending,
// which would mean the spinner is already being shown.
const oldFetch = fetch;
let showingLoading = false;
window.fetch = async (...args) => {
    let shouldHideAtEnd = false;
    let loader;
    if (!showingLoading) {
        // pre-fetch
        showingLoading = true;
        document.body.style.cursor = 'progress';
        loader = document.createElement('div');
        document.body.appendChild(loader)
        loader.id = 'loader';
        loader.innerHTML = `<div id="loader-center"></div>`;
    }

    // fetch
    const res = await oldFetch(...args);

    if (shouldHideAtEnd) {
        // post fetch
        showingLoading = false;
        document.body.removeChild(loader);
        document.body.style.cursor = 'default';
    }


    return res;
};