const nameDiv = document.getElementById('name');
const hpsDiv = document.getElementById('hps');
const hpReason = document.getElementById('hp-reason');

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

    if (hp['rejectMessage']) {
        acceptedHTML = `
                    Rejected ${getRelativeTime(hp['accepted'] * 1000)}: ${hp['rejectMessage']}
                `;
        icon = `
                    <svg xmlns="http://www.w3.org/2000/svg" height="48" width="48" style="fill: red">
                        <path d="M12.45 37.65 10.35 35.55 21.9 24 10.35 12.45 12.45 10.35 24 21.9 35.55 10.35 37.65 12.45 26.1 24 37.65 35.55 35.55 37.65 24 26.1Z"/>
                    </svg>
                `;
    } else if (hp['accepted']) {
        acceptedHTML = `
                    Accepted ${getRelativeTime(hp['accepted'] * 1000)}
                `;
        icon = `
                    <svg xmlns="http://www.w3.org/2000/svg" height="48" width="48" style="fill: var(--accent)">
                        <path d="M18.9 35.7 7.7 24.5 9.85 22.35 18.9 31.4 38.1 12.2 40.25 14.35Z"/>
                    </svg>
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
                    <svg xmlns="http://www.w3.org/2000/svg" height="48" width="48">
                        <path d="M13.05 42Q11.85 42 10.95 41.1Q10.05 40.2 10.05 39V10.5H8V7.5H17.4V6H30.6V7.5H40V10.5H37.95V39Q37.95 40.2 37.05 41.1Q36.15 42 34.95 42ZM34.95 10.5H13.05V39Q13.05 39 13.05 39Q13.05 39 13.05 39H34.95Q34.95 39 34.95 39Q34.95 39 34.95 39ZM18.35 34.7H21.35V14.75H18.35ZM26.65 34.7H29.65V14.75H26.65ZM13.05 10.5V39Q13.05 39 13.05 39Q13.05 39 13.05 39Q13.05 39 13.05 39Q13.05 39 13.05 39Z"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
    // stop it crashing with lots of house points
    return new Promise(r => setTimeout(r, 0));
}

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

async function main () {
    const info = await (await fetch(`../api/student-info.php?code=${localStorage.hpCode}`)).json();
    title(info, info['hps']);
    housePoints(info['hps']);
}

(async () => {
    const validCode = await (await fetch(`../api/valid-code.php?code=${localStorage.hpCode}`)).text();

    if (validCode !== '1') {
        window.location.assign('../');
        return;
    }

    await main();
})();

document.getElementById('submit-hp').onclick = async () => {
    if (!hpReason.value) return;
    await fetch(`../api/submit-hp.php?description=${hpReason.value}&student=${localStorage.hpCode}`);
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

$("footer").load(`../footer.html`);
