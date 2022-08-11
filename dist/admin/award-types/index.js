import * as core from "../../assets/js/main.js";
import SelectableList from "../../assets/js/components/SelectableList.js";
import { showError } from "../../assets/js/main.js";

const
	$awardTypeRequired = document.querySelector('#award-type-required'),
	$awardTypeName = document.querySelector('#award-type-name'),
	$awardTypeDescription = document.querySelector('#award-type-description'),
	$awardTypeSubmit = document.querySelector('#award-type-submit');


const selected = [];

(async () => {
	await core.init('../..', false, false, true);

	await refresh();
})();

async function refresh () {
	await awardTypeList();
}

async function awardTypeList () {
	const { data: awardTypes } = await core.api`get/award-types`;

	SelectableList('#award-types', {
		name: 'Award Types',
		items: awardTypes,
		uniqueKey: 'id',
		searchKey: 'name',
		itemGenerator: (awardType) => {
			return `
				<p>${awardType.name}</p>
				<p>${core.limitStrLength(awardType.description)}</p>
			`;
		},
		selected
	});
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