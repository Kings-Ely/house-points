const selected = [];

function showStudent (student, div, selected) {
    div.innerHTML += `
        <div class="student">
            <div>
                <button onclick="window.select(${student['id']}, ${!selected})" class="icon no-scale">
                    ${selected ? `
                        <svg xmlns="http://www.w3.org/2000/svg" height="48" width="48"><path d="M23.05 33.6 11.95 22.5 14.05 20.4 23.05 29.4 42.15 10.3 44.25 12.4ZM9 42Q7.75 42 6.875 41.125Q6 40.25 6 39V9Q6 7.75 6.875 6.875Q7.75 6 9 6H39Q39.7 6 40.275 6.3Q40.85 6.6 41.2 7L39 9.2Q39 9.2 39 9.1Q39 9 39 9H9Q9 9 9 9Q9 9 9 9V39Q9 39 9 39Q9 39 9 39H39Q39 39 39 39Q39 39 39 39V21.85L42 18.85V39Q42 40.25 41.125 41.125Q40.25 42 39 42Z"/></svg>
                    ` : `
                        <svg xmlns="http://www.w3.org/2000/svg" height="48" width="48"><path d="M9 42Q7.8 42 6.9 41.1Q6 40.2 6 39V9Q6 7.8 6.9 6.9Q7.8 6 9 6H39Q40.2 6 41.1 6.9Q42 7.8 42 9V39Q42 40.2 41.1 41.1Q40.2 42 39 42ZM9 39H39Q39 39 39 39Q39 39 39 39V9Q39 9 39 9Q39 9 39 9H9Q9 9 9 9Q9 9 9 9V39Q9 39 9 39Q9 39 9 39Z"/></svg>
                    `}
                </button>
            </div>
            <div>
                ${student['year']}
            </div>
            
            <div style="min-width: 150px">
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

let students;

async function main (reload=true) {
    const div = document.getElementById('students');

    div.innerHTML = `
        <div class="student" style="border-bottom-width: 2px">
            <div  style="width: 50px"></div>
            <div><b>Year</b></div>
            <div style="min-width: 150px"><b>Name</b></div>
            <div><b>Code</b></div>
            <div><b>House Points</b></div>
            <div style="width: 50px"></div>
        </div>
    `;

    if (reload) {
        students = await (await fetch('../../backend/all-student-info.php')).json();
    }

    for (let student of students) {
        showStudent(student, div, selected.indexOf(student['id']) !== -1);
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

window.deleteSelected = async () => {
    if (!confirm(`Are you sure you want to delete ${selected.length} students and their house points? This action cannot be undone.`)) {
        return;
    }

    for (let id of selected) {
        await fetch(`../../backend/delete-student.php?id=${id}`);
    }

    main();
}

window.signInAs = async (code, name) => {
    if (!confirm(`Sign in as ${name}?`)) {
        return;
    }
    localStorage.hpCode = code;
    window.location.assign('../../student-dashboard');
};

window.select = (id, select) => {
    if (select) {
        if (selected.indexOf(id) !== -1) {
            console.error('cannot reselect student with id ' + id);
            return;
        }
        selected.push(id);
    } else {
        const index = selected.indexOf(id);
        if (index !== -1) {
            selected.splice(index, 1);
        } else {
            console.error('Cannot unselect student with id ' + id);
        }
    }
    main(false);
};

window.ageSelected = async (amount) => {
    if (!confirm(`Are you sure you want to change ${selected.length} students years by ${amount}?`)) {
        return;
    }

    for (let id of selected) {
        await fetch(`../../backend/age-student.php?id=${id}&amount=${amount}`);
    }

    main();
};

window.selectAll = (select=true) => {
    if (select) {
        for (let student of students) {
            selected.push(student['id']);
        }
    } else {
        selected.splice(0, selected.length);
    }

    main(false);
};

window.giveHPToSelected = async () => {
    const reason = window.prompt(`Please enter the reason to give ${selected.length} a house point`);

    for (let id of selected) {
        await fetch(`../../backend/add-hp.php?id=${localStorage.hpCode}&description=${reason}&studentid=${id}`);
    }

    main();
};