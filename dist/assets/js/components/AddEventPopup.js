'use strict';
import * as core from '../main.js';
import { registerComponent } from '../dom.js';
import StudentEmailInputWithIntellisense from './StudentEmailInputWithIntellisense.js';
import FullPagePopup from './FullPagePopup.js';
import { escapeHTML } from "../main.js";

/**
 * The popup showing 'allow' and 'reject' options for cookies.
 * Only allowed one in DOM at a time, so no need for unique namespace.
 *
 * @param {El} $el
 * @param {() => *} reload
 */
export default registerComponent('AddEventPopup', ($el, id, reload) => {
    let studentsInEvent = {};

    let $nameInp;
    let $descInp;
    let $dateInp;
    let $addEventAddStudent;
    let $addEventAddStudentsHTML;

    window._AddEventPopup__addStudentToEvent = async () => {
        const email = $addEventAddStudent.value;

        if (!email) {
            core.showError('Need an email to add student to event').then();
            return;
        }

        const user = await core.api(`get/users`, { email });

        if (!user.ok) {
            // error automatically shown
            return;
        }

        studentsInEvent[user['id']] = 1;

        $addEventAddStudent.value = '';

        await window._AddEventPopup__showStudentsInAddEvent();
        reload();
    };

    window._AddEventPopup__removeStudentFromEvent = async id => {
        delete studentsInEvent[id];
        await window._AddEventPopup__showStudentsInAddEvent();
        reload();
    };

    window._AddEventPopup__updateStudentPoints = async (id, points) => {
        // can't go below 1 hp
        studentsInEvent[id] = Math.max(points, 1);
        await window._AddEventPopup__showStudentsInAddEvent();
        reload();
    };

    window._AddEventPopup__showStudentsInAddEvent = async () => {
        if (!Object.keys(studentsInEvent).length) {
            $addEventAddStudentsHTML.innerHTML = 'No students selected';
            return;
        }

        const { data } = await core.api(`get/users/batch-info`, {
            userIds: Object.keys(studentsInEvent),
        });

        let html = '';
        for (let user of data) {
            html += `
				<div class="add-student-to-event-student">
					<div style="display: block">
						<email- args="${core.escapeHTML(JSON.stringify(user))}"></email->
						gets
						<input
							type="number"
							value="${escapeHTML(studentsInEvent[user.id])}"
							onchange="_AddEventPopup__updateStudentPoints('${user.id}', this.value)"
							style="width: 40px"
						>
						house points
					
					</div>
					<div style="display: block">
						<button
							onclick="_AddEventPopup__removeStudentFromEvent('${user.id}')"
						   data-label="Remove from new event"
							aria-label="Remove from new event"
							svg="cross.svg"
							class="icon small"
						></button>
					</div>
				</div>
			`;
        }

        $addEventAddStudentsHTML.innerHTML = html;
        core.reloadDOM($addEventAddStudentsHTML);
    };

    const hide = FullPagePopup(
        $el,
        `
		<div>
			<label>
				<input
					type="text"
					id="add-event-name"
					placeholder="Event Name"
					aria-label="name"
					style="width: calc(90% - 196px)"
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
				<div class="flex-center">
				    <label id="add-event-student-inp"></label>
                    <label>
                        <button
                            onclick="_AddEventPopup__addStudentToEvent()"
                            class="icon"
                            svg="plus.svg"
                            aria-label="add student"
                        ></button>
                    </label>
                </div>
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
	`, 'Create Event');

    document.getElementById(`add-event-submit`).onclick = async () => {
        if ($addEventAddStudent.value) {
            if (!confirm(`'${$addEventAddStudent.value}' is not in the event. Continue anyway?`)) {
                return;
            }
        }
        
        if ($nameInp.value.length < 3) {
            await core.showError('Event name is too short');
            return;
        }

        if ($nameInp.value.length > 50) {
            await core.showError('Event name too long - keep it simple!');
            return;
        }

        if ($nameInp.value.length > 25) {
            if (!confirm(`That's quite a long name, remember to keep it short!`)) {
                return;
            }
        }

        if (!$dateInp.value) {
            await core.showError('Event time is required');
            return;
        }

        if (Object.keys(studentsInEvent).length < 1) {
            if (!confirm(`Are you sure you want to proceed with 0 students in the event?`)) {
                return;
            }
        }

        // offset by an hour
        const time = new Date($dateInp.value).getTime() + 60 * 60 + 1;

        // event before the year 2000 is not allowed
        if (time <= 946684800) {
            await core.showError('Event time is before the year 2000');
            return;
        }

        const { id: eventId } = await core.api(`create/events`, {
            name: $nameInp.value,
            time,
            description: $descInp.value,
        });

        $nameInp.value = '';
        $descInp.value = '';

        await Promise.all(
            Object.keys(studentsInEvent).map(async userId => {
                await core.api(`create/house-points/give`, {
                    eventId,
                    userId,
                    quantity: studentsInEvent[userId],
                });
            })
        );

        studentsInEvent = {};

        hide();
        reload();
    };

    $nameInp = document.querySelector('#add-event-name');
    $descInp = document.querySelector('#add-event-description');
    $dateInp = document.querySelector('#add-event-date');
    $addEventAddStudentsHTML = document.querySelector('#add-event-students');
    $addEventAddStudent = StudentEmailInputWithIntellisense(
        '#add-event-student-inp',
        `Student's Email`,
        false,
        _AddEventPopup__addStudentToEvent,
    );
    $addEventAddStudent.addEventListener('keydown', async e => {
        if (e.key === 'Enter') {
            await _AddEventPopup__addStudentToEvent();
        }
    });

    $dateInp.valueAsDate = new Date();

    window._AddEventPopup__showStudentsInAddEvent().then(() => reload());
});
