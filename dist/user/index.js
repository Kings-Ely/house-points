import * as core from "../assets/js/main.js";


const $name = document.getElementById('name');
const $hps = document.getElementById('hps');
const $hpReasonInp = document.getElementById('hp-reason');
const $info = document.getElementById('info');

let myUserInfo;
let me = false;

window.eventPopup = core.eventPopup;

(async () => {
    await core.init('..', true);

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
})();

async function reloadUserInfoFromEmail () {
    const email = core.GETParam('email');

    const info = await core.api`get/users/from-email/${email}`;

    await core.handleUserInfo(info);
}

async function housePoints () {
    const { housePoints: hps, accepted } = await core.userInfo();

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
        html += showHp(hp);
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

function showHp (hp) {
    let acceptedHTML;
    let icon = '';

    if (hp['status'] === 'Rejected') {
        acceptedHTML = `
            Rejected ${core.getRelativeTime(hp['completed'] * 1000)}
            <br>
            <b>"${hp['rejectMessage']}"</b>
        `;
        icon = 'red-cross.svg';

    } else if (hp['status'] === 'Accepted') {
        acceptedHTML = `
            Accepted ${core.getRelativeTime(hp['completed'] * 1000)}
        `;
        icon = 'accent-tick.svg';

    } else {
        acceptedHTML = 'Not Yet Accepted';
        icon = 'pending.svg';
    }

    const submittedTime = hp['created'] * 1000;

    return `
        <div class="house-point">
            <div style="min-width: 50%">
                ${hp['eventName'] ? `
                    <button
                        data-label="View Event"
                        onclick="eventPopup('${hp['eventID']}')"
                        aria-label="${hp['eventName']}"
                        svg="event.svg"
                        class="icon small evt-link"
                        style="--offset-x: 50px"
                    >
                        <b>${hp['eventName']}</b>
                    </button>
                ` : ''}
                ${hp['description']}
                ${hp['quantity'] > 1 ? `
                    (${hp['quantity']} points)
                ` : ''}
            </div>
            <div style="min-width: calc(40% - 60px)">
                ${new Date(submittedTime).toDateString()}
                (${core.getRelativeTime(submittedTime)})
                <br>
                ${acceptedHTML}
            </div>
            <div 
                style="min-width: 50px"
                svg="${icon}"
                data-label="${hp['status']}"
                class="icon icon-info-only"
            >
            </div>
        </div>
    `;
}

async function reloadHousePoints () {

    await reloadUserInfoFromEmail();

    await title();

    await housePoints();

    core.reloadDOM();
}



document.getElementById('submit-hp').onclick = async () => {
    if (!$hpReasonInp.value) return;

    for (let reason of $hpReasonInp.value.split('\n')) {
        if (!reason) continue;
        await core.api`create/house-points/request/${await core.userID()}/1?description=${reason}`;
    }
    await reloadHousePoints();
    $hpReasonInp.value = '';
};
