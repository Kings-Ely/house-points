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
                <button onclick="window.delete(${hp['id']}, '${hp['description']}')" class="icon">
                    <img src="../assets/img/bin.svg" alt="delete">
                </button>
            </div>
        </div>
    `;
    // stop it crashing with lots of house points
    return new Promise(r => setTimeout(r, 0));
}

(async () => {

    const validCode = await (await fetch(`../api/valid-code.php?code=${getCode()}`)).text();

    if (validCode === '2') {
        document.getElementById('top-right-menu').innerHTML += `
            <a class="icon" href="../admin-dashboard">
                <img src="../assets/img/admin.svg" alt="admin page">
                <span class="label">Admin</span>
            </a>
        `;

    } else if (validCode !== '1') {
        window.location.assign('../');
        return;
    }

    await main();
})();

const hpReason = document.getElementById('hp-reason');

document.getElementById('submit-hp').onclick = async () => {
    if (!hpReason.value) return;

    for (let reason of hpReason.value.split('\n')) {
        if (!reason) continue;
        await fetch(`../api/submit-hp.php?description=${reason}&student=${getCode()}`);
    }
    await main();
    hpReason.value = '';
};

window.delete = async (id, desc) => {
    if (!confirm(`Are you sure you want to delete the house point you got for '${desc}'?`)) {
        return;
    }
    await fetch(`../api/delete-hp.php?id=${id}`);
    await main();
};

window.signout = () => {
    if (!confirm(`Are you sure you want to sign out?`)) {
        return;
    }

    localStorage.removeItem('hpCode');
    window.location.assign('../');
};

async function main () {
    const info = await (await fetch(`../api/student-info.php?code=${getCode()}`)).json();
    title(info, info['hps']);
    housePoints(info['hps']);
}

$`footer`.load(`../footer.html`);
$`nav`.load(`../nav.html`);
