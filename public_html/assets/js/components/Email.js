'use strict';
import * as core from '../main.js';

/**
 * User email.
 * Shows first part of email (before '@') and the users year in brackets next to it.
 * On hover, shows the full email.
 * On click, shows a user popup card.
 * @param {El} $el
 * @param {User} user
 * @returns {HTMLElement} the HTMLInputElement
 */
window.hydrate.Component('user-email', ({
    $el, id, user, align = 'center', fontsize = 'inherit'
}) => {
    if (!user) return;

    const email = user.email ?? user.userEmail;
    const year = user.year ?? user.userYear;

    if (!email || typeof email !== 'string') {
        console.error('Trying to show invalid user (email): ', user);
        return;
    }

    if (year !== 0 && (year > 13 || year < 9)) {
        console.error('Trying to show invalid user (year): ', user);
        return;
    }

    window[`_Email${id}__onclick`] = async () => {
        await core.userPopup(email);
    };

    $el.innerHTML = `
        <button
            data-label="View ${core.escapeHTML(email)}"
            onclick="_Email${id}__onclick()"
            style="font-size: ${fontsize}; text-align: ${align};"
        >
            ${core.escapeHTML(email.split('@')[0])}
            (${year > 0 ? `Y${core.escapeHTML(year)}` : 'Admin'})
        </button>
    `;
});
