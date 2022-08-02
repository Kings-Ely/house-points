let currentComponentID = 0;

/**
 *
 * @param {HTMLElement|string} $el
 * @returns {{[key: string]: (...args: any[]) => any}}
 */
function insertComponent ($el) {
    if (typeof $el === 'string') {
        $el = document.querySelector($el);
    }
    return {
        studentEmailInputWithIntellisense: () => {
            const id = currentComponentID++;
            $el.innerHTML += `
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

            api`get/users/all`.then(({data}) => {

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
        },

        cookiePopUp: () => {

            /**
             * The user has either allowed or not allowed cookies
             * @param {boolean} value
             */
            window.allowedCookies = async value => {
                hide($el);
                if (!value) {
                    return;
                }
                await setCookie(COOKIE_ALLOW_COOKIES_KEY, value.toString(), 365);
            };

            $el.innerHTML += `
                <h2>Cookies</h2>
                <p>
                    We and selected third parties use cookies or similar technologies for
                    technical purposes and, with your consent, for other purposes.
                    Denying consent may make related features unavailable.
                    You can freely give, deny, or withdraw your consent at any time.
                    You can consent to the use of such technologies by using the “Accept” button.
                </p>
        
                <button 
                    onclick="allowedCookies(1)"
                    class="big-link"
                >
                    Accept
                </button>
                <button 
                    onclick="allowedCookies(0)"
                    class="big-link"
                >
                    Reject
                </button>
            `;
        },

        fullPagePopUp: (content) => {
            if (document.getElementById('full-page-popup')) {
                // remove any current popups
                const $p = document.getElementById('full-page-popup');
                $p.parentElement.removeChild($p);
            }
            $el.innerHTML += `
                <div id="full-page-popup">
                    <div id="full-page-popup-content">
                        ${content}
                    </div>
                </div>
            `;
            const $fullPagePopup = document.querySelector('#full-page-popup');
            $fullPagePopup.addEventListener('click', () => {
                hide($fullPagePopup);
            });
        }
    };
}