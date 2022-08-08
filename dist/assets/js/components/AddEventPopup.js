'use strict';
import { registerComponent } from "./components.js";
import * as core from "../main.js";
import StudentEmailInputWithIntellisense from "./StudentEmailInputWithIntellisense.js";
import FullPagePopup from "./FullPagePopup.js";

/**
 * The popup showing 'allow' and 'reject' options for cookies.
 * Only allowed one in DOM at a time, so no need for unique namespace.
 *
 * @param {El} $el
 * @param {() => *} reload
 */
const AddEventPopup = registerComponent(($el, id, reload) => {

	let studentsInEvent = {};

	let $nameInp;
	let $descInp;
	let $dateInp;
	let $addEventAddStudent;
	let $addEventAddStudentsHTML;

	window._AddEventPopup__addStudentToEvent = async () =>{
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

		await window._AddEventPopup__showStudentsInAddEvent();
		reload();
	}

	window._AddEventPopup__removeStudentFromEvent = async (id) => {
		delete studentsInEvent[id];
		await window._AddEventPopup__showStudentsInAddEvent();
		reload();
	}

	window._AddEventPopup__updateStudentPoints = async (id, points) => {
		// can't go below 1 hp
		studentsInEvent[id] = Math.max(points, 1);
		await window._AddEventPopup__showStudentsInAddEvent();
		reload();
	}

	window._AddEventPopup__showStudentsInAddEvent = async () => {

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
							onchange="_AddEventPopup__updateStudentPoints('${id}', this.value)"
							style="width: 40px"
						>
						house points
					
					</div>
					<div style="display: block">
						<button
							onclick="_AddEventPopup__removeStudentFromEvent('${id}')"
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

	const hide = FullPagePopup($el, `
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
						onclick="_AddEventPopup__addStudentToEvent()"
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
	$addEventAddStudent = StudentEmailInputWithIntellisense('#add-event-student-inp');

	$dateInp.valueAsDate = new Date();

	window._AddEventPopup__showStudentsInAddEvent()
		.then(() => reload());
});

export default AddEventPopup;