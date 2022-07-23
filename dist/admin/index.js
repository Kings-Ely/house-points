const $addHpReason = document.getElementById('add-hp-reason');
const $addHpName = document.getElementById('add-hp-code');
const $pendingHPs = document.getElementById('pending');

let studentNames = [];

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

    const { data: pending } = await api`get/house-points/with-status/pending`;

    // clear after async request
    $pendingHPs.innerHTML = '';

    let i = 0;
    for (let hp of pending) {
        $pendingHPs.innerHTML += housePointHML(hp);

        if (i === 4) {
            $pendingHPs.innerHTML += `
                <div style="text-align: center; padding: 20px">
                    And ${pending.length-5} more...
                </div>
            `;
            break;
        }
        i++;
    }

    if (i === 0) {
        $pendingHPs.innerHTML = `
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


$addHpName.onchange = () => {
    let options = [];
    for (let name of studentNames) {
        if (name.toLowerCase().includes($addHpName.value.toLowerCase())) {
            options.push(name);
        }
    }

};

document.getElementById('add-hp-submit').onclick = async () => {


    if (!$addHpReason.value) {
        showError('Reason required');
        return;
    }

    if (!code.value) {
        showError('Code required');
        return;
    }

    const { level: valid } = await api`get/users/auth/${code.value}`;

    if (valid !== 1) {
        showError('Invalid Name');
        return;
    }

    await api`create/house-points/${code.value}&description=${$addHpReason.value}`;

    $addHpName.value = '';
    $addHpReason.value = '';

    await main();
};


(async () => {
    rootPath('..').then();

    $addHpName.onkeydown = $addHpName.onchange;
    $addHpName.onclick = $addHpName.onchange;
    $addHpName.onpaste = $addHpName.onchange;

    const signedIn = await signedIn();

    if (!signedIn) {
        navigate`..?error=auth`;
        return;
    }

    const { admin } = await userInfo();

    if (!admin) {
        navigate`..?error=auth`;
        return;
    }

    await main();
})();
