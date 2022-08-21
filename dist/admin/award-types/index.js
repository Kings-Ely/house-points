import * as core from '../../assets/js/main.js';

const $awardTypeRequired = document.querySelector('#award-type-required'),
    $awardTypeName = document.querySelector('#award-type-name'),
    $awardTypeDescription = document.querySelector('#award-type-description'),
    $awardTypeSubmit = document.querySelector('#award-type-submit'),
    $awardTypes = document.querySelector('#award-types');

window.awardTypeUpdateName = awardTypeUpdateName;
window.awardTypeUpdateDesc = awardTypeUpdateDesc;
window.awardTypeUpdateRequired = awardTypeUpdateRequired;
window.awardTypeDelete = awardTypeDelete;

(async () => {
    await core.init('../..', false, false, true);
    core.preloadSVGs('bin.svg');

    await refresh();
})();

async function refresh() {
    await awardTypeList();
}

async function awardTypeUpdateName(id, name) {
    await core.api(`update/award-types/name`, {
        awardTypeId: id,
        name
    });
    await refresh();
}

async function awardTypeUpdateDesc(awardTypeId, description) {
    await core.api(`update/award-types/description`, {
        awardTypeId,
        description
    });
    await refresh();
}

async function awardTypeUpdateRequired(id, value) {
    await core.api(`update/award-types/hps-required`, {
        awardTypeId: id,
        quantity: parseInt(value)
    });
    await refresh();
}

async function awardTypeDelete(awardTypeId) {
    if (!confirm('Are you sure you want to delete this award type?')) {
        return;
    }
    await core.api(`delete/award-types`, { awardTypeId });
    await refresh();
}

async function awardTypeList() {
    const { data } = await core.api(`get/award-types`);

    // No SelectableList as there are going to be so few it's not worth it
    $awardTypes.innerHTML = `
		<h2>Award Types</h2>
	`;

    for (let awardType of data) {
        $awardTypes.innerHTML += `
			<div class="item">
				<div>
					<label>
						<input
							value="${core.escapeHTML(awardType.name)}"
							onchange="awardTypeUpdateName('${awardType.id}', this.value)"
							class="editable-text"
						>
					</label>
				</div>
				<div>
					<label>
						<input
							value="${core.escapeHTML(awardType.hpsRequired)}"
							onchange="awardTypeUpdateRequired('${awardType.id}', this.value)"
							data-label="House Points Required"
							class="editable-text"
							type="number"
						>
					</label>
				</div>
				<div>
					<label>
						<input
							value="${core.escapeHTML(awardType.description)}"
							onchange="awardTypeUpdateDesc('${awardType.id}', this.value)"
							class="editable-text"
						>
					</label>
				</div>
				<div>
					<button
						onclick="awardTypeDelete('${awardType.id}')"
						data-label="delete"
						svg="bin.svg"
						class="icon medium"
						aria-label="delete"
					></button>
				</div>
			</div>
		`;
    }

    core.reloadDOM();
}

$awardTypeSubmit.addEventListener('click', async () => {
    const name = $awardTypeName.value,
        description = $awardTypeDescription.value,
        required = parseInt($awardTypeRequired.value);

    if (name.length < 3) {
        await core.showError('Name must be at least 3 characters long');
        return;
    }

    if (required < 0) {
        await core.showError('Required must be 0 or greater');
        return;
    }

    await core.api(`create/award-types`, {
        name,
        description,
        required
    });

    $awardTypeName.value = '';
    $awardTypeDescription.value = '';
    $awardTypeRequired.value = 0;

    await refresh();
});
