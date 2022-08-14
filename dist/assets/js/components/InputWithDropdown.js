'use strict';
import { registerComponent } from "./components.js";
import { escapeHTML } from "../main.js";

/**
 * Component for student email input with dropdown for autocompletion of emails in the DB.
 *
 * @template T
 * @param {El} $el
 * @param {() => Promise<T[]>} getData
 * @param {(item: T, inputValue: string) => boolean} filter
 */
const InputWithDropdown = registerComponent((
	$el,
	id,
	placeholder,
	getData,
	filter,
	maxDropdownItems=10
) => {

	let data;

	getData().then(d => data = d);

	$el.innerHTML += `
		<span>
			<span class="dropdowninp-wrapper">
				<input
					type="text"
					class="dropdowninp-input"
					placeholder="${escapeHTML(placeholder)}"
					autocomplete="off"
					aria-label="student email"
					id="dropdowninp${id}-input"
				>
				<div
					class="dropdowninp-dropdown" 
					id="dropdowninp${id}-dropdown"
				></div>
			</span>
		</span>
	`;

	const $input = document.getElementById(`dropdowninp${id}-input`);
	const $dropdown = document.getElementById(`dropdowninp${id}-dropdown`);

	window[`_InputWithDropdown${id}__setValue`] = (value) => {
		$input.value = value;
	};

	addEventListener('click', evt => {
		if ($dropdown.contains(evt.target)) return;

		if ($dropdown.classList.contains('dropdowninp-show-dropdown')) {
			$dropdown.classList.remove('dropdowninp-show-dropdown');

		} else if (evt.target.id === `dropdowninp${id}-input`) {
			$dropdown.classList.add('dropdowninp-show-dropdown');
		}
	});


	$input.addEventListener('input', async () => {

		let items = data.filter(item => filter(item, $input.value));

		if (items.length === 0) {
			$dropdown.classList.remove('student-email-input-show-dropdown');
			return;
		}

		let extra = false;
		if (items.length > maxDropdownItems) {
			extra = (items.length - maxDropdownItems) > 0;
			items = items.slice(0, maxDropdownItems);
		}

		$dropdown.classList.add('student-email-input-show-dropdown');

		$dropdown.innerHTML = '';

		for (let row of items) {
			$dropdown.innerHTML += `
			<p 
				onclick="window['_InputWithDropdown${id}__setValue']('${row}')"
				class="item"
			>
				${row} 
			</p>
		`;
		}

		if (extra) {
			$dropdown.innerHTML += `
			<p class="no-hover">
				(and ${extra} more)
			</p>
		`;
		}
	});

	return $input;
});

export default InputWithDropdown;