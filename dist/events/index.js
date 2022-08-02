const $eventList = document.querySelector('#events');

(async () => {
	await init('..', true);

	const user = await userInfo();

	if (!GETParam['id']) {
		await showAllEvents();
	} else {
		await showEvent(GETParam['id']);
	}

})();

async function showAllEvents () {
	if (user['admin']) {
		show('add-event-button');

		document.getElementById('add-event-button').addEventListener('click', () => {
			insertComponent().addEventPopUp();
		});
	}

	const selected = [];

	const { data: items } = await api`get/events/all`;

	window.deleteEvents = async () => {
		await Promise.all(selected.map(async id => {
			await api`delete/events/with-id/${id}`;
		}));
	};

	const { reload } = insertComponent('#events').selectableList({
		name: 'Events',
		items,
		searchKey: 'name',
		uniqueKey: 'id',
		selected,
		titleBar: `
			<div class="list-title">
				<div></div>
				<div>name</div>
				<div>description</div>
			</div>
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
		itemGenerator: (event) => `
			<div>
				<a
					href="?id=${event['id']}"
					style="text-decoration: none; font-weight: bold"
					label="Go to ${event['name']}"
					label-offset="20px"
				>
					${event.name}
				</a>
				
			</div>
			<div>${event.description}</div>
		`
	});
}

async function showEvent (id) {
	const { data: event } = await api`get/events/with-id/${id}`;


}

