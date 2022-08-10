import route from "../";
import { AUTH_ERR, generateUUID, getSessionID, isAdmin, isLoggedIn, userFromSession } from '../util';

/**
 * @account
 * Single route for getting house points with some filters
 *
 */
route('get/award-types', async ({ query, params, cookies }) => {
    if (!await isLoggedIn(cookies, query)) return AUTH_ERR;

});