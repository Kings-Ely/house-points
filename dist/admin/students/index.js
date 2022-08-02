

const $searchFilterInput = document.getElementById('search');

const $emailInp = document.querySelector('#add-student-email');
const $passwordInp = document.querySelector('#add-student-password');
const $yearInp = document.querySelector('#add-student-year');
const $students = document.querySelector(`#students`);

(async () => {
    await init('../..', true, true);

    let selected = [];

    insertComponent('#students').selectableList({
        name: 'Students',
        items: (await api`get/users`)['data'],
        uniqueKey: 'id',
        searchKey: 'email',
        selected,
        titleBar: `
            <button
                onclick="deleteSelected()"
                class="icon"
                aria-label="delete selected"
                label="Delete"
                svg="bin.svg"
            ></button>
            
            <button
                onclick="ageSelected(1)"
                class="icon"
                aria-label="move selected up a year"
                label="Move Up 1 Year"
                svg="circle-up-arrow.svg"
            ></button>
            
            <button
                onclick="ageSelected(-1)"
                class="icon"
                aria-label="move selected down a year"
                label="Move Down 1 Year"
                svg="circle-down-arrow.svg"
            ></button>
            
            <button
                onclick="giveHPToSelected()"
                class="icon"
                aria-label="give all selected a house point"
                label="Give House Point"
                svg="plus.svg"
            ></button>
        `,
        itemGenerator: showStudent
    });
})();


async function showStudent (student, selected) {

    const { id, email, year, student: isStudent, admin: isAdmin } = student;

    const isMe = (id === (await userInfo())['id']);

    return `
        <div>
            ${isAdmin ? `
                <button 
                    class="icon ${isStudent ? 'icon-accent' : ''}" 
                    onclick="revokeAdmin('${id}', '${email}')"
                    label="${isStudent ? '' : '(Non-Student)'} Admin"
                    svg="star-filled.svg"
                    aria-label="Revoke Admin"
                >
                </button>
            ` : `
                <button
                    class="icon ${isStudent ? 'icon-accent' : ''}" 
                    onclick="makeAdmin('${id}', '${email}')"
                    aria-label="Make ${email} an admin"
                    label="Make Admin"
                    svg="star-empty.svg"
                ></button>                
            `}
        </div>
        <div>
            ${year || ''}
        </div>
        
        <div style="min-width: 150px">
            ${isMe ? `
                <span 
                    class="student-link"
                    label="Me"
                >
                    <b>${email}</b>
                </span>
            ` : `
                <button 
                    onclick="signInAs('${id}', '${email}')" 
                    class="student-link"
                    label="Sign in as ${email}"
                    aria-label="Sign in as ${email}"
                >
                    ${email}
                </button>
            `}
        </div>
       
        <div>
            ${isStudent ? student['accepted'] : ''}
        </div>
        
        <div>
            <button
                onclick="deleteUser('${id}', '${email}')"
                class="icon"
                svg="bin.svg"
                label="Delete ${email}"
                aria-label="Delete ${email}"
            ></button>
        </div>
    `;
}

async function deleteUser (id, email) {
    if (!confirm(`Are you sure you want to delete ${email} and all their house points?`)) {
        return;
    }

    await api`delete/users/${id}`;

    await main();
}

async function deleteSelected () {
    if (!confirm(
        `Are you sure you want to delete ${selected.length} students and their house points? This is irreversible.`)) {
        return;
    }

    // send API requests at the same time and wait for all to finish
    await Promise.all(selected.map(async id => {
        await api`delete/users/${id}`;
    }));

    await main();
}

async function signInAs (id, email) {
    if (!confirm(`Sign in as ${email}?`)) {
        return;
    }

    const { sessionID } = await api`create/sessions/${id}`;

    if (!sessionID) {
        return;
    }

    setAltSessionCookie(getSession());
    setSessionCookie(sessionID);
    await navigate(`/user`);
}

async function ageSelected (amount) {
    if (!confirm(`Are you sure you want to change ${selected.length} students years by ${amount}?`)) {
        return;
    }

    await Promise.all(selected.map(async id => {
        await api`update/users/year/${id}/${amount}`;
    }));

    await main();
}

async function giveHPToSelected () {

    let reason = prompt(`Reason to give ${selected.length} people a house point`);

    if (!reason) return;

    await Promise.all(selected.map(async id => {
        await api`create/house-points/give/${id}/1?description=${reason}`;
    }));

    await main();
}

async function revokeAdmin (id, email) {
    if (!confirm(`Are you sure you want to revoke '${email}'s admin access?`)) {
        return;
    }

    await api`update/users/admin/${id}?admin=0`;

    await main();
}

async function makeAdmin (id, email) {
    if (!confirm(`Are you sure you want to make '${email}' an admin?`)) {
        return;
    }

    await api`update/users/admin/${id}?admin=1`;

    await main();
}

async function main () {

    $students.innerHTML = `
        <div class="student">
            <div style="width: 50px"></div>
            
            <div> <b>Year</b> </div>
            
            <div style="min-width: 150px"> <b>Email</b> </div>
            
            <div> <b>House Points</b> </div>
            
            <div style="width: 100px"></div>
        </div>
    `;

    const searchValue = $searchFilterInput.value;

    let html = '';

    for (let student of students) {
        if (searchValue && !student['email'].toLowerCase().includes(searchValue.toLowerCase())) {
            continue;
        }
        html += await showStudent(student, selected.indexOf(student['id']) !== -1);
    }

    $students.innerHTML += html;

    await reloadDOM();
}

document.getElementById(`add-student-submit`).onclick = async () => {

    if (!$emailInp.value) {
        showError('Email Required');
        return;
    }

    if ($passwordInp.value.length < 4) {
        showError('Password too short');
        return;
    }

    let studentYear = parseInt($yearInp.value || '0');

    if ((studentYear > 13 || studentYear < 9) && studentYear !== 0) {
        showError('Year must be between 9 and 13 or blank for non-students');
        return;
    }

    if (studentYear === 0) {
        if (!confirm(
            'Are you sure you want this to be an non-student, admin account? If not, please provide a year.')) {
            return;
        }
    }

    await api`create/users/${$emailInp.value}/${$passwordInp.value}?year=${$yearInp.value}`;

    $emailInp.value = '';

    await main();
};
