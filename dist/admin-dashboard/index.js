function housepoint (hp, div) {
    const submittedTime = hp['timestamp'] * 1000;

    div.innerHTML += `
        <div class="house-point">
            <div>
                ${hp['studentName']}
            </div>
            <div style="padding: 0 50px;">
                for ${hp['description']}
            </div>
            <div>
                ${new Date(submittedTime).toDateString()}
                (${getRelativeTime(submittedTime)})
            </div>
            <div>
                <button onclick="window.rejectAccept(${hp['id']}, prompt('Rejection Reason'))" class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" height="48" width="48" style="fill: red">
                        <path d="M12.45 37.65 10.35 35.55 21.9 24 10.35 12.45 12.45 10.35 24 21.9 35.55 10.35 37.65 12.45 26.1 24 37.65 35.55 35.55 37.65 24 26.1Z"/>
                    </svg>
                </button>
                <button onclick="window.rejectAccept(${hp['id']})" class="icon">
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

    const pending = await (await fetch('../backend/pending-hps.php')).json();

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
}

(async () => {
    const validCode = await (await fetch(`../backend/valid-code.php?code=${localStorage.hpCode}`)).text();

    if (validCode !== '2') {
        window.location.assign('../');
        return;
    }

    await main();
})();

window.rejectAccept = async (id, reject) => {
    if (reject) {
        await fetch(`../backend/accept-hp.php?id=${id}&reject=${reject}`);
    } else {
        await fetch(`../backend/accept-hp.php?id=${id}`);
    }
    await main();
};