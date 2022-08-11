import * as core from "../../assets/js/main.js";
import { preloadSVGs, reloadDOM, showError } from "../../assets/js/main.js";

const
	$awardTypeRequired = document.querySelector('#award-type-required'),
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
	preloadSVGs('bin.svg');

	await refresh();
})();

async function refresh () {
	await awardTypeList();
}

async function awardTypeUpdateName (id, name) {
	await core.api`update/award-types/name/${id}/${name}`;
	await refresh();
}

async function awardTypeUpdateDesc (id, name) {
	await core.api`update/award-types/description/${id}/${name}`;
	await refresh();
}

async function awardTypeUpdateRequired (id, value) {
	await core.api`update/award-types/hps-required/${id}/${value}`;
	await refresh();
}

async function awardTypeDelete (id) {
	if (!confirm('Are you sure you want to delete this award type?')) {
		return;
	}
	await core.api`delete/award-types/with-id/${id}`;
	await refresh();
}

async function awardTypeList () {
	const { data } = await core.api`get/award-types`;

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
							value="${awardType.name}"
							onchange="awardTypeUpdateName('${awardType.id}', this.value)"
						>
					</label>
				</div>
				<div>
					<label>
						<input
							value="${awardType.hpsRequired}"
							onchange="awardTypeUpdateRequired('${awardType.id}', this.value)"
							data-label="House Points Required"
						>
					</label>
				</div>
				<div>
					<label>
						<input
							value="${awardType.description}"
							onchange="awardTypeUpdateDesc('${awardType.id}', this.value)"
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

	reloadDOM();
}

$awardTypeSubmit.addEventListener('click', async () => {
	const
		name = $awardTypeName.value,
		description = $awardTypeDescription.value,
		required = $awardTypeRequired.value;

	if (name.length < 3) {
		await showError('Name must be at least 3 characters long');
		return;
	}

	if (required < 0) {
		await showError('Required must be 0 or greater');
		return;
	}

	await core.api`create/award-types/${name}/${required}?description=${description}`;


	$awardTypeName.value = '';
	$awardTypeDescription.value = '';
	$awardTypeRequired.value = 0;

	await refresh();
});