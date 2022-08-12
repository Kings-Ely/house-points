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
	if (!(await core.api`get/events?id=${id}`)?.['data']?.[0]) {
		console.error(`Event not found: ${id}`);
		await core.showError('Event not found with that ID');
		return;
	}

	FullPagePopup(document.body, inlineComponent(EventCard,
		async () => ((await core.api`get/events?id=${id}`)?.['data']?.[0]),
		(await core.userInfo())['admin'],
	));
}

/**
 * Shows a popup with the user detail from the given event id.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function userPopupFromID (id) {
	if (!(await core.rawAPI`get/users/from-id${id}`).ok) {
		console.error(`User not found: ${id}`);
		await core.showError('User not found with that ID');
		return;
	}

	FullPagePopup(document.body, inlineComponent(EventCard,
		async () => ((await core.api`get/events?id=${id}`)?.['data']?.[0]),
		(await core.userInfo())['admin'],
	));
}

/**
 * Shows a popup with the event detail from the given event id.
 * @param {string} email
 * @returns {Promise<void>}
 */
export async function userPopup (email) {
	const user = await core.api`get/users/from-email/${email}`;

	if (!user.ok) {
		await core.showError('User not found');
		return;
	}

	FullPagePopup(document.body, inlineComponent(UserCard,
		async () => (await core.api`get/users/from-email/${email}`),
		(await core.userInfo())['admin'],
	));
}