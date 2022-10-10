'use strict';
import { registerComponent } from '../dom.js';
import * as core from '../main.js';

/**
 * The popup showing 'allow' and 'reject' options for cookies
 */
export default registerComponent('CookieCard', $el => {
    /**
     * The user has either allowed or not allowed cookies
     * @param {boolean} value
     */
    window._CookiePopup__allowedCookies = async value => {
        core.hide($el);
        if (!value) {
            await core.setCookie(core.COOKIE_ALLOW_COOKIES_KEY, '', 1/24);
            return;
        }
        await core.setCookie(core.COOKIE_ALLOW_COOKIES_KEY, '1', 365);
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
			onclick="_CookiePopup__allowedCookies(true)"
			class="bordered"
			style="margin: 10px; padding: 10px"
		>
			Accept
		</button>
		<button 
			onclick="_CookiePopup__allowedCookies(false)"
			class="bordered"
			style="margin: 10px; padding: 10px"
		>
			Reject
		</button>
	`;
});
