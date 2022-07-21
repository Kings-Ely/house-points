import route from "../";

route('check', async ({ query }) => {
    return {
        // run a little test to check that everything is actually working fine
        ok: (await query`SELECT * FROM users LIMIT 1`).length === 1,
    };
});

route('ping', async () => ({ ok: 1 }));

route('echo/:msg', async ({ params }) => params);
