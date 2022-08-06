import { registerComponent } from "../components.js";
import * as core from "../main.js";

/**
 * @type Component
 * Component for student email input with dropdown for autocompletion of emails in the DB.
 *
 * @param placeholder placeholder text for the input field
 * @param allowNonStudents
 * @returns {HTMLElement}
 */
const studentEmailInputWithIntellisense = ($el, placeholder='Email', allowNonStudents=false) => {
	const [ id, $el ] = registerComponent($el);

	$el.innerHTML += `
                <span>
                    <span class="student-email-input-wrapper">
                        <input
                            type="text"
                            class="student-email-input"
                            placeholder="${placeholder}"
                            autocomplete="off"
                            aria-label="student email"
                            id="student-email-input-${id}"
                        >
                        <div
                            class="student-email-input-dropdown" 
                            id="student-email-input-dropdown-${id}"
                        ></div>
                    </span>
                </span>
            `;

	const $studentNameInput = document.getElementById(`student-email-input-${id}`);
	const $dropdown = document.getElementById(`student-email-input-dropdown-${id}`);

	window[`onClickStudentEmailInput${id}`] = (value) => {
		$studentNameInput.value = value;
	};

	addEventListener('click', evt => {
		if ($dropdown.contains(evt.target)) return;

		if ($dropdown.classList.contains('student-email-input-show-dropdown')) {
			$dropdown.classList.remove('student-email-input-show-dropdown');

		} else if (evt.target.id === `student-email-input-${id}`) {
			$dropdown.classList.add('student-email-input-show-dropdown');
		}
	});

	core.api `get/users` .then(({ data }) => {

		const studentNames = data
			.filter(user => user['student'] || allowNonStudents)
			.map(student => student['email']);

		$studentNameInput.addEventListener('input', async () => {
			const value = $studentNameInput.value;

			let users = studentNames.filter(name =>
				name.toLowerCase().includes(value.toLowerCase())
			);

			if (users.length === 0) {
				$dropdown.classList.remove('student-email-input-show-dropdown');
				return;
			}

			let extra = 0;
			if (users.length > 10) {
				extra = users.length - 10;
				users = users.slice(0, 10);
			}

			$dropdown.classList.add('student-email-input-show-dropdown');

			$dropdown.innerHTML = '';

			for (let name of users) {
				$dropdown.innerHTML += `
                            <p onclick="window['onClickStudentEmailInput${id}']('${name}')">
                                ${name} 
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
	});

	return $studentNameInput;
}

export default studentEmailInputWithIntellisense;