(async () => {
	await init('..', true);

	await showAllEvents();

	if (GETParam('id')) {
		await showEvent();
	}

})();

async function showAllEvents () {

	if (await isAdmin()) {
		show('add-event-button', 'flex');

		document.getElementById('add-event-button')
			.addEventListener('click', () => {
				insertComponent().addEventPopUp(showAllEvents)
			});
	}

	const selected = [];

	const { data: items } = await api`get/events`;

	window.deleteEvents = async () => {
		await Promise.all(selected.map(async id => {
			await api`delete/events/with-id/${id}`;
		}));
		showAllEvents();
	};

	if (await isAdmin()) {

		insertComponent('#events').selectableList({
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
					label="Delete"
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

	reloadDOM();
}

function eventHTML (event) {
	return `
		<div>
			<button
				onclick="showEvent('${event.id}')"
				style="text-decoration: none; font-weight: bold"
				label="View ${event['name']}"
				label-offset="100px"
			>
				${event.name}
				<span style="font-size: 0.6em; color: var(--text-light)">
					(${new Date(event.time*1000).toLocaleDateString()})
				</span>
			</button>
		</div>
		<div>${limitStrLength(event.description)}</div>
	`;
}

async function showEvent (id=GETParam('id')) {
	const { data: [ event ] } = await api`get/events?id=${id}`;

	if (!event) {
		await showError('Event not found');
		return;
	}

	insertComponent().fullPagePopUp(`
		<div id="event-popup"></div>
	`);

	insertComponent('#event-popup').eventCard(
		event,
		(await userInfo())['admin'],
		() => showEvent(id)
	);
}