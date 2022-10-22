import * as core from '../../assets/js/main.js';

(async () => {
    await core.init('../..', true, false);
    core.preloadSVGs('bin.svg');
    
    window.hydrate.set({
        awardTypes: [],
        awardTypeUpdateName,
        awardTypeUpdateDesc,
        awardTypeUpdateRequired,
        awardTypeDelete,
        newAwardType,
        awardUpdateDesc,
        updateAwardTypeIcon
    });
    
    refreshAwardTypes().then();
    refreshAwards().then();
})();

async function refreshAwardTypes() {
    await core.api(`get/award-types`)
        .then(({ data }) => {
            window.hydrate.set('awardTypes', data);
        });
}

async function updateAwardTypeIcon (awardTypeId) {
    const icon = prompt('Copy and Paste the SVG contents here:');
    if (icon === null) return;
    await core.api('update/award-types/icon', {
        awardTypeId,
        icon
    })
}

async function awardTypeUpdateName(id, name) {
    await core.api(`update/award-types/name`, {
        awardTypeId: id,
        name
    });
    await refreshAwardTypes();
}

async function awardTypeUpdateDesc(awardTypeId, description) {
    await core.api(`update/award-types/description`, {
        awardTypeId,
        description
    });
    await refreshAwardTypes();
}

async function awardTypeUpdateRequired(id, value) {
    await core.api(`update/award-types/hps-required`, {
        awardTypeId: id,
        quantity: parseInt(value)
    });
    await refreshAwardTypes();
}

async function awardTypeDelete(awardTypeId) {
    if (!confirm('Are you sure you want to delete this award type?')) {
        return;
    }
    await core.api(`delete/award-types`, { awardTypeId });
    await refreshAwardTypes();
}


async function newAwardType () {
    await core.api(`create/award-types`, {
        name: 'New Award Type',
        required: 10
    });
    await refreshAwardTypes();
}

async function refreshAwards() {
    await core.api(`get/awards`)
        .then(({ data }) => {
            window.hydrate.set('awards', data);
        });
}

async function awardUpdateDesc (awardId, description) {
    await core.api('update/awards/description', {
        awardId, description
    });
    await refreshAwards();
}