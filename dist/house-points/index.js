import * as core from '../assets/js/main.js';
import SelectableList from '../assets/js/components/SelectableList.js';
import { inlineComponent, reloadDOM } from '../assets/js/main.js';
import HousePoint from '../assets/js/components/HousePoint.js';

/** @typedef {{
 *     id: string,
 *     quantity: number,
 *     description: string,
 *     status: string,
 *     created: number,
 *     completed: number,
 *     rejectMessage: string,
 *     userId: string,
 *     userEmail: string,
 *     userYear: number,
 *     eventId: string,
 *     eventName: string,
 *     eventDescription: string,
 *     eventTime: number
}} HP  */

const filters = {
        years: [0, 9, 10, 11, 12, 13],
        status: 'All'
    },
    selected = [];

window.deleteSelected = deleteSelected;
window.toggleYearGroup = toggleYearGroup;
window.userPopup = core.userPopup;
window.eventPopup = core.eventPopup;

(async () => {
    await core.init('..', true, true);
    core.preloadSVGs(
        'bin.svg',
        'cross.svg',
        'pending.svg',
        'selected-checkbox.svg',
        'unselected-checkbox.svg'
    );

    await showHousePointList();
})();

async function showHousePointList() {
    const { data: hps } = await core.api(`get/house-points`);
    const admin = await core.isAdmin();

    SelectableList('#hps', {
        name: `House Points (${hps.length})`,
        items: hps,
        uniqueKey: 'id',
        searchKey: ['userEmail', 'description', 'eventName'],
        searchBarHint: 'user/description',
        selected,
        withAllMenu: `
            <span id="filters-container">
                <span style="display: inline-block">
                    <span
                        class="bordered big-link" 
                        id="filters-button"
                        svg="filter.svg"
                    >
                        Filters
                    </span>
                </span>
                <div id="filters-dropdown">
                    ${[9, 10, 11, 12, 13]
                        .map(
                            year => `
                        <button onclick="toggleYearGroup(${year})"> 
                            ${filters.years.includes(year) ? 'Hide' : 'Show'} 
                            Y${year}
                        </button>
                    `
                        )
                        .join('')}
                </div>
            </span>
            <button
                onclick="deleteSelected()"
                class="icon"
                aria-label="delete selected"
                data-label="Delete"
                svg="bin.svg"
            ></button>
        `,
        itemGenerator: hp => inlineComponent(HousePoint, hp, admin, true, showHousePointList, true),
        gridTemplateColsCSS: '1fr',
        filter: item => {
            return (
                filters.years.includes(item['userYear']) && (filters.admin ? item['admin'] : true)
            );
        }
    });

    reloadDOM();
}

// Filters
function toggleYearGroup(age) {
    if (filters.years.includes(age)) {
        filters.years.splice(filters.years.indexOf(age), 1);
    } else {
        filters.years.push(age);
    }
    showHousePointList();
}

async function deleteSelected() {
    if (!confirm(`Are you sure you want to delete ${selected.length} house points?`)) {
        return;
    }

    // send API requests at the same time and wait for all to finish
    await Promise.all(
        selected.map(async housePointId => {
            await core.api(`delete/house-points`, { housePointId });
        })
    );

    selected.splice(0, selected.length);

    await showHousePointList();
}
