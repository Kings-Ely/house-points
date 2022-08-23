import * as core from '../assets/js/main.js';
import HousePoint from '../assets/js/components/HousePoint.js';

const $hps = document.getElementById('hps');
const $hpReasonInp = document.getElementById('hp-reason');
const $info = document.getElementById('info');
const $themeButton = document.getElementById('switch-theme');

let theUsersInfo = null;
let me = false;

window.eventPopup = core.eventPopup;

(async () => {
    await core.init('..', true);

    reloadThemeButton();

    if (!core.GETParam('email')) {
        await core.navigate(`?email=${(await core.userInfo())['email']}`);
        return;
    }

    await reloadUserInfoFromEmail();

    me = (await core.userInfo())['email'] === core.GETParam('email');

    if (theUsersInfo.student) {
        await reloadHousePoints();
    }

    if (!theUsersInfo.admin) {
        await showInfo();
    } else {
        core.hide('#info');
    }

    core.reloadDOM();
})();

async function reloadUserInfoFromEmail() {
    const email = core.GETParam('email');

    theUsersInfo = await core.api(`get/users`, { email });

    core.reservoir.set('theUser', theUsersInfo);
}

async function housePoints() {
    const { housePoints: hps, accepted } = theUsersInfo;
    const admin = await core.isAdmin();

    $hps.innerHTML = `
        <h2>House Points (${core.escapeHTML(accepted)})</h2>
    `;

    if (hps.length === 0) {
        $hps.innerHTML += `
            <p style="font-size: 30px; margin: 50px; text-align: center">
                No house point yet!
            </p>
        `;
        return;
    }

    let html = '';

    for (let hp of hps) {
        html += core.inlineComponent(
            HousePoint,
            hp,
            async () => {
                await reloadUserInfoFromEmail();
                await housePoints();
            },
            {
                admin,
                showBorderBottom: hp !== hps[hps.length - 1],
                showEmail: false,
                showReason: true,
                showNumPoints: true,
                showDate: true,
                showRelativeTime: true,
                showStatusHint: true,
                showStatusIcon: true,
                showDeleteButton: !me,
                showPendingOptions: !me,
                reasonEditable: !me,
                pointsEditable: !me,
                dateEditable: !me,
                large: true
            }
        );
    }
    $hps.innerHTML += html;
}

async function showInfo() {
    $info.innerHTML = `
        <p>
            <b>${core.escapeHTML(theUsersInfo['accepted'])}</b> accepted, 
            <b>${core.escapeHTML(theUsersInfo['pending'])}</b> pending and 
            <b>${core.escapeHTML(theUsersInfo['rejected'])}</b> rejected house points.
        </p>
    `;

    // TODO: goals info here
}

async function reloadHousePoints() {
    await reloadUserInfoFromEmail();
    await housePoints();

    core.reloadDOM();
}

function reloadThemeButton() {
    const svg = core.getTheme() === 'dark' ? 'light-theme.svg' : 'dark-theme.svg';
    $themeButton.setAttribute('svg', svg);
}

document.getElementById('submit-hp').onclick = async () => {
    if (!$hpReasonInp.value) return;

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

$themeButton.onclick = async () => {
    core.setTheme(core.getInverseTheme());
    reloadThemeButton();
    core.reloadDOM();
};
