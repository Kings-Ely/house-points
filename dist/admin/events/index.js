let selected = [];
let events = [];
let studentsInEvent = {};

const searchFilterInput = document.getElementById('search');

const $nameInp = document.querySelector('#add-event-name');
const $descInp = document.querySelector('#add-event-description');
const $timeInp = document.querySelector('#add-event-time');
const $events = document.querySelector(`#events`);
// replaced with input element
let $addEventAddStudent = document.querySelector('#add-event-student-inp');
let $addEventAddStudentsHTML = document.querySelector('#add-event-students');

(async () => {
    await init('../..');

    $addEventAddStudent = insertComponent($addEventAddStudent).studentEmailInputWithIntellisense();

    if (!await signedIn() || !(await userInfo())['admin']) {
        await navigate(`/?error=auth`);
    }

    await main();
})();

function showEvent (event, selected) {

    let { id, name, description } = event;

    if (description.length > 50) {
        description = description.substring(0, 50) + '...';
    }

    return `
        <div class="event">
            <div>
                <button 
                    onclick="select('${id}', ${!selected})"
                    class="icon no-scale"
                    svg="${selected ? 'selected-checkbox' : 'unselected-checkbox'}.svg"
                    aria-label="${selected ? 'Unselect' : 'Select'}"
                ></button>
            </div>
            
            <div style="min-width: 150px">
                ${name} ${description ? `(${description})` : ''}
            </div>
           
            <div>
                <button
                    onclick="deleteEvent('${id}', '${name}')"
                    class="icon"
                    svg="bin.svg"
                    label="Delete ${name}"
                    aria-label="Delete ${name}"
                ></button>
            </div>
        </div>
    `;
}

async function deleteEvent (id, name) {
    if (!confirm(`Are you sure you want to delete '${name}' (ID '${id}') and all its house points?`)) {
        return;
    }

    await api`delete/events/with-id/${id}`;

    await main();
}

async function addStudentToEvent () {
    const email = $addEventAddStudent.value;

    if (!email) {
        showError('Need an email to add student to event').then();
        return;
    }

    const user = await api`get/users/from-email/${email}`;

    if (!user.ok) {
        // error automatically shown
        return;
    }

    studentsInEvent[user['id']] = 1;

    $addEventAddStudent.value = '';

    await main(false);
}

function removeStudentFromEvent (id) {
    delete studentsInEvent[id];
    main(false).then();
}

async function deleteSelected () {
    if (!confirm(
        `Are you sure you want to delete ${selected.length} events and the house points associated with it? This is irreversible.`)) {
        return;
    }

    // send API requests at the same time and wait for all to finish
    await Promise.all(selected.map(async id => {
        await api`delete/events/with-id/${id}`;
    }));

    await main();
}

function updateStudentPoints (id, points) {
    // can't go below 1 hp
    studentsInEvent[id] = Math.max(points, 1);
    main(false).then();
}

async function showStudentsInAddEvent () {

    if (!Object.keys(studentsInEvent).length) {
        $addEventAddStudentsHTML.innerHTML = 'No students selected';
        return;
    }

    const { data } = await api`get/users/batch-info/${Object.keys(studentsInEvent).join(',')}`;

    let html = '';
    for (let user of data) {
        const { email, id, year } = user;
        html += `
            <div class="add-student-to-event-student">
                <div style="display: block">
                    ${email} 
                    (Y${year})
                    gets
                    <input
                        type="number"
                        value="${studentsInEvent[id]}"
                        onchange="updateStudentPoints('${id}', this.value)"
                        style="width: 40px"
                    >
                    house points
                
                </div>
                <div style="display: block">
                    <button
                        onclick="removeStudentFromEvent('${id}')"
                        label="Remove ${email} from new event"
                        aria-label="Remove ${email} from new event"
                        svg="bin.svg"
                        class="icon"
                    ></button>
                </div>
            </div>
        `;
    }

    $addEventAddStudentsHTML.innerHTML = html;
    reloadDOM();
}

async function select (id, select) {
    if (select) {
        // add to selected
        if (selected.indexOf(id) !== -1) {
            console.error(`Cannot reselect event with ID '${id}'`);
            return;
        }
        selected.push(id);
    } else {
        // remove from selected
        const index = selected.indexOf(id);
        if (index !== -1) {
            selected.splice(index, 1);
        } else {
            console.error(`Cannot unselect event with ID '${id}'`);
        }
    }
    main(false).then();
}

function selectAll (select=true) {
    if (select) {
        // select all events
        selected = events.map(e => e['id']);
    } else {
        // unselect all events
        selected = [];
    }

    main(false).then();
}


async function main (reload=true) {

    if (reload || !events) {
        events = (await api`get/events/all`)['data'];
    }

    $events.innerHTML = `
        <div class="event">
            <div style="width: 50px"></div>
            
            <div> <b>Year</b> </div>
            
            <div style="min-width: 150px"> <b>Name</b> </div>
            
            <div> <b>House Points</b> </div>
            
            <div style="width: 100px"></div>
        </div>
    `;

    await showStudentsInAddEvent();

    const searchValue = searchFilterInput.value;

    let html = '';

    for (let evt of events) {
        if (searchValue && !evt['name'].toLowerCase().includes(searchValue.toLowerCase())) {
            continue;
        }
        html += showEvent(evt, selected.indexOf(evt['id']) !== -1);
    }

    $events.innerHTML += html;

    reloadDOM();
}

document.getElementById(`add-event-submit`).onclick = async () => {

    if ($nameInp.value.length < 3) {
        showError('Event name is too short').then();
        return;
    }

    if (!$timeInp.value) {
        showError('Event time is required').then();
        return;
    }

    const time = new Date($timeInp.value).getTime();
    const { id: eventID } = await api`create/events/${$nameInp.value}/${time}?description=${$descInp.value}`;

    $nameInp.value = '';
    $descInp.value = '';

    await Promise.all(Object.keys(studentsInEvent).map(async userID => {
        await api`create/house-points/give/${userID}/${studentsInEvent[userID]}?event=${eventID}`;
    }));

    studentsInEvent = {};

    await main();
};