import { route } from "../index";

route('ping', async ({ query }) => {
    const res = await query`SELECT * FROM users LIMIT 1`;
    return {
        ok: res.length === 1,
    };
});

route('echo/:msg', async ({ params }) => params);
