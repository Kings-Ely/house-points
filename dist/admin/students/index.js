import * as core from '../../assets/js/main.js';
import SelectableList from '../../assets/js/components/SelectableList.js';
import fullPagePopup from '../../assets/js/components/FullPagePopup.js';

const $addStudentButton = document.getElementById('add-student'),
    filters = {
        years: [0, 9, 10, 11, 12, 13],
        admin: false
    },
    selected = [];

window.deleteSelected = deleteSelected;
window.ageSelected = ageSelected;
window.giveHPToSelected = giveHPToSelected;
window.revokeAdmin = revokeAdmin;
window.makeAdmin = makeAdmin;
window.deleteUser = deleteUser;
window.uploadAddStudentsFile = uploadAddStudentsFile;
window.toggleYearGroup = toggleYearGroup;
window.toggleAdmin = toggleAdmin;
window.userPopupFromId = core.userPopupFromId;

(async () => {
    await core.init('../..', true, true);
    await core.preloadSVGs(
        'star-filled.svg',
        'star-empty.svg',
        'bin.svg',
        'circle-up-arrow.svg',
        'circle-down-arrow.svg',
        'plus.svg',
        'unselected-checkbox.svg'
    );

    await showStudentsList();
})();

async function showStudentsList() {
    SelectableList('#students', {
        name: 'Students',
        items: (await core.api(`get/users`))['data'],
        uniqueKey: 'id',
        searchKey: 'email',
        selected,
        withAllMenu: `
            <span id="filters-container">
                <span style="display: inline-block">
                    <span
                        class="bordered big-link" 
                        id="filters-button"
                        svg="filter.svg"
                    >
                        Filters
                    </span>
                </span>
                <div id="filters-dropdown">
                    <button onclick="toggleYearGroup(0)">
                        Show ${
                            !filters.years.includes(0) ? 'teachers and students' : 'only students'
                        }
                    </button>
                    <br>
                    <button onclick="toggleAdmin()">
                        Show ${filters.admin ? 'non-admins too' : 'only admins'}
                    </button>
                    <hr>
                    ${[9, 10, 11, 12, 13]
                        .map(
                            year => `
                        <button onclick="toggleYearGroup(${year})"> 
                            ${filters.years.includes(year) ? 'Hide' : 'Show'} 
                            Y${year}
                        </button>
                    `
                        )
                        .join('')}
                </div>
            </span>
            <button
                onclick="deleteSelected()"
                class="icon"
                aria-label="delete selected"
                data-label="Delete"
                svg="bin.svg"
            ></button>
            
            <button
                onclick="ageSelected(1)"
                class="icon"
                aria-label="move selected up a year"
                data-label="Move Up 1 Year"
                svg="circle-up-arrow.svg"
            ></button>
            
            <button
                onclick="ageSelected(-1)"
                class="icon"
                aria-label="move selected down a year"
                data-label="Move Down 1 Year"
                svg="circle-down-arrow.svg"
            ></button>
            
            <button
                onclick="giveHPToSelected()"
                class="icon"
                aria-label="give all selected a house point"
                data-label="Give House Point"
                svg="plus.svg"
            ></button>
        `,
        itemGenerator: showStudent,
        gridTemplateColsCSS: '50% 1fr 1fr',
        filter: item => {
            return filters.years.includes(item['year']) && (filters.admin ? item['admin'] : true);
        }
    });
}

async function showStudent(student) {
    const { id, email, year, student: isStudent, admin: isAdmin } = student;

    const isMe = id === (await core.userInfo())['id'];

    return `
        <div class="flex-center" style="justify-content: left">
            ${
                isAdmin
                    ? `
                <button 
                    class="icon medium ${isStudent ? 'icon-accent' : ''}"
                    onclick="revokeAdmin('${id}', '${email}')"
                    data-label="${isStudent ? '' : '(Non-Student)'} Admin"
                    svg="star-filled.svg"
                    aria-label="Revoke Admin"
                ></button>
            `
                    : `
                <button
                    class="icon medium ${isStudent ? 'icon-accent' : ''}" 
                    onclick="makeAdmin('${id}', '${email}')"
                    aria-label="Make ${email} an admin"
                    data-label="Make Admin"
                    svg="star-empty.svg"
                ></button>                
            `
            }
            
            <button 
                svg="account.svg"
                onclick="signInAs('${id}', '${email}')"
                class="icon medium"
                style="opacity: ${isMe ? '0' : '1'}"
                ${isMe ? 'disabled' : ''}
                ${!isMe ? `data-label="Sign in as ${email}"` : ''}
            ></button>
            
            ${
                isMe
                    ? `
                <span class="student-link">
                   <b>${email}</b>
                   (You${isStudent ? `, Y${year || ''}` : ''})
                </span>
            `
                    : `
                <button 
                    onclick="userPopupFromId('${id}')" 
                    class="student-link"
                    data-label="View"
                    aria-label="View"
                >
                    ${email}
                </button>
                
                ${
                    isStudent
                        ? `
                    (Y${year || ''})
                `
                        : ''
                }
            `
            }
        </div>
       
        <div class="flex-center">
            ${
                isStudent
                    ? `
                ${student['accepted']} House Points
            `
                    : ''
            }
        </div>
        
        <div class="flex-center" style="justify-content: right">
            <button
                onclick="deleteUser('${id}', '${email}')"
                class="icon medium"
                svg="bin.svg"
                data-label="Delete ${email}"
                aria-label="Delete ${email}"
            ></button>
        </div>
    `;
}

