(async () => {

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

        if (hp['status'] === 'Rejected') {
            acceptedHTML = `
            Rejected ${getRelativeTime(hp['accepted'] * 1000)}
            <br>
            <b>"${hp['rejectMessage']}"</b>
        `;
            icon = `
            <svg xmlns="http://www.w3.org/2000/svg" height="48" width="48" style="fill: red">
                <path d="M12.45 37.65 10.35 35.55 21.9 24 10.35 12.45 12.45 10.35 24 21.9 35.55 10.35 37.65 12.45 26.1 24 37.65 35.55 35.55 37.65 24 26.1Z"/>
            </svg>
        `;

        } else if (hp['status'] === 'Accepted') {
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

    $("footer").load(`../footer.html`);

    const validCode = await (await fetch(`../api/valid-code.php?code=${localStorage.hpCode}`)).text();

    if (validCode === '2') {
        document.getElementById('top-right-menu').innerHTML += `
            <a class="icon" href="../admin-dashboard">
                <svg xmlns="http://www.w3.org/2000/svg" height="48" width="48"><path d="M24 44Q17.1 42.4 12.55 36.175Q8 29.95 8 21.9V9.95L24 3.95L40 9.95V23.45Q39.3 23.1 38.5 22.825Q37.7 22.55 37 22.45V12.05L24 7.25L11 12.05V21.9Q11 25.7 12.225 28.9Q13.45 32.1 15.35 34.525Q17.25 36.95 19.55 38.55Q21.85 40.15 24 40.85Q24.3 41.45 24.9 42.2Q25.5 42.95 25.9 43.35Q25.45 43.6 24.95 43.725Q24.45 43.85 24 44ZM34.55 34.5Q35.85 34.5 36.75 33.55Q37.65 32.6 37.65 31.3Q37.65 30 36.75 29.1Q35.85 28.2 34.55 28.2Q33.25 28.2 32.3 29.1Q31.35 30 31.35 31.3Q31.35 32.6 32.3 33.55Q33.25 34.5 34.55 34.5ZM34.5 40.75Q36.15 40.75 37.5 40.05Q38.85 39.35 39.8 38.05Q38.5 37.35 37.2 37Q35.9 36.65 34.5 36.65Q33.1 36.65 31.775 37Q30.45 37.35 29.2 38.05Q30.15 39.35 31.475 40.05Q32.8 40.75 34.5 40.75ZM34.65 44Q30.75 44 28 41.225Q25.25 38.45 25.25 34.65Q25.25 30.75 28 27.975Q30.75 25.2 34.65 25.2Q38.5 25.2 41.275 27.975Q44.05 30.75 44.05 34.65Q44.05 38.45 41.275 41.225Q38.5 44 34.65 44ZM24 24.05Q24 24.05 24 24.05Q24 24.05 24 24.05Q24 24.05 24 24.05Q24 24.05 24 24.05Q24 24.05 24 24.05Q24 24.05 24 24.05Q24 24.05 24 24.05Q24 24.05 24 24.05Q24 24.05 24 24.05Q24 24.05 24 24.05Z"/></svg>                
                <span class="label">Admin</span>
            </a>
        `;

    } else if (validCode !== '1') {
        window.location.assign('../');
        return;
    }

    await main();
})();

document.getElementById('submit-hp').onclick = async () => {
    if (!hpReason.value) return;

    for (let reason of hpReason.value.split('\n')) {
        if (!reason) continue;
        await fetch(`../api/submit-hp.php?description=${reason}&student=${localStorage.hpCode}`);
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
