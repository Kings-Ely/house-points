import * as core from "../assets/js/main.js";
import AddEventPopup from "../assets/js/components/AddEventPopup.js";
import FullPagePopup from "../assets/js/components/FullPagePopup.js";
import EventCard from "../assets/js/components/EventCard.js";
import SelectableList from "../assets/js/components/SelectableList.js";

(async () => {
	await core.init('..', true);

	await showAllEvents();

	if (core.GETParam('id')) {
		await eventPopup();
	}

})();

async function showAllEvents () {

	if (await core.isAdmin()) {
		core.show('#add-event-button', 'flex');

		document.getElementById('add-event-button')
			.addEventListener('click', () => {
				AddEventPopup(showAllEvents)
			});
	}

	const selected = [];

	const { data: items } = await core.api`get/events`;

	window.deleteEvents = async () => {
		await Promise.all(selected.map(async id => {
			await core.api`delete/events/with-id/${id}`;
		}));
		await showAllEvents();
	};

	if (await core.isAdmin()) {

		SelectableList('#events', {
			name: 'Events',
			items,
			searchKey: 'name',
			uniqueKey: 'id',
			selected,
			titleBar: `
				<div class="list-title"></div>
			`,
			withAllMenu: `
				<button
					onclick="deleteEvents()"
					svg="bin.svg"
					aria-label="delete selected"
					data-label="Delete"
					class="icon"
				></button>
			`,
			itemGenerator: eventHTML
		});
	} else {
		document.getElementById('events').innerHTML = `
			<h2>Events</h2>
			<div style="padding: 20px;">
				${items.map(event => `
					<div class="flex-center" style="justify-content: space-between">
						${eventHTML(event)}
					</div>
				`).join('')}
			</div>

		`;
	}

	core.reloadDOM();
}

function eventHTML (event) {
	return `
		<div 
			class="flex-center" 
			style="justify-content: left"
			onclick="eventPopup('${event.id}')"
		>
			<button
				style="text-decoration: none; font-weight: bold"
			>
				${event.name}
				<span style="font-size: 0.6em; color: var(--text-light)">
					(${new Date(event.time*1000).toLocaleDateString()})
				</span>
			</button>
		</div>
		<p 
			class="flex-center" 
			style="justify-content: right"
			onclick="eventPopup('${event.id}')"
		>
			${core.limitStrLength(event.description)}
		</p>
	`;
}

async function eventPopup (id=core.GETParam('id')) {
	const { data: [ event ] } = await core.api`get/events?id=${id}`;

	if (!event) {
		await core.showError('Event not found');
		return;
	}

	FullPagePopup(document.body, `
		<div id="event-popup"></div>
	`);

	EventCard('#event-popup',
		async () => ((await core.api`get/events?id=${id}`)?.['data']?.[0]),
		(await core.userInfo())['admin'],
	);
}