// Filters
function toggleYearGroup(age) {
    if (filters.years.includes(age)) {
        filters.years.splice(filters.years.indexOf(age), 1);
    } else {
        filters.years.push(age);
    }
    showStudentsList();
}

function toggleAdmin() {
    filters.admin = !filters.admin;
    showStudentsList();
}

$addStudentButton.addEventListener('click', () => {
    const hide = fullPagePopup(
        document.body,
        `
    
        <h2 style="padding: 0">Add Student</h2>
        <div id="add-student-by-email">
            <label>
                <input
                    type="text"
                    id="add-student-email"
                    placeholder="Email"
                    aria-label="email"
                >
            </label>
            <br>
            <br>
            <div class="flex-center" style="justify-content: space-around">
                <label>
                    <input
                        type="number"
                        id="add-student-year"
                        max="13"
                        min="9"
                        placeholder="Year"
                        aria-label="year"
                    >
                </label>
                <button
                    id="add-student-submit"
                    class="icon"
                    svg="plus.svg"
                    aria-label="add student"
                ></button>
            </div>
        </div>
        
        <h1>or</h1>
        
        <div
            class="bordered"
            id="drop-file-zone"
        >
            <h3>Drop CSV here</h3>
            <input
                type="file"
                id="drop-file-inp"
                accept=".csv"
                onchange="uploadAddStudentsFile()"
            >
            <div id="loading-bar-container">
                <div id="loading-bar"></div>
            </div>
        </div>
    
    `
    );

    const $emailInp = document.querySelector('#add-student-email'),
        $yearInp = document.querySelector('#add-student-year');

    document.getElementById(`add-student-submit`).onclick = async () => {
        if (!$emailInp.value) {
            await core.showError('Email Required');
            return;
        }

        let userYear = parseInt($yearInp.value || '0');

        if ((userYear > 13 || userYear < 9) && userYear !== 0) {
            await core.showError('Year must be between 9 and 13 or blank for non-students');
            return;
        }

        if (userYear === 0) {
            if (
                !confirm(
                    'Are you sure you want this to be an non-student, admin account? If not, please provide a year.'
                )
            ) {
                return;
            }
        }

        const res = await core.api(`create/users`, {
            password: core.genPassword(),
            email: $emailInp.value,
            year: $yearInp.value
        });

        if (res.ok) {
            $emailInp.value = '';
            hide();
            await showStudentsList();
        }
    };

    core.reloadDOM();
});

async function deleteUser(id, email) {
    if (!confirm(`Are you sure you want to delete ${email} and all their house points?`)) {
        return;
    }

    await core.api(`delete/users`, { userId: id });

    if (selected.includes(id)) {
        selected.splice(selected.indexOf(id), 1);
    }

    await showStudentsList();
}

async function deleteSelected() {
    if (
        !confirm(
            `Are you sure you want to delete ${selected.length} students and their house points? This is irreversible.`
        )
    ) {
        return;
    }

    // send API requests at the same time and wait for all to finish
    await Promise.all(
        selected.map(async id => {
            await core.api(`delete/users`, { userId: id });
        })
    );

    selected.splice(0, selected.length);

    await showStudentsList();
}

async function ageSelected(amount) {
    if (
        !confirm(`Are you sure you want to change ${selected.length} students years by ${amount}?`)
    ) {
        return;
    }

    await Promise.all(
        selected.map(async id => {
            await core.api(`update/users/year`, {
                userId: id,
                by: amount
            });
        })
    );

    await showStudentsList();
}

