const selected = [];

const searchFilterInput = document.getElementById('search');

function showStudent (student, div, selected) {
    const isMe = student['code'] === localStorage.hpCode;

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
                ${student['admin'] ? `
                    <button 
                        class="icon ${student['student'] ? 'icon-accent' : ''}" 
                        onclick="window.revokeAdmin(${student['id']}, '${student['name']}')"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" height="48" width="48"><path d="M11.65 44 16.3 28.8 4 20H19.2L24 4L28.8 20H44L31.7 28.8L36.35 44L24 34.6Z"/></svg>
                        <span class="label">
                            ${student['student'] ? '' : '(Non-Student)'} 
                            Admin
                        </span>
                    </button>
                ` : `
                    <button 
                        class="icon ${student['student'] ? 'icon-accent' : ''}" 
                        onclick="window.makeAdmin(${student['id']}, '${student['name']}')"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" height="48" width="48"><path d="M17.15 35.85 24 30.65 30.85 35.85 28.1 27.2 34.4 23.1H26.85L24 14.45L21.15 23.1H13.6L19.9 27.2ZM11.65 44 16.3 28.8 4 20H19.2L24 4L28.8 20H44L31.7 28.8L36.35 44L24 34.6ZM24 25.15Z"/></svg>
                        <span class="label">Make admin</span>
                    </button>                
                `}
            </div>
            <div>
                ${student['year'] || ''}
            </div>
            
            <div style="min-width: 150px">
                ${isMe ? `
                    <span 
                        class="student-link"
                    >
                        <b>${student['name']}</b>
                        <span class="label">Me</span>
                    </span>
                ` : `
                    <button 
                        onclick="window.signInAs('${student['code']}', '${student['name']}')" 
                        class="student-link"
                    >
                        ${student['name']}
                        <span class="label">Sign In As ${student['name']}</span>
                    </button>
                `}
            </div>
           
            <div>
                ${student['student'] ? student['accepted'] : ''}
            </div>
            
            <div>
                <button onclick="window.copyToClipboard('${student['code']}'.toUpperCase())" class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" height="48" width="48">
                        <path d="M14 36Q9 36 5.5 32.5Q2 29 2 24Q2 19 5.5 15.5Q9 12 14 12Q17.9 12 20.575 13.875Q23.25 15.75 24.55 18.85H46V29.15H40.7V36H31.4V29.15H24.55Q23.25 32.25 20.575 34.125Q17.9 36 14 36ZM14 33Q17.55 33 19.825 30.65Q22.1 28.3 22.5 26.15H34.6V33H37.7V26.15H43V21.85H22.5Q22.1 19.7 19.825 17.35Q17.55 15 14 15Q10.25 15 7.625 17.625Q5 20.25 5 24Q5 27.75 7.625 30.375Q10.25 33 14 33ZM14 27.4Q15.45 27.4 16.425 26.425Q17.4 25.45 17.4 24Q17.4 22.55 16.425 21.575Q15.45 20.6 14 20.6Q12.55 20.6 11.575 21.575Q10.6 22.55 10.6 24Q10.6 25.45 11.575 26.425Q12.55 27.4 14 27.4ZM14 24Q14 24 14 24Q14 24 14 24Q14 24 14 24Q14 24 14 24Q14 24 14 24Q14 24 14 24Q14 24 14 24Q14 24 14 24Z"/>
                    </svg>
                    <span class="label">Copy ${student['name']}'s Code</span>
                </button>
                <button onclick="window.delete(${student['id']}, '${student['name']}')" class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" height="48" width="48">
                        <path d="M13.05 42Q11.85 42 10.95 41.1Q10.05 40.2 10.05 39V10.5H8V7.5H17.4V6H30.6V7.5H40V10.5H37.95V39Q37.95 40.2 37.05 41.1Q36.15 42 34.95 42ZM34.95 10.5H13.05V39Q13.05 39 13.05 39Q13.05 39 13.05 39H34.95Q34.95 39 34.95 39Q34.95 39 34.95 39ZM18.35 34.7H21.35V14.75H18.35ZM26.65 34.7H29.65V14.75H26.65ZM13.05 10.5V39Q13.05 39 13.05 39Q13.05 39 13.05 39Q13.05 39 13.05 39Q13.05 39 13.05 39Z"/>
                    </svg>
                    <span class="label">Delete ${student['name']}</span>
                </button>
            </div>
        </div>
    `;
}

let students;

async function main (reload=true) {
    const div = document.getElementById('students');

    div.innerHTML = `
        <div class="student">
            <div  style="width: 50px"></div>
            <div><b>Year</b></div>
            <div style="min-width: 150px"><b>Name</b></div>
            <div><b>House Points</b></div>
            <div style="width: 100px"></div>
        </div>
    `;

    if (reload) {
        students = await (await fetch(`../../api/all-student-info.php`)).json();
    }

    const searchValue = searchFilterInput.value;

    for (let student of students) {
        if (searchValue && !student['name'].toLowerCase().includes(searchValue.toLowerCase())) {
            continue;
        }
        showStudent(student, div, selected.indexOf(student['id']) !== -1);
    }
}

(async () => {
    const validCode = await (await fetch(`../../api/valid-code.php?code=${getCode()}`)).text();

    if (validCode !== '2') {
        window.location.assign('../../');
        return;
    }

    await main();
})();

$`footer`.load(`../../footer.html`);

document.getElementById('add-student-submit').onclick = async () => {
    const name = document.getElementById('add-student-name');
    const year = document.getElementById('add-student-year');

    const error = document.getElementById('add-student-error');
    error.innerHTML = '';

    if (!name.value) {
        error.innerHTML = 'Name Required';
        return;
    }

    let studentYear = parseInt(year.value || '0');

    if ((studentYear > 13 || studentYear < 9) && studentYear !== 0) {
        error.innerHTML = 'Year must be between 9 and 13 or blank for non-students';
        return;
    }

    if (studentYear === 0) {
        if (!confirm('Are you sure you want this to be an non-student, admin account? If not, please provide a year.')) {
            return;
        }
    }

    await fetch(`../../api/add-user.php?name=${name.value}&year=${year.value}&admin=${studentYear === 0}`);

    name.value = '';

    main();
};

window.delete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete ${name} (ID ${id}) and all their house points?`)) {
        return;
    }

    await fetch(`../../api/delete-student.php?id=${id}`);

    main();
};

window.deleteSelected = async () => {
    if (!confirm(`Are you sure you want to delete ${selected.length} students and their house points? This action cannot be undone.`)) {
        return;
    }

    for (let id of selected) {
        await fetch(`../../api/delete-student.php?id=${id}`);
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
        await fetch(`../../api/age-student.php?id=${id}&amount=${amount}`);
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

    let reason = prompt(`Reason to give ${selected.length} people a house point`);

    if (!reason) return;

    for (let id of selected) {
        await fetch(`../../api/add-hp.php?description=${reason}&studentid=${id}`);
    }

    main();
};

window.revokeAdmin = async (id, name) => {
    if (!confirm(`Are you sure you want to revoke ${name}'s admin access?`)) {
        return;
    }

    await fetch(`../../api/change-admin.php?id=${id}&admin=0`);

    main();
}

window.makeAdmin = async (id, name) => {
    if (!confirm(`Are you sure you want to make ${name} an admin?`)) {
        return;
    }

    await fetch(`../../api/change-admin.php?id=${id}&admin=1`);

    main();
}
