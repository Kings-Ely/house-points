'use strict';
import * as core from './assets/js/main.js';
import FullPagePopup from './assets/js/components/FullPagePopup.js';

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

async function doLogIn() {
    const email = core.reservoir.get('email');

    if (!email) {
        await core.showError(`You need to enter a valid email first!`);
        return;
    }

    const password = core.reservoir.get('password');

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