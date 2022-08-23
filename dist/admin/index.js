import * as core from '../assets/js/main.js';

// gets replaced with input element once loaded
window.userPopupFromId = core.userPopupFromId;

(async () => {
    await core.init('..', true, true);

    core.reservoir.set('main', main);
    await main();
})();

async function main() {
    
    core.api(`get/users/wants-award`)
        .then(({ data }) => {
            core.reservoir.set('usersWaitingForAward', data, true)
        });
    
    core.api(`get/house-points`, {
        status: 'Pending'
    })
        .then(({ data }) => {
            core.reservoir.set('pending', data, true)
        });
}
