const selected = [];
let students = [];

const searchFilterInput = document.getElementById('search');

const $nameInp = document.getElementById('add-student-name');
const $yearInp = document.getElementById('add-student-year');
const $error = document.getElementById('add-student-error');

const $students = $(`#students`);

function showStudent (student, selected) {
    return `
        <div class="student">
            <div>
                <button 
                    onclick="select(${student['id']}, ${!selected})"
                    class="icon no-scale"
                    svg="../../resources/${selected ? 'selected-checkbox' : 'unselected-checkbox'}.svg"
                    aria-label="${selected ? 'Unselect' : 'Select'}"
                ></button>
                ${student['admin'] ? `
                    <button 
                        class="icon ${student['student'] ? 'icon-accent' : ''}" 
                        onclick="revokeAdmin(${student['id']}, '${student['name']}')"
                        label="${student['student'] ? '' : '(Non-Student)'} Admin"
                        svg="../../resources/star-filled.svg"
                        aria-label="Revoke Admin"
                    >
                    </button>
                ` : `
                    <button
                        class="icon ${student['student'] ? 'icon-accent' : ''}" 
                        onclick="makeAdmin(${student['id']}, '${student['name']}')"
                        aria-label="Make ${student['name']} an admin"
                        label="Make Admin"
                        svg="../../resources/star-empty.svg"
                    ></button>                
                `}
            </div>
            <div>
                ${student['year'] || ''}
            </div>
            
            <div style="min-width: 150px">
                ${student['code'] === getCode() ? `
                    <span 
                        class="student-link"
                        label="Me"
                    >
                        <b>${student['name']}</b>
                    </span>
                ` : `
                    <button 
                        onclick="signInAs('${student['code']}', '${student['name']}')" 
                        class="student-link"
                        label="Sign in as ${student['name']}"
                        aria-label="Sign in as ${student['name']}"
                    >
                        ${student['name']}
                    </button>
                `}
            </div>
           
            <div>
                ${student['student'] ? student['accepted'] : ''}
            </div>
            
            <div>
                <button 
                    onclick="copyToClipboard('${student['code']}'.toUpperCase())"
                    class="icon"
                    svg="../../resources/key.svg"
                    label="Copy ${student['name']}'s Code"
                    aria-label="Copy ${student['name']}'s Code"
                ></button>
                <button
                    onclick="deleteUser(${student['id']}, '${student['name']}')"
                    class="icon"
                    svg="../../resources/bin.svg"
                    label="Delete ${student['name']}"
                    aria-label="Delete ${student['name']}"
                ></button>
            </div>
        </div>
    `;
}

async function main (reload=true) {
    $students.html`
        <div class="student">
            <div style="width: 50px"></div>
            
            <div> <b>Year</b> </div>
            
            <div style="min-width: 150px"> <b>Name</b> </div>
            
            <div> <b>House Points</b> </div>
            
            <div style="width: 100px"></div>
        </div>
    `;

    if (reload) {
        students = (await api`get/users/all`)['data'];
    }

    const searchValue = searchFilterInput.value;

    for (let student of students) {
        if (searchValue && !student['name'].toLowerCase().includes(searchValue.toLowerCase())) {
            continue;
        }
        $students.append(
            showStudent(student, selected.indexOf(student['id']) !== -1)
        );
    }

    reloadDOM();
}

$(`#add-student-submit`).click(async () => {

    $error.innerHTML = '';

    if (!$nameInp.value) {
        $error.innerHTML = 'Name Required';
        return;
    }

    let studentYear = parseInt($yearInp.value || '0');

    if ((studentYear > 13 || studentYear < 9) && studentYear !== 0) {
        $error.innerHTML = 'Year must be between 9 and 13 or blank for non-students';
        return;
    }

    if (studentYear === 0) {
        if (!confirm(
            'Are you sure you want this to be an non-student, admin account? If not, please provide a year.')) {
            return;
        }
    }

    await api`create/users/${$nameInp.value}?year=${$yearInp.value}`;

    $nameInp.value = '';

    main();
});

async function deleteUser (code, name) {
    if (!confirm(`Are you sure you want to delete ${name} (Code '${code}') and all their house points?`)) {
        return;
    }

    await api`delete/users/${code}`;

    main();
}

async function deleteSelected () {
    if (!confirm(
        `Are you sure you want to delete ${selected.length} students and their house points? This is irreversible.`)) {
        return;
    }

    // send API requests at the same time and wait for all to finish
    await Promise.all(selected.map(async code => {
        await api`delete/users/${code}`;
    }));

    main();
}

async function signInAs (code, name) {
    if (!confirm(`Sign in as ${name}?`)) {
        return;
    }
    setCodeCookie(code);
    await navigate`../../student-dashboard`;
}

async function select (id, select) {
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
}

async function ageSelected (amount) {
    if (!confirm(`Are you sure you want to change ${selected.length} students years by ${amount}?`)) {
        return;
    }

    for (let code of selected) {
        await api`../../api/age-student.php?id=${code}&amount=${amount}`;
    }

    main();
}

function selectAll (select=true) {
    if (select) {
        for (let student of students) {
            selected.push(student['id']);
        }
    } else {
        selected.splice(0, selected.length);
    }

    main(false);
}

async function giveHPToSelected () {

    let reason = prompt(`Reason to give ${selected.length} people a house point`);

    if (!reason) return;

    for (let id of selected) {
        await api`../../api/add-hp.php?description=${reason}&studentid=${id}`;
    }

    main();
}

async function revokeAdmin (code, name) {
    if (!confirm(`Are you sure you want to revoke ${name}'s admin access?`)) {
        return;
    }

    await api`../../api/change-admin.php?id=${code}&admin=0`;

    main();
}

async function makeAdmin (code, name) {
    if (!confirm(`Are you sure you want to make ${name} an admin?`)) {
        return;
    }

    await api`update/users/admin/${code}&admin=1`;

    main();
}

(async () => {
    rootPath('../..');

    const { level } = await api`get/users/auth/${getCode()}`;

    if (level !== 2) {
        await navigate(ROOT_PATH);
        return;
    }

    await main();
})();
