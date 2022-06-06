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

// proxy fetch api to show loading while requests are being made
const oldFetch = fetch;
window.fetch = async (...args) => {
    // pre-fetch
    document.body.style.cursor = 'progress';
    const loader = document.createElement('div');
    document.body.appendChild(loader)
    loader.id = 'loader';
    loader.innerHTML = `<div id="loader-center"></div>`;

    // fetch
    const res = await oldFetch(...args);

    // post fetch
    document.body.removeChild(loader);
    document.body.style.cursor = 'default';

    return res;
};