const $name = document.getElementById('name');
const $hps = document.getElementById('hps');
const $hpReasonInp = document.getElementById('hp-reason');

function housePoints (hps) {
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

function title (info, hps) {
    const numHps = hps.filter(c => c['accepted'] && !c['rejectMessage']).length;

    if (numHps < 1) {
        $name.innerHTML = `
            <p style="font-size: 50px">
                ${info['name']} has No House Points
            </p>
        `;
    } else {
        $name.innerHTML = `
            <p style="font-size: 50px">
                ${info['name']} has ${numHps} House Point${numHps < 2 ? '' :'s'}
            </p>
        `;
    }
}

function showHp (hp) {
    let acceptedHTML;
    let icon = 'red-cross.svg';

    if (hp['status'] === 'Rejected') {
        acceptedHTML = `
            Rejected ${getRelativeTime(hp['completed'] * 1000)}
            <br>
            <b>"${hp['rejectMessage']}"</b>
        `;
    } else if (hp['status'] === 'Accepted') {
        acceptedHTML = `
            Accepted ${getRelativeTime(hp['completed'] * 1000)}
        `;
        icon = 'accent-tick.svg';

    } else {
        acceptedHTML = 'Not Yet Accepted';
    }

    const submittedTime = hp['created'] * 1000;

    return `
        <div class="house-point">
            <div style="min-width: 50%">
                ${hp['description']}
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
            >
            </div>
            <div style="min-width: 50px">
                <button 
                    onclick="deleteHousePoint(${hp['id']}, '${hp['description']}')"
                    class="icon"
                    aria-label="Delete House Point"
                    svg="bin.svg"
                ></button>
            </div>
        </div>
    `;
}

async function deleteHousePoint (id, desc) {
    if (!confirm(`Are you sure you want to delete the house point you got for '${desc}'?`)) {
        return;
    }
    await api`delete/house-points/with-id/${id}`;
    await main();
}

async function main () {
    const hps = (await api`get/house-points/earned-by/${getCode()}`)['data'];

    title(await userInfo(), hps);
    housePoints(hps);

    await reloadDOM();
}

document.getElementById('submit-hp').onclick = async () => {
    if (!$hpReasonInp.value) return;

    for (let reason of $hpReasonInp.value.split('\n')) {
        if (!reason) continue;
        await api`create/house-points/request/${getCode()}/1?description=${reason}`;
    }
    await main();
    $hpReasonInp.value = '';
};

(async () => {
    await init('..');
    hideWithID('home-link');

    if (!await signedIn()) {
        navigate`..?error=auth`;
    }

    if ((await userInfo())['admin']) {
        navigate`../admin`;
    }

    await main();
    scrollToTop();
})();
