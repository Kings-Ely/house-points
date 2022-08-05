'use strict';
import * as core from "./main.js";

let currentComponentID = 0;

/**
 *  Wrapper for inserting a component into the DOM.
 *  Call function on return value of this function to actually add the element.
 *
 * @param {HTMLElement|string|undefined} [$el=document.body]
 */
export default function insertComponent ($el=document.body) {
    if (typeof $el === 'string') {
        $el = document.querySelector($el);
    }
    return {
        studentEmailInputWithIntellisense: (placeholder='Email', allowNonStudents=false) => {
            const id = currentComponentID++;
            $el.innerHTML += `
                <span>
                    <span class="student-email-input-wrapper">
                        <input
                            type="text"
                            class="student-email-input"
                            placeholder="${placeholder}"
                            autocomplete="off"
                            aria-label="student email"
                            id="student-email-input-${id}"
                        >
                        <div
                            class="student-email-input-dropdown" 
                            id="student-email-input-dropdown-${id}"
                        ></div>
                    </span>
                </span>
            `;

            const $studentNameInput = document.getElementById(`student-email-input-${id}`);
            const $dropdown = document.getElementById(`student-email-input-dropdown-${id}`);

            window[`onClickStudentEmailInput${id}`] = (value) => {
                $studentNameInput.value = value;
            };

            window.addEventListener('click', () => {
                $dropdown.classList.toggle('student-email-input-show-dropdown');
            });

            core.api`get/users`.then(({data}) => {

                const studentNames = data
                    .filter(user => user['student'] || allowNonStudents)
                    .map(student => student['email']);

                $studentNameInput.addEventListener('input', async () => {
                    const value = $studentNameInput.value;

                    /* if uncommented will hide when there is no input
                    if (!value) {
                        $dropdown.classList.remove('student-email-input-show-dropdown');
                        return;
                    }
                     */

                    let users = studentNames.filter(name =>
                        name.toLowerCase().includes(value.toLowerCase())
                    );

                    if (users.length === 0) {
                        $dropdown.classList.remove('student-email-input-show-dropdown');
                        return;
                    }

                    let extra = 0;
                    if (users.length > 10) {
                        extra = users.length - 10;
                        users = users.slice(0, 10);
                    }

                    $dropdown.classList.add('student-email-input-show-dropdown');

                    $dropdown.innerHTML = '';

                    for (let name of users) {
                        $dropdown.innerHTML += `
                            <p onclick="window['onClickStudentEmailInput${id}']('${name}')">
                                ${name} 
                            </p>
                        `;
                    }

                    if (extra) {
                        $dropdown.innerHTML += `
                            <p class="no-hover">
                                (and ${extra} more)
                            </p>
                        `;
                    }
                });
            });

            return $studentNameInput;
        },

        cookiePopUp: () => {
            currentComponentID++;

            /**
             * The user has either allowed or not allowed cookies
             * @param {boolean} value
             */
            window.allowedCookies = async value => {
                core.hide($el);
                if (!value) {
                    return;
                }
                await core.setCookie(core.COOKIE_ALLOW_COOKIES_KEY, '1', 365);
            };

            $el.innerHTML += `
                <h2>Cookies</h2>
                <p>
                    We and selected third parties use cookies or similar technologies for
                    technical purposes and, with your consent, for other purposes.
                    Denying consent may make related features unavailable.
                    You can freely give, deny, or withdraw your consent at any time.
                    You can consent to the use of such technologies by using the “Accept” button.
                </p>
        
                <button 
                    onclick="allowedCookies(true)"
                    class="big-link"
                >
                    Accept
                </button>
                <button 
                    onclick="allowedCookies(false)"
                    class="big-link"
                >
                    Reject
                </button>
            `;
        },

        fullPagePopUp: (content) => {
            currentComponentID++;

            if (document.getElementById('full-page-popup')) {
                // remove any current popups
                const $p = document.getElementById('full-page-popup');
                $p.parentElement.removeChild($p);
            }

            const $p = document.createElement('div');
            $p.id = 'full-page-popup';

            $p.innerHTML = `
                <div id="full-page-popup-content">
                    ${content}
                </div>
            `;

            // add to page
            $el.appendChild($p);

            function hide () {
                $p.remove();
                removeEventListener('keydown', keyDownListener);
            }

            $p.addEventListener('click', (evt => {
                // check that we clicked on the background not the popup content
                if (evt.target.id === 'full-page-popup') {
                    hide();
                }
            }));

            const keyDownListener = evt => {
                if (evt.key === 'Escape') {
                    hide();
                }
            };

            addEventListener('keydown', keyDownListener);

            return hide;
        },

        addEventPopUp: (reload) => {
            currentComponentID++;

            let studentsInEvent = {};

            let $nameInp;
            let $descInp;
            let $dateInp;
            let $addEventAddStudent;
            let $addEventAddStudentsHTML;

            window.addStudentToEvent = async () =>{
                const email = $addEventAddStudent.value;

                if (!email) {
                    core.showError('Need an email to add student to event').then();
                    return;
                }

                const user = await core.api`get/users/from-email/${email}`;

                if (!user.ok) {
                    // error automatically shown
                    return;
                }

                studentsInEvent[user['id']] = 1;

                $addEventAddStudent.value = '';

                await window.showStudentsInAddEvent();
                reload();
            }

            window.removeStudentFromEvent = async (id) => {
                delete studentsInEvent[id];
                await window.showStudentsInAddEvent();
                reload();
            }

            window.updateStudentPoints = async (id, points) => {
                // can't go below 1 hp
                studentsInEvent[id] = Math.max(points, 1);
                await window.showStudentsInAddEvent();
                reload();
            }

            window.showStudentsInAddEvent = async () => {

                if (!Object.keys(studentsInEvent).length) {
                    $addEventAddStudentsHTML.innerHTML = 'No students selected';
                    return;
                }

                const { data } = await core.api`get/users/batch-info/${Object.keys(studentsInEvent).join(',')}`;

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
                                   data-label="Remove from new event"
                                    aria-label="Remove from new event"
                                    svg="bin.svg"
                                    class="icon small"
                                ></button>
                            </div>
                        </div>
                    `;
                }

                $addEventAddStudentsHTML.innerHTML = html;
                core.reloadDOM();
            }

            const hide = insertComponent($el).fullPagePopUp(`
                <h1>Add Event</h1>
                <div>
                    <label>
                        <input
                            type="text"
                            id="add-event-name"
                            placeholder="Event Name"
                            aria-label="name"
                        >
                    </label>
                    <label>
                        <input
                            type="date"
                            id="add-event-date"
                            aria-label="event date"
                        >
                    </label>
                    <label>
                        <textarea
                            id="add-event-description"
                            placeholder="Description"
                            aria-label="description"
                        ></textarea>
                    </label>
                    <div>
                        <h2>Students in Event</h2>
                        <label id="add-event-student-inp"></label>
                        <label>
                            <button
                                onclick="addStudentToEvent()"
                                class="icon"
                                svg="plus.svg"
                                aria-label="add student"
                            ></button>
                        </label>
                        <div id="add-event-students"></div>
                    </div>
                </div>
                <div style="text-align: center; width: 100%; margin: 20px 0;">
                    <button
                        id="add-event-submit"
                        aria-label="add event"
                    >
                        Create Event
                    </button>
                </div>
            `);


            document.getElementById(`add-event-submit`).onclick = async () => {

                if ($nameInp.value.length < 3) {
                    await core.showError('Event name is too short');
                    return;
                }

                if ($nameInp.value.length > 30) {
                    await core.showError('Event name too long - keep it simple!');
                    return;
                }

                if (!$dateInp.value) {
                    await core.showError('Event time is required');
                    return;
                }

                const time = new Date($dateInp.value).getTime();

                // event before the year 2000 is not allowed
                if (time <= 946684800) {
                    await core.showError('Event time is before the year 2000');
                    return;
                }

                const { id: eventID } =
                    await core.api`create/events/${$nameInp.value}/${time}?description=${$descInp.value}`;

                $nameInp.value = '';
                $descInp.value = '';

                await Promise.all(Object.keys(studentsInEvent).map(async userID => {
                    await core.api`create/house-points/give/${userID}/${studentsInEvent[userID]}?event=${eventID}`;
                }));

                studentsInEvent = {};

                hide();
                reload();
            };

            $nameInp = document.querySelector('#add-event-name');
            $descInp = document.querySelector('#add-event-description');
            $dateInp = document.querySelector('#add-event-date');
            $addEventAddStudentsHTML = document.querySelector('#add-event-students');
            $addEventAddStudent = insertComponent(document.querySelector('#add-event-student-inp'))
                .studentEmailInputWithIntellisense();

            $dateInp.valueAsDate = new Date();

            window.showStudentsInAddEvent()
                .then(reload);
        },

        selectableList: ({
            name,
            items,
            uniqueKey='id',
            searchKey,
            titleBar='',
            withAllMenu='',
            itemGenerator,
            gridTemplateColsCSS = '1fr 1fr',
            selected
        }) => {
            core.preloadSVGs('selected-checkbox.svg', 'unselected-checkbox.svg');

            currentComponentID++;

            window[`selectableList${currentComponentID}_selectAll`] = (select) => {
                selected.splice(0, selected.length);

                if (select) {
                    for (let item of items) {
                        selected.push(item[uniqueKey]);
                    }
                }
                reload();
            };

            window[`selectableList${currentComponentID}_select`] = async (id, select) => {
                if (select) {
                    if (selected.indexOf(id) !== -1) {
                        console.error('Cannot reselect ' + id);
                        return;
                    }
                    selected.push(id);
                } else {
                    const index = selected.indexOf(id);
                    if (index !== -1) {
                        selected.splice(index, 1);
                    } else {
                        console.error('Cannot unselect ' + id);
                    }
                }
                reload();
            }

            $el.innerHTML = `
                <div class="selectable-list" id="selectable-list-${currentComponentID}">
                    <h2>${name}</h2>
                    <div class="with-all-menu">
                        <div>
                            <span class="select-all-outline">
                                <span 
                                    class="icon icon-info-only" 
                                    svg="small-down-arrow.svg"
                                ></span>
                                <button
                                    onclick="selectableList${currentComponentID}_selectAll(true)"
                                    class="icon"
                                    svg="unselected-checkbox.svg"
                                   data-label="Select All"
                                    aria-label="select all"
                                ></button>
                                
                                <button
                                    onclick="selectableList${currentComponentID}_selectAll(false)"
                                    class="icon"
                                    svg="unselect-checkbox.svg"
                                   data-label="Unselect All"
                                    aria-label="unselect all"
                                ></button>
                            </span>
                            
                            ${withAllMenu}
                        </div>
                        <div>
                            <label>
                                <input
                                    placeholder="search for ${searchKey}..."
                                    oninput="selectableList${currentComponentID}_reloadItems()"
                                    class="search"
                                    autocomplete="off"
                                    aria-label="search"
                                >
                            </label>
                        </div>
                    </div>
                    <div>${titleBar}</div>
                    <div class="items"></div>
                </div>
            `;

            const $items = document.querySelector(`#selectable-list-${currentComponentID} .items`);
            const $search = document.querySelector(`#selectable-list-${currentComponentID} .search`);

            async function reload (newItems=null) {
                if (newItems) {
                    items = newItems;
                }

                $items.innerHTML = '';

                const searchValue = $search.value.toLowerCase();

                for (let item of items) {
                    if (searchValue && !item[searchKey].toLowerCase().includes(searchValue)) {
                        continue;
                    }

                    const id = item[uniqueKey];

                    const isSelected = selected.includes(id);

                    $items.innerHTML += `
                        <div class="item">
                            <button
                                class="icon medium no-scale"
                                svg="${isSelected ? 'selected-checkbox' : 'unselected-checkbox'}.svg"
                                aria-label="${isSelected ? 'Unselect' : 'Select'}"
                                onclick="selectableList${currentComponentID}_select('${id}', ${isSelected ? 'false' : 'true'})"
                            ></button>
                            <div class="item-content" style="grid-template-columns: ${gridTemplateColsCSS}">
                                  ${await itemGenerator(item, isSelected)}
                            </div>
                        </div>
                    `;
                }

                core.reloadDOM();
            }

            window[`selectableList${currentComponentID}_reloadItems`] = reload;

            reload().then();

            return { reload };
        },

        eventCard: (getEvent, admin) => {
            const id = currentComponentID++;

            let event;

            let $addStudentToEvent;

            window[`eventCard${id}_deleteStudent`] = async (id) => {
                await core.api`delete/house-points/with-id/${id}`;
                await hardReload();
            };

            window[`eventCard${id}_addStudent`] = async () => {
                const email = $addStudentToEvent.value;

                if (!email) {
                    await core.showError('Please enter an email');
                    return;
                }

                if (email.length < 5) {
                    await core.showError('Please enter a valid email');
                    return;
                }

                const { id: userID } = await core.api`get/users/from-email/${email}`;

                await core.api`create/house-points/give/${userID}/1?event=${event['id']}`;

                core.hardReload();
            };

            window[`eventCard${id}_changeHpQuantity`] = async (id, value) => {
                await core.api`update/house-points/quantity/${id}/${value}`;
                render();
            };

            function render () {

                const ago = core.getRelativeTime(event['time'] * 1000);
                const date = new Date(event['time'] * 1000).toLocaleDateString();

                $el.innerHTML = `
                    <div class="event-card" id="event-card-${id}">
                        <h1>${event['name']}</h1>
                        <p>
                            ${ago} (${date})
                        </p>
                        <p style="font-size: 1.2em">
                            ${event['description']}
                        </p>
                        <div>
                            <h2>
                                ${event['housePointCount']} House Points Awarded
                            </h2>
                            ${event['housePoints'].map(point => `
                                <div class="hp">
                                    <div>${point['studentEmail'] || '???'}</div>
                                    ${admin ? `
                                        <input 
                                            type="number"
                                            onchange="eventCard${id}_changeHpQuantity('${point.id}', this.value)"
                                            value="${point['quantity']}"
                                            style="width: 40px; font-size: 15px"
                                        >
                                        <button
                                           data-label="Delete house points"
                                            onclick="eventCard${id}_deleteStudent('${point['id']}')"
                                            svg="bin.svg"
                                            class="icon small"
                                        ></button>
                                    ` : `
                                        (${point['quantity']})
                                    `}
                                </div>
                            `).join('')}
                            
                            ${admin ? `
                                <div style="margin: 20px 0">
                                     <span class="add-student-to-event"></span>
                                     <button
                                        svg="plus.svg"
                                        data-label="Add Student"
                                        aria-label="add student"
                                        onclick="eventCard${id}_addStudent(this)"
                                        class="icon medium"
                                        style="border: none"
                                     ></button>
                                <div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }

            async function hardReload () {
                const newEvent = await getEvent();
                if (!newEvent) {
                    await core.showError('Event not found');
                    return;
                }
                event = newEvent;
                render();
                core.reloadDOM();

                core.asAdmin(() => {
                    $addStudentToEvent = insertComponent(`#event-card-${id} .add-student-to-event`)
                        .studentEmailInputWithIntellisense('Add student by email...');
                });
            }

            hardReload().then();
        }
    };
}