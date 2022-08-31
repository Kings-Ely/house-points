/** @typedef {HTMLElement|string} El */

/**
 *  @typedef {($el: El, ...args: *) => *} Component
 */

/**
 *  @typedef {($el: El, id: number, ...args: *) => *} ComponentDefinition
 */

/**
 * @typedef {{}} Award
 */

/** @typedef {{
 * 		id?: string,
 * 		email: string,
 * 		year: number,
 * 		accepted: number,
 * 		rejected: number,
 * 		pending: number,
 * 		housePoints: HP[],
 * 	    awards: Award[],
 * 	    student: boolean,
 * 	    admin: boolean,
 * }} User
 */

/** @typedef {{
 *     id: string,
 *     quantity: number,
 *     description: string,
 *     status: string,
 *     created: number,
 *     completed: number,
 *     rejectMessage: string,
 *     userId: string,
 *     userEmail: string,
 *     userYear: number,
 *     eventId: string,
 *     eventName: string,
 *     eventDescription: string,
 *     eventTime: number
 * }} HP
 */

/** @typedef {{
 * 		id: string,
 * 		time: number,
 * 		name: string,
 * 		description: string,
 * 		userEmail: string
 * }} Event
 */
