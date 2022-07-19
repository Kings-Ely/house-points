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
                <button 
                    onclick="window.reject(${hp['hpID']}, prompt('Rejection Reason'))"
                    class="icon"
                    aria-label="Reject"
                    svg="../resources/red-cross.svg"
                ></button>
                <button
                    onclick="window.accept(${hp['hpID']})"
                    class="icon"
                    svg="../resources/accent-tick.svg"
                    aria-label="Accept"
                ></button>
            </div>
        </div>
    `;
}

async function main () {
    fetch(`../api/student-info.php?code=${getCode()}`)
        .then(async data => {
            data = await data.json();
            if (data['student']) {
                document.getElementById('top-right-menu').innerHTML += `
                    <a 
                        class="icon"
                        href="../student-dashboard"
                        label="Student Dashboard"
                        svg="../resources/home.svg"
                    ></a>
                `;
            }
        });

    const div = document.getElementById('pending');

    const pending = await (await fetch(`../api/pending-hps.php`)).json();

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
    const validCodeRes = await fetch(`../api/valid-code.php?code=${getCode()}`);
    const validCode = await validCodeRes.text();

    if (validCode !== '2') {
        window.location.assign('../');
        return;
    }

    await main();
})();

window.accept = async (id) => {
    await fetch(`../api/accept-hp.php?id=${id}`);
    await main();
};

window.reject = async (id, reject) => {
    if (!reject) return;
    await fetch(`../api/accept-hp.php?id=${id}&reject=${reject}`);
    await main();
};

const code = document.getElementById('add-hp-code');

code.onchange = () => {
    code.value = cleanCode(code.value);
    setTimeout(() => {
        code.value = cleanCode(code.value);
    }, 0);
};

code.onkeydown = code.onchange;
code.onclick = code.onchange;
code.onpaste = code.onchange;

document.getElementById('add-hp-submit').onclick = async () => {

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

    await fetch(`../api/add-hp.php?student=${code.value}&description=${reason.value}`);

    code.value = '';
    reason.value = '';

    main();
};

window.signout = () => {
    if (!confirm(`Are you sure you want to sign out?`)) {
        return;
    }

    eraseCookie(codeCookieKey);
    window.location.assign('../');
};

footer('../footer.html');
