import * as core from '../assets/js/main.js';

const $password = document.getElementById('password'),
    $passwordConfirm = document.getElementById('password-repeat'),
    $submit = document.getElementById('submit');

(async () => {
    await core.init('..');
    // note no auth requirements
    // this is due to the fact that the user might not be logged in at all
    // if they are using a 'forgot password' link

    if (!core.GETParam('s')) {
        await core.navigate(`?s=${encodeURIComponent(core.getSession())}`);
        return;
    }

    const s = decodeURIComponent(core.GETParam('s'));

    await core.eraseCookie(core.COOKIE_SESSION);

    const user = await core.api(`get/users`, { sessionId: s });

    if (!user.ok) {
        console.log(`Invalid user`, user);
        await core.navigate(`/?error=auth`);
        return;
    }
    
    core.reservoir.set('theUser', user);
})();

$submit.addEventListener('click', async () => {
    const s = decodeURIComponent(core.GETParam('s'));

    if (!s) {
        return;
    }

    const password = $password.value;
    const passwordConfirm = $passwordConfirm.value;

    if (password.length < 3) {
        await core.showError('Password too short');
        return;
    }

    if (password !== passwordConfirm) {
        await core.showError('Passwords do not match');
        return;
    }

    const res = await core.api(`update/users/password`, {
        sessionId: s,
        newPassword: password
    });

    if (res.ok) {
        await core.logoutAction();
    }
});
