import * as core from '../assets/js/main.js';

// gets replaced with input element once loaded
window.userPopupFromId = core.userPopupFromId;

(async () => {
    await core.init('..', true, true);

    window.hydrate.set({
        'main': main,
        'giveAward': giveAward,
        'showCountUsersWaitingForAward': 5,
    });
    
    await main();
})();

async function main() {
    
    core.api(`get/users/wants-award`)
        .then(({ data }) => {
            window.hydrate.set('usersWaitingForAward', data, true);
        });
    
    core.api(`get/house-points`, {
        status: 'Pending'
    })
        .then(({ data }) => {
            window.hydrate.set('pending', data, true);
        });
}

async function giveAward (userId, awardTypeId) {
    const description = prompt('Add an optional note to the award');
    if (description === null) return;
    
    await core.api(`create/awards`, {
        userId, awardTypeId, description
    });
    await main();
}