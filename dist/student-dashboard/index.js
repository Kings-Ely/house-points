const nameDiv = document.getElementById('name');
const hpsDiv = document.getElementById('hps');

function housePoints (hps) {

    if (hps.length === 0) {
        hpsDiv.innerHTML = `
            <p style="font-size: 30px; margin: 50px; text-align: center">
                Looks like you haven't got any house point yet!
            </p>
        `;
        return;
    }

    hpsDiv.innerHTML = '';

    // handle lots of house points using promises
    setTimeout(async () => {
        for (let hp of hps) {
            await showHp(hp);
        }
    }, 0);
}

function title (info, hps) {
    const numHps = hps.filter(c => c['accepted'] && !c['rejectMessage']).length;

    if (numHps < 1) {
        nameDiv.innerHTML = `
            <p style="font-size: 50px">
                ${info['name']} has No House Points
            </p>
        `;
    } else {
        nameDiv.innerHTML = `
            <p style="font-size: 50px">
                ${info['name']} has ${numHps} House Point${numHps < 2 ? '' :'s'}
            </p>
        `;
    }
}

function showHp (hp) {
    let acceptedHTML;
    let icon = '';

    if (hp['status'] === 'Rejected') {
        acceptedHTML = `
            Rejected ${getRelativeTime(hp['accepted'] * 1000)}
            <br>
            <b>"${hp['rejectMessage']}"</b>
        `;
        icon = `
            <img src="../assets/img/red-cross.svg" alt="cross">
        `;

    } else if (hp['status'] === 'Accepted') {
        acceptedHTML = `
            Accepted ${getRelativeTime(hp['accepted'] * 1000)}
        `;
        icon = `
            <img src="../assets/img/accent-tick.svg" alt="tick">
        `;

    } else {
        acceptedHTML = 'Not Yet Accepted';
    }

    const submittedTime = hp['timestamp'] * 1000;

    hpsDiv.innerHTML += `
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
            <div style="min-width: 50px">
                ${icon}
            </div>
            <div style="min-width: 50px">
                <button onclick="deleteHousePoint(${hp['id']}, '${hp['description']}')" class="icon">
                    <img src="../assets/img/bin.svg" alt="delete">
                </button>
            </div>
        </div>
    `;
    // stop it crashing with lots of house points
    return new Promise(r => setTimeout(r, 0));
}

const hpReason = document.getElementById('hp-reason');

document.getElementById('submit-hp').onclick = async () => {
    if (!hpReason.value) return;

    for (let reason of hpReason.value.split('\n')) {
        if (!reason) continue;
        await api`create/house-points/give/${getCode()}/1?description=${reason}`;
    }
    await main();
    hpReason.value = '';
};

async function deleteHousePoint (id, desc) {
    if (!confirm(`Are you sure you want to delete the house point you got for '${desc}'?`)) {
        return;
    }
    await api`delete/house-points/with-id/${id}`;
    await main();
}

function signout () {
    if (!confirm(`Are you sure you want to sign out?`)) {
        return;
    }

    setCodeCookie('');
    navigate`../`;
}

async function main () {
    const user = api`get/users/info/${getCode()}`;
    const hps = api`get/house-points/earned-by/${getCode()}`;
    title(user, hps);
    housePoints(hps);
}

(async () => {
    nav`../assets/html/nav.html`;
    footer`../assets/html/footer.html`;

    const { level } = await api`get/users/auth/${getCode()}`;

    if (level === '2') {
        document.getElementById('top-right-menu').innerHTML += `
            <a class="icon" href="../admin-dashboard">
                <img src="../assets/img/admin.svg" alt="admin page">
                <span class="label">Admin</span>
            </a>
        `;

    } else if (level !== '1') {
        navigate`..?error=auth`;
        return;
    }

    await main();
})();
