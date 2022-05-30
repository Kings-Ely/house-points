
function showStudent (student, div) {
    div.innerHTML += `
        <div class="student">
            <div>
                ${student['year']}
            </div>
            
            <div>
                <button 
                    onclick="window.signInAs('${student['code']}', '${student['name']}')" 
                    class="student-link"
                >
                    ${student['name']}
                </button>
            </div>
            
            <div style="font-family: 'Space Mono', monospace">
                ${student['code'].toUpperCase()}
            </div>

            <div>
                ${student['accepted']}
            </div>
            
            <div>
                <button onclick="window.delete(${student['id']}, '${student['name']}')" class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" height="48" width="48">
                        <path d="M13.05 42Q11.85 42 10.95 41.1Q10.05 40.2 10.05 39V10.5H8V7.5H17.4V6H30.6V7.5H40V10.5H37.95V39Q37.95 40.2 37.05 41.1Q36.15 42 34.95 42ZM34.95 10.5H13.05V39Q13.05 39 13.05 39Q13.05 39 13.05 39H34.95Q34.95 39 34.95 39Q34.95 39 34.95 39ZM18.35 34.7H21.35V14.75H18.35ZM26.65 34.7H29.65V14.75H26.65ZM13.05 10.5V39Q13.05 39 13.05 39Q13.05 39 13.05 39Q13.05 39 13.05 39Q13.05 39 13.05 39Z"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

async function main () {
    const div = document.getElementById('students');

    div.innerHTML = `
        <div class="student" style="border-bottom-width: 2px">
            <div><b>Year</b></div>
            <div><b>Name</b></div>
            <div><b>Code</b></div>
            <div><b>House Points</b></div>
            <div></div>
        </div>
    `;

    const students = await (await fetch('../../backend/all-student-info.php')).json();

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

    await fetch(`../../backend/add-student.php?name=${name.value}&year=${year.value}`);

    name.value = '';

    main();
};

window.delete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete ${name} (ID ${id}) and all their house points?`)) {
        return;
    }

    await fetch(`../../backend/delete-student.php?id=${id}`);

    main();
};

window.signInAs = async (code, name) => {
    if (!confirm(`Sign in as ${name}?`)) {
        return;
    }
    localStorage.hpCode = code;
    window.location.assign('../../student-dashboard');
};