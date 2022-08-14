import * as core from "./main.js";
import FullPagePopup from "./components/FullPagePopup.js";
import { inlineComponent } from "./main.js";
import EventCard from "./components/EventCard.js";
import UserCard from "./components/UserCard.js";

/**
 * Shows a popup with the event detail from the given event id.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function eventPopup (id) {
	FullPagePopup(document.body, inlineComponent(EventCard,
	async () => {
			const events = await core.api(`get/events`, {
				eventID: id
			});
			return events?.['data']?.[0];
		},
		(await core.userInfo())['admin']
	));
}

/**
 * Shows a popup with the user detail from the given event id.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function userPopupFromID (id) {
	FullPagePopup(document.body, inlineComponent(UserCard,
		async () => (await core.api(`get/users`, { userID: id })),
		(await core.userInfo())['admin'],
	));
}

/**
 * Shows a popup with the event detail from the given event id.
 * @param {string} email
 * @returns {Promise<void>}
 */
export async function userPopup (email) {
	FullPagePopup(document.body, inlineComponent(UserCard,
		async () => (await core.api(`get/users`, { email })),
		(await core.userInfo())['admin'],
	));
}