import * as core from '../assets/js/main.js';

const $hpReasonInp = document.getElementById('hp-reason');

/** @type {User|null} */
let theUsersInfo = null;
let me = false;

window.eventPopup = core.eventPopup;

(async () => {
    await core.init('..', true);

    if (!core.GETParam('email')) {
        await core.navigate(`?email=${(await core.userInfo())['email']}`);
        return;
    }

    await reloadUserInfoFromEmail();

    me = (await core.userInfo())['email'] === core.GETParam('email');
    
    window.hydrate.set({
        reloadHousePoints,
        me
    });

    if (theUsersInfo.student) {
        await reloadHousePoints();
    }
})();

async function reloadUserInfoFromEmail() {
    const email = core.GETParam('email');

    theUsersInfo = await core.api(`get/users`, { email });

    window.hydrate.set('theUser', theUsersInfo);
}


async function reloadHousePoints() {
    await reloadUserInfoFromEmail();
}

document.getElementById('submit-hp').onclick = async () => {
    if (!$hpReasonInp.value) return;
    if (!confirm('Are you sure you want to submit?')) return;

    for (let reason of $hpReasonInp.value.split('\n')) {
        if (!reason) continue;
        await core.api(`create/house-points/request`, {
            userId: theUsersInfo.id,
            description: reason,
            quantity: 1
        });
    }
    await reloadHousePoints();
    $hpReasonInp.value = '';
};
