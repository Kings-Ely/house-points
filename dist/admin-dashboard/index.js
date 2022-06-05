function housepoint (hp, div) {
    const submittedTime = hp['timestamp'] * 1000;

    div.innerHTML += `
        <div class="house-point">
            <div>
                ${hp['studentName']}
            </div>
            <div style="padding: 0 50px;">
                ${hp['description']}
            </div>
            <div>
                ${new Date(submittedTime).toDateString()}
                (${getRelativeTime(submittedTime)})
            </div>
            <div>
                <button onclick="window.reject(${hp['hpID']}, prompt('Rejection Reason'))" class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" height="48" width="48" style="fill: red">
                        <path d="M12.45 37.65 10.35 35.55 21.9 24 10.35 12.45 12.45 10.35 24 21.9 35.55 10.35 37.65 12.45 26.1 24 37.65 35.55 35.55 37.65 24 26.1Z"/>
                    </svg>
                </button>
                <button onclick="window.accept(${hp['hpID']})" class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" height="48" width="48" style="fill: var(--accent)">
                        <path d="M18.9 35.7 7.7 24.5 9.85 22.35 18.9 31.4 38.1 12.2 40.25 14.35Z"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

async function main () {
    const div = document.getElementById('pending');

    const pending = await (await fetch(`../api/pending-hps.php?adminID=${localStorage.hpCode}`)).json();

    // clear after async request
    div.innerHTML = '';

    let i = 0;
    for (let hp of pending) {
        await housepoint(hp, div);
        if (i === 4) {
            div.innerHTML += `
                <div style="text-align: center; padding: 20px">
                    And ${pending.length-5} more...
                </div>
            `;
            break;
        }
        i++;
    }

    if (i === 0) {
        div.innerHTML = `
            <p style="text-align: center">
                No Pending House Points!
            </p>
        `;
    }
}

(async () => {
    const validCode = await (await fetch(`../api/valid-code.php?code=${localStorage.hpCode}`)).text();

    if (validCode !== '2') {
        window.location.assign('../');
        return;
    }

    await main();
})();

window.accept = async (id) => {
    await fetch(`../api/accept-hp.php?id=${id}&adminID=${localStorage.hpCode}`);
    await main();
};

window.reject = async (id, reject) => {
    if (!reject) return;
    await fetch(`../api/accept-hp.php?id=${id}&reject=${reject}&adminID=${localStorage.hpCode}`);
    await main();
};

$("footer").load(`../footer.html`);

document.getElementById('add-hp-submit').onclick = async () => {
    const code = document.getElementById('add-hp-code');
    const reason = document.getElementById('add-hp-reason');
    const error = document.getElementById('add-hp-error');
    error.innerHTML = '';

    if (!reason.value) {
        error.innerHTML = 'Reason required';
        return;
    }

    if (!code.value) {
        error.innerHTML = 'Code required';
        return;
    }

    const valid = await (await fetch(`../api/valid-code.php?code=${code.value}`)).text();

    if (valid !== '1') {
        error.innerHTML = 'Invalid Code';
        return;
    }

    await fetch(`../api/add-hp.php?student=${code.value}&description=${reason.value}&adminID=${localStorage.hpCode}`);

    code.value = '';
    reason.value = '';

    main();
};

window.signout = () => {
    if (!confirm(`Are you sure you want to sign out?`)) {
        return;
    }

    localStorage.removeItem('hpCode');
    window.location.assign('../');
};