import * as core from "../assets/js/main.js";
import SelectableList from "../assets/js/components/SelectableList.js";
import { reloadDOM } from "../assets/js/main.js";

/** @typedef {{
 *     id: string,
 *     quantity: number,
 *     description: string,
 *     status: string,
 *     created: number,
 *     completed: number,
 *     rejectMessage: string,
 *     userID: string,
 *     studentEmail: string,
 *     studentYear: number,
 *     eventID: string,
 *     eventName: string,
 *     eventDescription: string,
 *     eventTime: number
}} HP  */

const
    filters = {
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

    await showHousePointList();
})();

async function showHousePointList () {
    SelectableList('#hps', {
        name: 'House Points',
        items: (await core.api`get/house-points`)['data'],
        uniqueKey: 'id',
        searchKey: ['studentEmail', 'description', 'eventName'],
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
                    ${[9, 10, 11, 12, 13].map(year => `
                        <button onclick="toggleYearGroup(${year})"> 
                            ${filters.years.includes(year) ? 'Hide' : 'Show'} 
                            Y${year}
                        </button>
                    `).join('')}
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
        itemGenerator: makeHousePointHMTL,
        gridTemplateColsCSS: '1fr 1fr 1fr 60px 60px',
        filter: (item) => {
            return filters.years.includes(item['studentYear']) &&
                (filters.admin ? item['admin'] : true);
        }
    });

    reloadDOM();
}

/**
 *
 * @param {HP} hp
 * @param {boolean} admin show admin options
 * @returns {Promise<string>}
 */
async function makeHousePointHMTL (hp, admin) {
    const isMe = (hp.userID === (await core.userInfo())['id']);

    let acceptedHTML;
    let icon = '';

    if (hp['status'] === 'Rejected') {
        acceptedHTML = `
            Rejected ${core.getRelativeTime(hp['completed'] * 1000)}
            <br>
            <b>"${hp['rejectMessage']}"</b>
        `;
        icon = 'red-cross.svg';

    } else if (hp['status'] === 'Accepted') {
        acceptedHTML = `
            Accepted ${core.getRelativeTime(hp['completed'] * 1000)}
        `;
        icon = 'accent-tick.svg';

    } else {
        acceptedHTML = 'Not Yet Accepted';
        icon = 'pending.svg';
    }

    const submittedTime = hp['created'] * 1000;

    return `
        <div class=vertical-flex-center style="${isMe ? 'font-weight: bold' : ''}">
            <button onclick="userPopup('${hp.studentEmail}')">
                ${hp.studentEmail}
            </button>
        </div>
        <div class="vertical-flex-center">
            ${hp.eventName ? `
                <button
                    data-label="View Event"
                    onclick="eventPopup('${hp['eventID']}')"
                    aria-label="${hp['eventName']}"
                    svg="event.svg"
                    class="icon small evt-link"
                    style="--offset-x: 50px"
                >
                    <b>${hp['eventName']}</b>
                </button>
            ` : ''}
            ${hp.description}
            ${hp.quantity > 1 ? `
                (${hp['quantity']} points)
            ` : ''}
        </div>
        <div>
            ${new Date(submittedTime).toDateString()}
            (${core.getRelativeTime(submittedTime)})
            <br>
            ${acceptedHTML}
        </div>
        <div
            svg="${icon}"
            data-label="${hp.status}"
            class="icon icon-info-only"
        ></div>
        <div>
            ${admin ? `
                <button
                    onclick="deleteHousePoint('${hp['id']}')"
                    class="icon"
                    aria-label="delete"
                    data-label="Delete"
                    svg="bin.svg"
                ></button>
            ` : ''}
        </div>
    `;
}

// Filters
function toggleYearGroup (age) {
    if (filters.years.includes(age)) {
        filters.years.splice(filters.years.indexOf(age), 1);
    } else {
        filters.years.push(age);
    }
    showHousePointList();
}

async function deleteHousePoint (id, email) {
    if (!confirm(`Are you sure you want to delete ${email}'s house point?`)) {
        return;
    }

    await core.api`delete/house-points/with-id/${id}`;

    if (selected.includes(id)) {
        selected.splice(selected.indexOf(id), 1);
    }

    await showHousePointList();
}

async function deleteSelected () {
    if (!confirm(`Are you sure you want to delete ${selected.length} house points?`)) {
        return;
    }

    // send API requests at the same time and wait for all to finish
    await Promise.all(selected.map(async id => {
        await core.api`delete/house-points/with-id/${id}`;
    }));

    selected.splice(0, selected.length);

    await showHousePointList();
}