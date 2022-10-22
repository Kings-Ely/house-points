'use strict';
import * as core from './assets/js/main.js';

const $email = document.getElementById('email');
const $password = document.getElementById('password');

window.doLogIn = doLogIn;

(async () => {
    await core.init('.');

    if (core.GETParam('error')) {
        await core.showErrorFromCode(core.GETParam('error'));
    }

    if (await core.signedIn()) {
        await core.logoutAction();
    }
})();

$password.addEventListener('keydown', async evt => {
    if (evt.key === 'Enter') {
        await doLogIn();
    }
});

$email.addEventListener('keydown', async evt => {
    if (evt.key === 'Enter') {
        $password.focus();
    }
});

document.getElementById('forgotten-password').onclick = async () => {
    const email = window.hydrate.get('email');
    if (typeof email !== 'string' || email.length < 4) {
        await core.showError(`You need to enter a valid email first!`);
        return;
    }

    if (!confirm(`Are you sure you want to reset the password for '${email}'?`)) {
        return;
    }

    const res = await core.api(`create/sessions/for-forgotten-password`, {
        email
    });

    if (!res.ok || res.error) {
        return;
    }
    
    const popup = document.createElement('full-page-popup');
    popup.innerHTML = `
        An email has been sent to '${core.escapeHTML(email)}' with a link to reset your password.
    `;
    document.appendChild(popup);
};

async function doLogIn() {
    const email = window.hydrate.get('email');

    if (!email) {
        await core.showError(`You need to enter a valid email first!`);
        return;
    }

    const password = window.hydrate.get('password');

    if (!password) {
        await core.showError(`You need to enter a password first!`);
        return;
    }

    const res = await core.api(`create/sessions/from-login`, {
        email,
        password
    });

    if (res.error) {
        return;
    }

    const { sessionId } = res;

    if (!sessionId) {
        core.showError`Something went wrong!`;
        return;
    }

    if ((await core.setSessionCookie(sessionId)) instanceof Error) {
        // cookies error is now shown
        return;
    }

    let newPage = './user/?email=' + encodeURIComponent(email);

    if (core.GETParam('cb')) {
        newPage = decodeURIComponent(core.GETParam('cb'));
    }

    await core.navigate(newPage);
}