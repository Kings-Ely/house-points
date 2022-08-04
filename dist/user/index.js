const $name = document.getElementById('name');
const $hps = document.getElementById('hps');
const $hpReasonInp = document.getElementById('hp-reason');

(async () => {
    await init('..', true);

    if (!await signedIn()) {
        await navigate(`/?error=auth`);
    }

    if ((await userInfo())['student']) {
        show('#submit-hp-request');
        await reloadHousePoints();

    } else {
        await title();

        if ((await userInfo())['admin']) {
            $hps.innerHTML = `
                <a 
                    href="../admin/"
                    class="big-link"
                    svg="admin.svg"
                >Admin Dashboard</a>
            `;
            reloadDOM();
        } else {
            hide('#hps');
        }
    }
})();

async function housePoints () {
    const hps = (await userInfo())['housePoints'];
    if (hps.length === 0) {
        $hps.innerHTML = `
            <p style="font-size: 30px; margin: 50px; text-align: center">
                Looks like you haven't got any house point yet!
            </p>
        `;
        return;
    }

    let html = '';

    for (let hp of hps) {
        html += showHp(hp);
    }
    $hps.innerHTML = html;
}

async function title () {

    const info = await userInfo();

    const [ username, emailExt ] = info['email'].split('@');

    const name = `
        <p style="font-size: 3em">
            <span>
                ${username}
            </span>
            <span style="color: var(--text-v-light)">
                @${emailExt} ${info['admin'] ? ' (Admin)' : ''}
            </span>
        </p>
    `;

    if (info['student']) {
        const numHps = info['accepted'];

        if (numHps < 1) {
            $name.innerHTML = `
                ${name} has No House Points
            `;
        } else {
            $name.innerHTML = `    
                ${name} has ${numHps} House Point${numHps < 2 ? '' :'s'}
            `;
        }
    } else {
        $name.innerHTML = `
            ${name}
        `;
    }
}

function showHp (hp) {
    let acceptedHTML;
    let icon = '';

    if (hp['status'] === 'Rejected') {
        acceptedHTML = `
            Rejected ${getRelativeTime(hp['completed'] * 1000)}
            <br>
            <b>"${hp['rejectMessage']}"</b>
        `;
        icon = 'red-cross.svg';

    } else if (hp['status'] === 'Accepted') {
        acceptedHTML = `
            Accepted ${getRelativeTime(hp['completed'] * 1000)}
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
                    <a
                       data-label="View ${hp['eventName']}"
                        href="../events?id=${hp['eventID']}"
                        aria-label="${hp['eventName']}"
                        svg="event.svg"
                        class="icon small evt-link"
                        style="--offset-x: 50px"
                    >
                        <b>${hp['eventName']}</b>
                    </a>
                ` : ''}
                ${hp['description']}
                ${hp['quantity'] > 1 ? `
                    (${hp['quantity']} points)
                ` : ''}
            </div>
            <div style="min-width: calc(40% - 60px)">
                ${new Date(submittedTime).toDateString()}
                (${getRelativeTime(submittedTime)})
                <br>
                ${acceptedHTML}
            </div>
            <div 
                style="min-width: 50px"
                svg="${icon}"
               data-label="${hp['status']}"
            >
            </div>
        </div>
    `;
}

async function reloadHousePoints () {

    await reloadUserInfo();

    await title();

    await housePoints();

    reloadDOM();
}



document.getElementById('submit-hp').onclick = async () => {
    if (!$hpReasonInp.value) return;

    for (let reason of $hpReasonInp.value.split('\n')) {
        if (!reason) continue;
        await api`create/house-points/request/${await userID()}/1?description=${reason}`;
    }
    await reloadHousePoints();
    $hpReasonInp.value = '';
};

