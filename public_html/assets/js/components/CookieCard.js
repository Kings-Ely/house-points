'use strict';
import * as core from '../main.js';

/**
 * The popup showing 'allow' and 'reject' options for cookies
 */
window.hydrate.Component('cookie-card', ({ $el }) => {
    /**
     * The user has either allowed or not allowed cookies
     * @param {boolean} value
     */
    async function allowedCookies (value) {
        core.hide($el);
        if (!value) {
            await core.setCookie(core.COOKIE_ALLOW_COOKIES_KEY, '', 1/24);
            return;
        }
        await core.setCookie(core.COOKIE_ALLOW_COOKIES_KEY, '1', 365);
    }

    return window.hydrate.html`
		<h2>Cookies</h2>
		<p>
			We and selected third parties use cookies or similar technologies for
			technical purposes and, with your consent, for other purposes.
			Denying consent may make related features unavailable.
			You can freely give, deny, or withdraw your consent at any time.
			You can consent to the use of such technologies by using the “Accept” button.
		</p>

		<button 
			onclick="${allowedCookies}(true)"
			class="bordered"
			style="margin: 10px; padding: 10px"
		>
			Accept
		</button>
		<button 
			onclick="${allowedCookies}(false)"
			class="bordered"
			style="margin: 10px; padding: 10px"
		>
			Reject
		</button>
	`;
});
