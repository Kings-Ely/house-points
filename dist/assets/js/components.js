let currentComponentID = 0;

/**
 *
 * @param {HTMLElement} element
 * @returns {{[key: string]: (...args: any[]) => any}}
 */
function insertComponent (element) {
    return {
        studentEmailInputWithIntellisense: () => {
            const id = currentComponentID++;
            element.innerHTML += `
                <span>
                    <span class="student-email-input-wrapper">
                        <input
                            type="text"
                            class="student-email-input"
                            placeholder="Email"
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

            window.addEventListener('click', () => {
                $dropdown.classList.remove('student-email-input-show-dropdown');
            });

            api`get/users/all`.then(({ data }) => {

                const studentNames = data.map(student => student['email']);

                $studentNameInput.addEventListener('input', async () => {
                    const value = $studentNameInput.value;

                    if (!value) {
                        $dropdown.classList.remove('student-email-input-show-dropdown');
                        return;
                    }

                    const users = studentNames.filter(name =>
                        name.toLowerCase().includes(value.toLowerCase())
                    );

                    if (users.length === 0) {
                        $dropdown.classList.remove('student-email-input-show-dropdown');
                        return;
                    }

                    $dropdown.classList.add('student-email-input-show-dropdown');

                    $dropdown.innerHTML = '';

                    for (let name of users) {
                        $dropdown.innerHTML += `
                            <div onclick="window['onClickStudentEmailInput${id}']('${name}')">
                                ${name} 
                            </div>
                        `;
                    }
                });
            });

            return $studentNameInput;
        }
    }
}
