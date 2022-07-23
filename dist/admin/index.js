const $addHpReason = document.getElementById('add-hp-reason');
const $pendingHPs = document.getElementById('pending');
const $numPendingHPs = document.getElementById('num-pending');
// gets replaced with input element once loaded
let $addHPName = document.getElementById('add-hp-name-inp');
const $addHPSubmit = document.getElementById('add-hp-submit');

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

async function accept (id) {
    await api`change/house-points/accepted/${id}?`;
    await main();
}

async function reject (id, reject) {
    if (!reject) return;
    await api`change/house-points/accepted/${id}?reject=${reject}`;
    await main();
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

    $numPendingHPs.innerText = pending.length;

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

$addHPSubmit.onclick = async () => {

    if (!$addHpReason.value) {
        showError('Reason required');
        return;
    }

    if (!$addHPName.value) {
        showError('Name required');
        return;
    }

    const codeRes = await api`get/users/code-from-name/${$addHPName.value}`;

    if (!codeRes.ok || !codeRes.code) {
        showError(`Sorry, couldn't find ${$addHPName.value}`);
        return;
    }

    await api`create/house-points/give/${codeRes.code}/1?description=${$addHpReason.value}`;

    $addHpReason.value = '';

    await main();
};


(async () => {
    await init('..');

    $addHPName = insertComponent($addHPName).studentNameInputWithIntellisense('200px');

    hideWithID('admin-link');

    const isSignedIn = await signedIn();

    if (!isSignedIn) {
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
