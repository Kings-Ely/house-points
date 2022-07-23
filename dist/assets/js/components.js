let currentComponentID = 0;

/**
 *
 * @param {HTMLElement} element
 * @returns {{[key: string]: (...args: any[]) => any}}
 */
function insertComponent (element) {
    return {
        studentNameInputWithIntellisense: (width='200px') => {
            const id = currentComponentID++;
            element.innerHTML += `
                <span>
                    <span class="student-name-input-wrapper">
                        <input
                            type="text"
                            class="student-name-input"
                            placeholder="Name"
                            aria-label="student name"
                            id="student-name-input-${id}"
                            style="width: ${width}"
                        >
                        <div
                            class="student-name-input-dropdown" 
                            id="student-name-input-dropdown-${id}"
                        ></div>
                    </span>
                </span>
            `;

            const $studentNameInput = document.getElementById(`student-name-input-${id}`);
            const $dropdown = document.getElementById(`student-name-input-dropdown-${id}`);

            window[`onClickStudentNamInput${id}`] = (value) => {
                $studentNameInput.value = value;
            };

            window.addEventListener('click', () => {
                $dropdown.classList.remove('student-name-input-show-dropdown');
            });

            api`get/users/all`.then(({ data }) => {

                const studentNames = data.map(student => student['name']);

                $studentNameInput.addEventListener('input', async () => {
                    const value = $studentNameInput.value;

                    if (!value) {
                        $dropdown.classList.remove('student-name-input-show-dropdown');
                        return;
                    }

                    const users = studentNames.filter(name =>
                        name.toLowerCase().includes(value.toLowerCase())
                    );

                    if (users.length === 0) {
                        $dropdown.classList.remove('student-name-input-show-dropdown');
                        return;
                    }

                    $dropdown.classList.add('student-name-input-show-dropdown');

                    $dropdown.innerHTML = '';

                    for (let name of users) {
                        $dropdown.innerHTML += `
                            <div onclick="window['onClickStudentNamInput${id}']('${name}')">
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
