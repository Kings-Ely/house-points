import route from "../";

route('check', async ({ query }) => {
    if ((await query`SELECT * FROM users LIMIT 1`).length !== 1) {
        return { error: 'Something went wrong' };
    }
});

route('ping', async () => void 0);

route('echo/:msg', async ({ params }) => params);
