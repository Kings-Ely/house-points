'use strict';
import {registerComponent} from "./components.js";
import * as core from "../main.js";
import StudentEmailInputWithIntellisense from "./StudentEmailInputWithIntellisense.js";

/** @typedef {{
 * 		id: string,
 * 		time: number,
 * 		name: string,
 * 		description: string,
 * 		studentEmail: string
 * }} Event */

window.userPopup = core.userPopup;

/**
 * @param {El} $el
 * @param {() => Event} getEvent getter for event data
 * @param {boolean} admin should be admin options be shown
 */
const EventCard = registerComponent(($el, id, getEvent, admin) => {

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
			event: event['id'],
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

	window[`_EventCard${id}__changeName`] = async (eventID, value) => {
		await core.api(`update/events/name`, {
			eventID,
			name: value
		});
		await hardReload();
	};

	function render () {

		const ago = core.getRelativeTime(event.time * 1000);
		const date = new Date(event.time * 1000).toLocaleDateString();

		$el.innerHTML = `
			<div class="event-card" id="event-card-${id}">
				<h1>
					${admin ? `
						<input
							value="${event.name}"
							onchange="_EventCard${id}__changeName('${event.id}', this.value)"
							class="editable-text event-title-editable"
						>
					` : `
						${event.name}
					`}
				</h1>
				<p>
					${ago} (${date})
				</p>
				<p style="font-size: 1.2em">
					${event.description}
				</p>
				<div>
					<h2>
						${event['housePointCount']} House Points Awarded
					</h2>
					${event['housePoints'].map(point => `
						<div class="hp">
							<button
								onclick="userPopup('${point.studentEmail}')"
							>
								${point.studentEmail || '???'}
							</button>
							${admin ? `
								<input 
									type="number"
									onchange="_EventCard${id}__changeHpQuantity('${point.id}', this.value)"
									value="${point['quantity']}"
									style="width: 40px; font-size: 15px"
								>
								<button
								   data-label="Delete house points"
									onclick="_EventCard${id}__deleteStudent('${point['id']}')"
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
								onclick="_EventCard${id}__addStudent(this)"
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
			$addStudentToEvent = StudentEmailInputWithIntellisense(
				`#event-card-${id} .add-student-to-event`, 'Add student by email...');
		});
	}

	hardReload().then();
});

export default EventCard;