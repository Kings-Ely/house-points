import * as core from '../assets/js/main.js';
import AddEventPopup from '../assets/js/components/AddEventPopup.js';
import SelectableList from '../assets/js/components/SelectableList.js';
import AddEventMultipleEntryPopup from "../assets/js/components/AddEventMultipleEntryPopup.js";

const selected = [];

window.eventPopup = core.eventPopup;
window.deleteEvents = deleteEvents;
window.showAllEvents = showAllEvents;
window.refreshAfterFilterChange = refreshAfterFilterChange;

(async () => {
    await core.init('..', true);

    await showAllEvents();

    if (core.GETParam('id')) {
        await eventPopup(core.GETParam('id'), showAllEvents);
    }
})();

function refreshAfterFilterChange () {
    while (selected.length > 0) selected.pop();
    showAllEvents();
}

async function showAllEvents() {

    const { data: items } = await core.api(`get/events`);

    if (await core.isAdmin()) {
        SelectableList('#events', {
            name: '<span svg="event.svg" class="icon icon-info-only"> Events</span>',
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
				<span class="filters-container">
                    <span style="display: inline-block">
                        <span
                            class="filters-button bordered big-link"
                            svg="filter.svg"
                        >
                            Filters
                        </span>
                    </span>
                    <div class="filters-dropdown">
                        From
                        <input
                            type="date"
                            bind="filter_startDate"
                            bind-persist
                        >
                        <br>
                        To
                        <input
                            type="date"
                            bind="filter_endDate"
                            bind-persist
                        >
                        <div style="text-align: center">
                            <button
                                onclick="refreshAfterFilterChange()"
                                class="bordered"
                                style="margin: 4px;"
                            >Apply</button>
                        </div>
                    </div>
                </span>
			`,
            itemGenerator: eventHTML,
            filter: event => {
                
                const eventDay = new Date(new Date(event.time*1000).toDateString());
    
                const startDate = new Date(
                    new Date(core.reservoir.get('filter_startDate')).toDateString()
                );
                const endDate = new Date(
                    new Date(core.reservoir.get('filter_endDate')).toDateString()
                );
                
                if (core.reservoir.has('filter_startDate')) {
                    if (core.reservoir.has('filter_endDate')) {
                        if (startDate > endDate) {
                            core.showError('Start date cannot be after end date');
                            return false;
                        }
                    }
                    if (eventDay < startDate) {
                        return false;
                    }
                }
                if (core.reservoir.has('filter_endDate')) {
                    if (eventDay > new Date(endDate)) {
                        return false;
                    }
                }
                
                return true;
            }
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

function eventHTML(event) {
    return `
		<div 
			class="flex-center"
			style="justify-content: left"
			onclick="eventPopup('${event.id}', showAllEvents)"
		>
			<button
				style="text-decoration: none; font-weight: bold"
				class="vertical-flex-center"
			>
				${core.escapeHTML(event.name)}
				<span style="font-size: 0.9em; color: var(--text-light); padding-left: 5px">
					(${new Date(event.time * 1000).toLocaleDateString()})
				</span>
			</button>
		</div>
		<p 
			class="flex-center"
			style="justify-content: right; padding: 0; margin: 0;"
			onclick="eventPopup('${event.id}', showAllEvents)"
		>
			${core.escapeHTML(core.limitStrLength(event.description))}
		</p>
	`;
}

async function deleteEvents() {
    if (!selected.length) {
        await core.showError('No events selected');
        return;
    }
    if (
        !confirm(
            `Are you sure you want to delete ${selected.length} event${
                selected.length > 1 ? 's' : ''
            }?`
        )
    ) {
        return;
    }
    await Promise.all(
        selected.map(async eventId => {
            await core.api(`delete/events`, { eventId });
        })
    );
    await showAllEvents();
}

document.getElementById('add-event-button').addEventListener('click', () => {
    AddEventPopup(document.body, showAllEvents);
});

document.getElementById('add-event-button-multi-entry').addEventListener('click', () => {
    AddEventMultipleEntryPopup(document.body, showAllEvents);
});

