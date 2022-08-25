'use strict';
import { registerComponent } from '../dom.js';
import * as core from '../main.js';

/**
 * @param {El} $el
 * @param {User} user
 * @returns {HTMLElement} the HTMLInputElement
 */
export default registerComponent('Email', ($el, id, user, { fontsize = 'inherit' } = {}) => {
    if (!user) return;

    window[`_Email${id}__onclick`] = async () => {
        await core.userPopup(user.email);
    };
    
    const email = user.email ?? user.userEmail;
    const year = user.year ?? user.userYear;

    $el.innerHTML = `
        <button
            data-label="View ${core.escapeHTML(email)}"
            onclick="_Email${id}__onclick()"
            style="font-size: ${fontsize}"
        >
            ${core.escapeHTML(email.split('@')[0])}
            (${year ? `Y${core.escapeHTML(year)}` : 'Admin'})
        </button>
    `;
});
