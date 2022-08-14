import * as core from "../assets/js/main.js";
import HousePoint from "../assets/js/components/HousePoint.js";

const $name = document.getElementById('name');
const $hps = document.getElementById('hps');
const $hpReasonInp = document.getElementById('hp-reason');
const $info = document.getElementById('info');
const $themeButton = document.getElementById('switch-theme');

let myUserInfo;
let me = false;

window.eventPopup = core.eventPopup;

(async () => {
    await core.init('..', true);

    reloadThemeButton();

    if (!core.GETParam('email')) {
        await core.navigate(`?email=${(await core.userInfo())['email']}`);
        return;
    }

    myUserInfo = await core.userInfo();

    await reloadUserInfoFromEmail();

    me = myUserInfo['email'] === core.GETParam('email');

    if ((await core.userInfo())['student']) {

        if (me || myUserInfo['admin']) {
            core.show('#submit-hp-request');
        }

        await reloadHousePoints();

    } else {
        await title();

        if ((await core.userInfo())['admin']) {
            $hps.innerHTML = `
                <a 
                    href="../admin/"
                    class="big-link"
                    svg="admin.svg"
                >Admin Dashboard</a>
            `;
            core.reloadDOM();
        } else {
            core.hide('#hps');
        }
    }

    if (!(await core.userInfo()).admin) {
        await showInfo();
    } else {
        core.hide('#info');
    }

    core.reloadDOM();
})();

async function reloadUserInfoFromEmail () {
    const email = core.GETParam('email');

    const info = await core.api(`get/users`, { email });

    await core.handleUserInfo(info);
}

async function housePoints () {
    const { housePoints: hps, accepted, admin } = await core.userInfo();

    $hps.innerHTML = `
        <h2>House Points (${accepted})</h2>
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
        html += core.inlineComponent(HousePoint, hp, reloadUserInfoFromEmail, {
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
        });
    }
    $hps.innerHTML += html;
}

async function title () {

    const info = await core.userInfo();

    const [ username, emailExt ] = info['email'].split('@');

    $name.innerHTML = `
        <p style="font-size: 3em">
            <span>
                ${username}
            </span>
            <span style="color: var(--text-v-light)">
                @${emailExt} ${info['admin'] ? ' (Admin)' : ''}
            </span>
        </p>
    `;
}

async function showInfo () {
    const info = await core.userInfo();

    const hpCount = info['accepted'];

    $info.innerHTML = `
        <p>
             <b>${hpCount}</b> accepted, 
            <b>${info['pending']}</b> pending and 
            <b>${info['rejected']}</b> rejected house points.
        </p>
    `;

    let goalsLeft = 0;

    for (let goal of core.AWARD_TYPES) {
        if (hpCount >= goal['points']) {
            $info.innerHTML += `
                <p>
                    Reached 'House ${goal['name']}' (${goal['required']})!
                </p>
            `;
        } else {
            $info.innerHTML += `
                <p>
                    Need 
                    <b>${goal['required'] - hpCount}</b>
                    more house points to reach 'House ${goal['name']}'.
                </p>
            `;
            goalsLeft++;
        }
    }

    if (goalsLeft === 0) {
        $info.innerHTML += `
            <p>
                Reached all house goals!
            </p>
        `;
    }
}

async function reloadHousePoints () {

    await reloadUserInfoFromEmail();
    await title();
    await housePoints();

    core.reloadDOM();
}

function reloadThemeButton () {
    const svg = core.getTheme() === 'dark' ? 'light-theme.svg' : 'dark-theme.svg'
    $themeButton.setAttribute('svg', svg);
}

document.getElementById('submit-hp').onclick = async () => {
    if (!$hpReasonInp.value) return;

    for (let reason of $hpReasonInp.value.split('\n')) {
        if (!reason) continue;
        await core.api(`create/house-points/request`, {
            userID: await core.userID(),
            description: reason,
            quantity: 1
        });
    }
    await reloadHousePoints();
    $hpReasonInp.value = '';
};


$themeButton.onclick = async () => {
    console.log(core.getInverseTheme());
    core.setTheme(core.getInverseTheme());
    reloadThemeButton();
    core.reloadDOM();
};