import * as core from '../assets/js/main.js';

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
})();

// Filters
function toggleYearGroup(age) {
    if (filters.years.includes(age)) {
        filters.years.splice(filters.years.indexOf(age), 1);
    } else {
        filters.years.push(age);
    }
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
