'use strict';
import {registerComponent} from "./components.js";
import * as core from "../main.js";
import StudentEmailInputWithIntellisense from "./StudentEmailInputWithIntellisense.js";
import HousePoint from "./HousePoint.js";
import { inlineComponent } from "../main.js";

/** @typedef {{
 * 		id: string,
 * 		time: number,
 * 		name: string,
 * 		description: string,
 * 		studentEmail: string
 * }} Event */

/**
 * @param {El} $el
 * @param {() => Event} getEvent getter for event data
 */
const EventCard = registerComponent(($el, id, getEvent) => {

	/** @type Event */
	let event;

	let $addStudentToEvent;

	window[`_EventCard${id}__deleteStudent`] = async (housePointID) => {
		await core.api(`delete/house-points`, { housePointID });
		await hardReload();
	};

	window[`_EventCard${id}__addStudent`] = async () => {
		const email = $addStudentToEvent.value;

		if (!email) {
			await core.showError('Please enter an email');
			return;
		}

		if (email.length < 5) {
			await core.showError('Please enter a valid email');
			return;
		}

		const { id: userID } = await core.rawAPI(`get/users`, { email });

		if (!userID) {
			await core.showError('That user does not exist');
			return;
		}

		await core.api(`create/house-points/give`, {
			eventID: event['id'],
			userID,
			quantity: 1
		});

		await hardReload();
	};

	window[`_EventCard${id}__changeHpQuantity`] = async (housePointID, value) => {
		await core.api(`update/house-points/quantity`, {
			housePointID,
			quantity: value
		});
		await hardReload();
	};

	window[`_EventCard${id}__changeName`] = async (value) => {
		await core.api(`update/events/name`, {
			eventID: event.id,
			name: value
		});
		await hardReload();
	};

	window[`_HousePoint${id}__changeTime`] = async (value) => {
		await core.api(`update/events/time`, {
			eventID: event.id,
			time: new Date(value).getTime()/1000
		});
		await hardReload();
	};

	async function render () {
		
		const admin = await core.isAdmin();

		const ago = core.getRelativeTime(event.time * 1000);
		const date = new Date(event.time * 1000).toLocaleDateString();

		$el.innerHTML = `
			<div class="event-card" id="event-card-${id}">
				<h1>
					${admin ? `
						<input
							value="${event.name}"
							onchange="_EventCard${id}__changeName(this.value)"
							class="editable-text event-title-editable"
						>
					` : `
						${event.name}
					`}
				</h1>
				<p data-label="${ago}">
					${admin ? `
		                <input
		                    type="date"
		                    value="${core.formatTimeStampForInput(event.time)}"
		                    onchange="_HousePoint${id}__changeTime(this.value)"
		                >
					` : date}
				</p>
				<p style="font-size: 1.2em">
					${event.description}
				</p>
				<div>
					<h2>
						${event['housePointCount']} House Points Awarded
					</h2>
					${event['housePoints'].map(point => inlineComponent(
						HousePoint, point, hardReload, {
							admin,
							showBorderBottom: point === event['housePoints'][event['housePoints'].length - 1],
							showEmail: true,
							showReason: true,
							allowEventReason: false,
							showNumPoints: true,
							showDate: false,
							showStatusHint: false,
							showStatusIcon: true,
							showDeleteButton: true,
							showPendingOptions: false,
							reasonEditable: true,
							pointsEditable: true,
							dateEditable: false
					})).join('')}
					
					${admin ? `
						<div style="margin: 20px 0">
							 <span class="add-student-to-event"></span>
							 <button
								svg="plus.svg"
								data-label="Add Student"
								aria-label="add student"
								onclick="_EventCard${id}__addStudent(this)"
								class="icon medium"
								style="border: none"
							 ></button>
						<div>
					` : ''}
				</div>
			</div>
		`;

		core.asAdmin(() => {
			$addStudentToEvent = StudentEmailInputWithIntellisense(
				`#event-card-${id} .add-student-to-event`, 'Add student by email...');
		});

		core.reloadDOM();
	}

	async function hardReload () {
		const newEvent = await getEvent();
		if (!newEvent) {
			await core.showError('Event not found');
			return;
		}
		event = newEvent;
		await render();
	}

	hardReload().then();
});

export default EventCard;