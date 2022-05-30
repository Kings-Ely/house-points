
function showStudent (student, div) {
    div.innerHTML += `
        <div class="student">
            <div>${student['year']}</div>
            <div>${student['name']}</div>
            <div>${student['hps']}</div>
        </div>
    `;
}

async function main () {
    const div = document.getElementById('students');

    const students = await (await fetch('../../backend/all-student-info.php')).json();

    div.innerHTML = `
        <div class="student" style="border-bottom-width: 2px">
            <div><b>Year</b></div>
            <div><b>Name</b></div>
            <div><b>House Points</b></div>
        </div>
    `;

    for (let student of students) {
        showStudent(student, div);
    }
}

(async () => {
    const validCode = await (await fetch(`../../backend/valid-code.php?code=${localStorage.hpCode}`)).text();

    if (validCode !== '2') {
        window.location.assign('../');
        return;
    }

    await main();
})();

$("footer").load(`../../footer.html`);

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