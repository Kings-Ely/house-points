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
        students = await fetchJSON(`../../api/all-student-info.php`);
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

$('#add-student-submit').click(async () => {

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

    await fetch(
        `../../api/add-user.php?name=${$nameInp.value}&year=${$yearInp.value}&admin=${studentYear === 0}`);

    $nameInp.value = '';

    main();
});

async function deleteUser (id, name) {
    if (!confirm(`Are you sure you want to delete ${name} (ID ${id}) and all their house points?`)) {
        return;
    }

    await fetch(`../../api/delete-student.php?id=${id}`);

    main();
}

async function deleteSelected () {
    if (!confirm(
        `Are you sure you want to delete ${selected.length} students and their house points? This is irreversible.`)) {
        return;
    }

    for (let id of selected) {
        await fetch(`../../api/delete-student.php?id=${id}`);
    }

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

    for (let id of selected) {
        await fetch(`../../api/age-student.php?id=${id}&amount=${amount}`);
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
        await fetch(`../../api/add-hp.php?description=${reason}&studentid=${id}`);
    }

    main();
}

async function revokeAdmin (id, name) {
    if (!confirm(`Are you sure you want to revoke ${name}'s admin access?`)) {
        return;
    }

    await fetch(`../../api/change-admin.php?id=${id}&admin=0`);

    main();
}

async function makeAdmin (id, name) {
    if (!confirm(`Are you sure you want to make ${name} an admin?`)) {
        return;
    }

    await fetch(`../../api/change-admin.php?id=${id}&admin=1`);

    main();
}

(async () => {
    footer`../../footer.html`;

    const validCode = await fetchTxt(`../../api/valid-code.php?code=${getCode()}`);

    if (validCode !== '2') {
        navigate`../../`;
        return;
    }

    await main();
})();
