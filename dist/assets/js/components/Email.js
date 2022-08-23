'use strict';
import { registerComponent } from "../dom.js";
import * as core from '../main.js';

/**
 * @param {El} $el
 * @param {User} user
 * @returns {HTMLElement} the HTMLInputElement
 */
export default registerComponent('Email', ($el, id, user) => {
    
    if (!user) return;
    
    window[`_Email${id}__onclick`] = async () => {
        await core.userPopup(user.email);
    };
    
    $el.innerHTML = `
        <button
            data-label="View User"
            onclick="_Email${id}__onclick()"
        >
            ${core.escapeHTML(user.email.split('@')[0])}
            <span style="font-size: 0.8em; color: var(--text-v-light)">
                @${user.email.split('@')[1]}
            </span>
            (Y${core.escapeHTML(user.year)})
        </button>
    `;
});
