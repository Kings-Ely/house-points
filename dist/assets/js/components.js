/**
 * @type {{[k: string]: (...args: any[]) => string}}
 */
const components = {
    studentNameInputWithIntellisense : () => {
        return `
            <input
                type="text"
                class="student-name-input"
                placeholder="Name"
                aria-label="student name"
                
            >
        `;
    }
}
