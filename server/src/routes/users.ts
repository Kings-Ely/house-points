import route from "../";
import {AUTH_ERR, authLvl, COOKIE_CODE_KEY, idFromCodeOrID, makeCode, requireAdmin, requireLoggedIn} from "../util";


route('get/users/auth/:code', async ({ query, params: { code} }) => {
    if (!code) return 'No code';

    return {
        level: await authLvl(code, query)
    };
});


route('get/users/info/:code', async ({ query, params: { code} }) => {
    if (!code) return 'No code';

    const data = await query`SELECT admin, student, name, year FROM users WHERE code = ${code.toLowerCase()}`;

    if (!data.length) return {
        status: 406,
        error: 'User not found'
    };

    return data[0];
});


route('get/users/all', async ({ query, cookies }) => {
    if (!await requireAdmin(cookies, query)) return AUTH_ERR;

    return {
        data: await query`
            SELECT 
                users.id, 
                users.name, 
                users.year, 
                users.code, 
                users.admin, 
                users.student,
                SUM(CASE WHEN housepoints.status='Pending' THEN housepoints.quantity ELSE 0 END) AS pending,
                SUM(CASE WHEN housepoints.status='Accepted' THEN housepoints.quantity ELSE 0 END) AS accepted,
                SUM(CASE WHEN housepoints.status='Rejected' THEN housepoints.quantity ELSE 0 END) AS rejected
            FROM users LEFT JOIN housepoints
            ON housepoints.student = users.id
            GROUP BY users.id, users.name, users.year, users.code, users.admin, users.student
            ORDER BY users.student, users.admin DESC, year, name;
        `
    };
});

route('get/users/leaderboard', async ({ query, cookies }) => {
    if (!await requireLoggedIn(cookies, query)) return AUTH_ERR;

    return {
        data: await query`
            SELECT 
                users.name, 
                users.year,
                SUM(
                    CASE 
                        WHEN housepoints.status='Accepted' 
                            THEN housepoints.quantity 
                        ELSE 0
                    END
                ) AS housepoints
            FROM users 
                LEFT JOIN housepoints
                ON housepoints.student = users.id
            WHERE users.student = true
            GROUP BY users.name, users.year
            ORDER BY housepoints DESC, year DESC, name;
        `
    };
});


route('create/users/:name?year=9', async ({ query, params, cookies }) => {
    if (!await requireAdmin(cookies, query)) return AUTH_ERR;

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
    if (!await requireAdmin(cookies, query)) return AUTH_ERR;

    const { id: userID, code, admin } = params;

    let id = await idFromCodeOrID(query, userID, code);
    if (typeof id === 'string') return id;

    const myCode = cookies[COOKIE_CODE_KEY];
    if (!myCode) return 'No code';

    // can't change own admin status
    let checkMyselfRes = await query`SELECT admin, id FROM users WHERE code = ${myCode}`;
    const self = checkMyselfRes[0];
    if (!self) return AUTH_ERR;

    if (self['id'] == id) {
        return {
            status: 403,
            error: 'You cannot change your own admin status'
        };
    }

    await query`UPDATE users SET admin = ${admin === '1'} WHERE id = ${id}`;
});


route('update/users/year?id&code&yearChange', async ({ query, params, cookies }) => {
    if (!await requireAdmin(cookies, query)) return AUTH_ERR;

    const { id: userID, code, yearChange: yC } = params;
    const yearChange = parseInt(yC);

    if (isNaN(yearChange)) {
        return `Year change '${yearChange}' is not a number`;
    }

    let id = await idFromCodeOrID(query, userID, code);
    if (typeof id === 'string') return id;

    await query`UPDATE users SET year = year + ${yearChange} WHERE id = ${id}`;
});


route('delete/users/:code', async ({ query, params: { code}, cookies }) => {
    if (!await requireAdmin(cookies, query)) return AUTH_ERR;

    const usersWithCode = await query`SELECT * FROM users WHERE code = ${code}`;

    if (usersWithCode.length !== 1) {
        return `No user with code '${code}'`;
    }

    await query`DELETE FROM users WHERE code = ${code}`;
});
