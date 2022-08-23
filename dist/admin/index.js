import * as core from '../assets/js/main.js';
import HousePoint from '../assets/js/components/HousePoint.js';

const $pendingHPs = document.getElementById('pending');
const $numPendingHPs = document.getElementById('num-pending');
// gets replaced with input element once loaded
window.userPopupFromId = core.userPopupFromId;

(async () => {
    await core.init('..', true, true);

    await main();
})();

async function main() {
    
    core.api(`get/users/wants-award`)
        .then(({ data }) => core.reservoir.set('usersWaitingForAward', data));
    
    const { data: pending } = await core.api(`get/house-points`, {
        status: 'Pending'
    });
    const admin = await core.isAdmin();

    $numPendingHPs.innerText = pending.length;

    // clear after async request
    $pendingHPs.innerHTML = '';

    let i = 0;
    for (let hp of pending) {
        $pendingHPs.innerHTML += core.inlineComponent(HousePoint, hp, main, {
            admin,
            showBorderBottom: hp !== pending[pending.length - 1],
            showEmail: true,
            showReason: true,
            showNumPoints: true,
            showDate: true,
            showRelativeTime: true,
            showStatusHint: false,
            showStatusIcon: false,
            showDeleteButton: false,
            showPendingOptions: true,
            reasonEditable: false,
            pointsEditable: true,
            dateEditable: false
        });

        if (i === 4) {
            $pendingHPs.innerHTML += `
                <div style="text-align: center; padding: 20px">
                    And ${pending.length - 5} more...
                </div>
            `;
            break;
        }
        i++;
    }

    if (i === 0) {
        $pendingHPs.innerHTML = `
            <p style="text-align: center">
                No Pending House Points!
            </p>
        `;
    }

    core.reloadDOM();
}