async function giveHPToSelected() {
    let reason = prompt(`Reason to give ${selected.length} people a house point`);

    if (!reason) return;

    await Promise.all(
        selected.map(async id => {
            await core.api(`create/house-points/give`, {
                description: reason,
                userId: id,
                quantity: 1
            });
        })
    );

    await showStudentsList();
}

/**
 * Makes the API request to make a user not an admin and refreshes the list of students.
 * @param {string} userId
 * @param {string} email
 * @returns {Promise<void>}
 */
async function revokeAdmin(userId, email) {
    if (!confirm(`Are you sure you want to revoke '${email}'s admin access?`)) {
        return;
    }

    await core.api(`update/users/admin`, {
        userId,
        admin: false
    });

    await showStudentsList();
}

/**
 * Makes the API request to make a user an admin and refreshes the list of students.
 * @param {string} userId
 * @param {string} email
 * @returns {Promise<void>}
 */
async function makeAdmin(userId, email) {
    if (!confirm(`Are you sure you want to make '${email}' an admin?`)) {
        return;
    }

    await core.api(`update/users/admin`, {
        userId,
        admin: true
    });

    await showStudentsList();
}

async function uploadAddStudentsFile() {
    const fileContent = await core.getFileContent('#drop-file-inp');

    core.hide('#drop-file-inp');
    core.show('#loading-bar-container');

    const csv = core.CSVToArray(fileContent);

    let errors = [];

    let numPromisesResolve = csv.length;
    let resolved = 0;

    const $loadBar = document.getElementById('loading-bar');
    $loadBar.style.width = `${100 / numPromisesResolve}%`;

    function finishedAll() {
        core.hide('#loading-bar');
        core.show('#drop-file-zone');
        document.getElementById('drop-file-zone').innerHTML = `
                <p>
                    Finished adding 
                    ${csv.length}
                    students with
                    <span style="color: ${
                        errors.length ? 'var(--text-warning)' : 'rgb(118,255,103)'
                    }">
                        ${core.escapeHTML(errors.length)}
                    </span>
                    errors.
                </p>
                ${
                    errors.length
                        ? `
                    <br>Errors:<br>
                    <p style="color: var(--text-warning)">
                        ${errors.join('<br>')}
                    </p>
                `
                        : ''
                }
            `;

        showStudentsList();
    }

    // called at the end of each student being done
    function finishedOne() {
        resolved++;

        let percentDone = (resolved / numPromisesResolve) * 100;
        $loadBar.style.width = `${percentDone}%`;

        if (resolved === numPromisesResolve) {
            finishedAll();
        }
    }

    for (let i = 0; i < csv.length; i++) {
        (async () => {
            if (csv[i][0].toLowerCase() === 'email') {
                // skip header row
                finishedOne();
                return;
            }

            if (csv[i].length !== 3 && csv[i].length !== 2) {
                errors.push(
                    `Row ${i + 1}: wrong length. Expected 2 or 3 columns, got ${csv[i].length}`
                );
                finishedOne();
                return;
            }

            const [email, yearRaw, hpsRaw = '0'] = csv[i];

            const hps = parseInt(hpsRaw || '0');
            if (isNaN(hps)) {
                errors.push(`Row ${i + 1}: invalid house point count (col 3)`);
                finishedOne();
                return;
            }

            const year = parseInt(yearRaw);
            if (isNaN(year)) {
                errors.push(`Row ${i + 1}: invalid year (col 2)`);
                finishedOne();
                return;
            }

            let res = await core.api(`create/users`, {
                email,
                year,
                password: core.genPassword()
            });
            if (res['error']) {
                errors.push(`Error on row ${i + 1}: ${res['error']}`);
                finishedOne();
                return;
            }

            const { userId } = res;

            if (!userId) {
                errors.push(
                    `Error on row ${
                        i + 1
                    }: Not sure what went wrong :/. User wasn't created - I don't think?`
                );
                finishedOne();
                return;
            }

            if (hps > 0) {
                res = await core.api(`create/house-points/give`, {
                    description: 'From before',
                    userId,
                    quantity: hps
                });
                if (res['error']) {
                    errors.push(`Error on row ${i + 1}: ${res['error']}`);
                    finishedOne();
                    return;
                }
            }

            finishedOne();
        })().catch(err => {
            errors.push(`Something went wrong on row ${i + 1}: ${err}`);
            finishedOne();
        });
    }
}
