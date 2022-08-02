import route from "../";
import { AUTH_ERR, isAdmin } from "../util";
import now from "performance-now";

route('', async ()  => {
    return { 'message': 'Hello World' };
});

route('get/server/pid', async ({ cookies, query }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    return { pid: process.pid };
});


route('get/server/check', async ({ query, cookies }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    if ((await query`SELECT * FROM users LIMIT 1`).length !== 1) {
        return 'Something went wrong';
    }
});


route('get/server/ping', async () => void 0);


route('get/server/echo/:msg', async ({ params }) => params);


route('get/server/performance?iterations=100', async ({ query, params: { iterations} }) => {
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


route('delete/server', async ({ query, cookies}) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    process.kill(process.pid, 'SIGTERM');
});
