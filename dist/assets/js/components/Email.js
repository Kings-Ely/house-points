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

    $el.innerHTML = `
        <button
            data-label="View ${user.email.replace('"','\\"')}"
            onclick="_Email${id}__onclick()"
            style="font-size: ${fontsize}"
        >
            ${core.escapeHTML(user.email.split('@')[0])}
            (${user.year ? `Y${core.escapeHTML(user.year)}` : 'Admin'})
        </button>
    `;
});
