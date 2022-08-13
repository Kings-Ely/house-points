import route from "../";
import { AUTH_ERR, isLoggedIn } from '../util';

/**
 * @account
 * Single route for getting house points with some filters
 */
route('get/awards', async ({ query, body }) => {
    if (!await isLoggedIn(body, query)) return AUTH_ERR;


});