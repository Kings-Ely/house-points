import route from "../";
import { AUTH_ERR, isAdmin, isLoggedIn } from "../util";
import now from "performance-now";

/**
 * Hello World route
 * Mainly for debugging, should remove at some point
 * TODO: remove
 */
route('', async ()  => {
    return { 'message': 'Hello World' };
});

/**
 * Simply returns an {ok: true} message
 */
route('get/server/ping', async () => {});

/**
 * @admin
 * Get the process ID of the Node process running this server
 */
route('get/server/pid', async ({ cookies, query }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    return { pid: process.pid };
});

/**
 * @account
 * Runs a basic SQL query and returns an error if the query fails
 */
route('get/server/check', async ({ query, cookies }) => {
    if (!await isLoggedIn(cookies, query)) return AUTH_ERR;

    if ((await query`SELECT * FROM users LIMIT 1`).length !== 1) {
        return 'Something went wrong';
    }
});

/**
 * @account
 * Echos the 'msg' parameter of the query
 */
route('get/server/echo/:msg', async ({ params, cookies, query }) => {
    if (!await isLoggedIn(cookies, query)) return AUTH_ERR;

    return { msg: params['msg'] };
});

/**
 * @account
 * Measures the performance of running 'n' simple SQL queries and returns some stats on the timing data
 */
route('get/server/performance?iterations=100', async ({ query, params: { iterations}, cookies }) => {
    if (!await isLoggedIn(cookies, query)) return AUTH_ERR;

    const start = now();

    const n = parseInt(iterations);
    if (!n) return 'Invalid iterations';
    // easy way to DOS server with big numbers...
    if (n > 1000) return 'Iterations too big';
    if (n < 1) return 'Iterations too small';

    for (let i = 0; i < n; i++) {
        await query`SELECT * FROM users LIMIT 1`;
    }

    const time = now() - start;

    return {
        time: time,
        iterations: n,
        avPerIteration: time / n
    };
});

/**
 * @admin
 * Kills this process
 * Note that this doesn't immediately kill the process, just sends a kill signal
 * This allows the server to close any connections and shutdown gracefully
 */
route('delete/server', async ({ query, cookies}) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    process.kill(process.pid, 'SIGTERM');
});
