import { route } from "../index";

route('users/get/auth/:code', async ({ query, params: { code} }) => {

    if (!code) return { level: 0 };

    const level = await query`SELECT admin FROM users WHERE code = ${code.toLowerCase()}`;

    if (!level.length) return { level: 0 };

    const auth = level[0]['admin'] === 1;

    return {
        level: auth ? 2 : 1
    };
});
