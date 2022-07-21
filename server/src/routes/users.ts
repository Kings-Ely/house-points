import route from "../";
import { AUTH_ERR, authLvl, idFromCodeOrID, makeCode, requireAuth } from "../util";
import log from "../log";


route('get/users/auth/:code', async ({ query, params: { code} }) => {
    if (!code) return 'No code';

    return {
        level: await authLvl(code, query)
    };
});


route('get/users/info/:code', async ({ query, params: { code} }) => {
    if (!code) return 'No code';

    const data = await query`SELECT admin, student, name, year FROM users WHERE code = ${code.toLowerCase()}`;

    if (!data.length) return 'User not found';

    return data[0];
});


route('get/users/all', async ({ query, cookies }) => {
    if (!await requireAuth(cookies, query)) return AUTH_ERR;

    return {
        data: await query`SELECT admin, student, name, year FROM users`
    };
});


route('create/users/:name?year=9', async ({ query, params, cookies }) => {
    if (!await requireAuth(cookies, query)) return AUTH_ERR;

    const { name, year: yearStr} = params;

    const year = parseInt(yearStr);

    if (isNaN(year)) return `Year '${year}' is not a number`;
    if (name.length < 2) return `Name '${name}' too short`;

    // get unique code
    let newCode = makeCode(6);
    while ((await query`SELECT * FROM users WHERE code = ${newCode}`).length) {
        newCode = makeCode(6);
    }

    const admin = year === 0 ? 1 : 0;
    const student = year === 0 ? 0 : 1;

    await query`
        INSERT INTO users (name, code, year, admin, student)
        VALUES (${name}, ${newCode}, ${year}, ${admin}, ${student})
    `;

    return { code: newCode };
});


route('update/users/admin?id&code&admin', async ({ query, params, cookies }) => {
    if (!await requireAuth(cookies, query)) return AUTH_ERR;

    const { id: userID, code, admin } = params;

    let id = await idFromCodeOrID(query, userID, code);
    if (typeof id === 'string') return id;

    let checkMyselfRes = await query`SELECT admin, id FROM users WHERE code = ${cookies['code']}`;
    const self = checkMyselfRes[0];

    if (self['id'] == id) {
        return 'You cannot change your own admin status';
    }

    await query`UPDATE users SET admin = ${admin === '1'} WHERE id = ${id}`;
});


route('update/users/year?id&code&yearChange', async ({ query, params, cookies }) => {
    if (!await requireAuth(cookies, query)) return AUTH_ERR;

    const { id: userID, code, yearChange: yC } = params;
    const yearChange = parseInt(yC);

    if (isNaN(yearChange)) return `Year change '${yearChange}' is not a number`;

    let id = await idFromCodeOrID(query, userID, code);
    if (typeof id === 'string') return id;

    await query`UPDATE users SET year = year + ${yearChange} WHERE id = ${id}`;
});


route('delete/users/:code', async ({ query, params: { code}, cookies }) => {
    if (!await requireAuth(cookies, query)) return AUTH_ERR;

    const usersWithCode = await query`SELECT * FROM users WHERE code = ${code}`;

    if (usersWithCode.length !== 1) {
        return `No user with code '${code}'`;
    }

    await query`DELETE FROM users WHERE code = ${code}`;
});
