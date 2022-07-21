function housePointHML (hp) {
    const submittedTime = hp['timestamp'] * 1000;

    return `
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
    api`get/user/info/${getCode()}`
        .then(async data => {
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

    const pending = await api`get/house-points/pending`;

    // clear after async request
    div.innerHTML = '';

    let i = 0;
    for (let hp of pending) {
        div.innerHTML += housePointHML(hp);

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

async function accept (id) {
    await api`change/house-points/accepted/${id}?`;
    await main();
}

async function reject (id, reject) {
    if (!reject) return;
    await fetch(`../api/accept-hp.php?id=${id}&reject=${reject}`);
    await main();
}

const code = document.getElementById('add-hp-code');

code.onchange = () => {
    code.value = cleanCode(code.value);
    setTimeout(() => {
        code.value = cleanCode(code.value);
    }, 0);
};

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

async function signout () {
    if (!confirm(`Are you sure you want to sign out?`)) {
        return;
    }

    eraseCookie(COOKIE_KEY);
    await navigate`..`;
}


(async () => {
    footer('../footer.html');

    code.onkeydown = code.onchange;
    code.onclick = code.onchange;
    code.onpaste = code.onchange;

    const { level } = await api`get/user/auth/${getCode()}`;

    if (level !== 2) {
        navigate`..?error=auth`;
        return;
    }

    await main();
})();
