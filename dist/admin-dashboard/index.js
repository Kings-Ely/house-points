const $reason = document.getElementById('add-hp-reason');
const error = document.getElementById('add-hp-error');

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
                    svg="red-cross.svg"
                ></button>
                <button
                    onclick="window.accept(${hp['hpID']})"
                    class="icon"
                    svg="accent-tick.svg"
                    aria-label="Accept"
                ></button>
            </div>
        </div>
    `;
}

async function main () {
    api`get/users/info/${getCode()}`
        .then(async data => {
            if (data['student']) {
                document.getElementById('top-right-menu').innerHTML += `
                    <a 
                        class="icon"
                        href="../student-dashboard"
                        label="Student Dashboard"
                        svg="home.svg"
                    ></a>
                `;
            }
        });

    const div = document.getElementById('pending');

    const { data: pending } = await api`get/house-points/with-status/pending`;

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
    await api`change/house-points/accepted/${id}?reject=${reject}`;
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

    error.innerHTML = '';

    if (!$reason.value) {
        error.innerHTML = 'Reason required';
        return;
    }

    if (!code.value) {
        error.innerHTML = 'Code required';
        return;
    }

    const { level: valid } = await api`get/users/auth/${code.value}`;

    if (valid !== '1') {
        error.innerHTML = 'Invalid Code';
        return;
    }

    await api`create/house-points/${code.value}&description=${$reason.value}`;

    code.value = '';
    $reason.value = '';

    main();
};


(async () => {
    rootPath('..');

    code.onkeydown = code.onchange;
    code.onclick = code.onchange;
    code.onpaste = code.onchange;

    const { level } = await api`get/users/auth/${getCode()}`;

    if (level !== 2) {
        navigate`..?error=auth`;
        return;
    }

    await main();
})();
