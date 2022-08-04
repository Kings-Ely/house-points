(async () => {
	await init('..', true);

	await showAllEvents();

	if (GETParam('id')) {
		await eventPopup();
	}

})();

async function showAllEvents () {

	if (await isAdmin()) {
		show('#add-event-button', 'flex');

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
		await showAllEvents();
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

	reloadDOM();
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
			${limitStrLength(event.description)}
		</p>
	`;
}

async function eventPopup (id=GETParam('id')) {
	const { data: [ event ] } = await api`get/events?id=${id}`;

	if (!event) {
		await showError('Event not found');
		return;
	}

	insertComponent().fullPagePopUp(`
		<div id="event-popup"></div>
	`);

	insertComponent('#event-popup').eventCard(
		async () => ((await api`get/events?id=${id}`)?.['data']?.[0]),
		(await userInfo())['admin'],
	);
}