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
                <button onclick="window.rejectAccept(${hp['hpID']}, prompt('Rejection Reason'))" class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" height="48" width="48" style="fill: red">
                        <path d="M12.45 37.65 10.35 35.55 21.9 24 10.35 12.45 12.45 10.35 24 21.9 35.55 10.35 37.65 12.45 26.1 24 37.65 35.55 35.55 37.65 24 26.1Z"/>
                    </svg>
                </button>
                <button onclick="window.rejectAccept(${hp['hpID']})" class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" height="48" width="48" style="fill: var(--accent)">
                        <path d="M18.9 35.7 7.7 24.5 9.85 22.35 18.9 31.4 38.1 12.2 40.25 14.35Z"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

async function main () {
    const div = document.getElementById('students');

    const students = await (await fetch('../backend/')).json();


}

(async () => {
    const validCode = await (await fetch(`../backend/valid-code.php?code=${localStorage.hpCode}`)).text();

    if (validCode !== '2') {
        window.location.assign('../');
        return;
    }

    await main();
})();

$("footer").load(`../footer.html`);

document.getElementById('add-student-submit').onclick = async () => {
    const name = document.getElementById('add-student-name');
    const year = document.getElementById('add-student-year');

    const error = document.getElementById('add-student-error');
    error.innerHTML = '';

    if (!name.value) {
        error.innerHTML = 'Name Required';
        return;
    }

    if (!year.value) {
        year.value = '9';
    }

    await fetch(`../backend/add-student.php?name=${name.value}&year=${year.value}`);

    name.value = '';

    main();
};