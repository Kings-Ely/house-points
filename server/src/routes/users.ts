import route from '../';
import log from '../log';
import {AUTH_ERR, authLvl, COOKIE_CODE_KEY, idFromCode, makeCode, requireAdmin, requireLoggedIn} from '../util';


route('get/users/auth/:code', async ({ query, params: { code} }) => {
    if (!code) return 'No code';

    return {
        level: await authLvl(code, query)
    };
});


route('get/users/code-from-name/:name', async ({ query, params: { name}, cookies }) => {
    if (!await requireAdmin(cookies, query)) return AUTH_ERR;

    if (!name) return 'No code';

    const data = await query`
        SELECT code
        FROM users
        WHERE name = ${name}
    `;

    if (!data.length) return {
        status: 406,
        error: `User not found with name '${name}'`
    };

    return {
        code: data[0]['code']
    };
});


route('get/users/info/:code', async ({ query, params: { code} }) => {
    if (!code) return 'No code';

    const data = await query`
        SELECT 
            id,
            code,
            admin,
            student,
            name,
            year
        FROM users 
        WHERE code = ${code.toLowerCase()}
    `;

    if (!data.length) return {
        status: 406,
        error: 'User not found'
    };

    const user = data[0];

    const housePoints = await query`
        SELECT 
            id,
            description, 
            status,
            UNIX_TIMESTAMP(created) as timestamp,
            UNIX_TIMESTAMP(completed) as accepted,
            rejectMessage,
            quantity
        FROM housepoints
        WHERE student = ${user.id}
        ORDER BY timestamp DESC
    `;

    delete user.id;

    user['housepoints'] = housePoints;

    return user;
});


route('get/users/batch-info/:codes', async ({ query, params: { codes} }) => {
    if (!codes) return 'No codes';

    const data = await query`
        SELECT 
            id,
            code,
            admin,
            student,
            name,
            year
        FROM users
        WHERE code IN (${codes.split(',')})
    `;

    for (let i = 0; i < data.length; i++) {

        data[i]['housepoints'] = await query`
            SELECT 
                id, 
                description, 
                status,
                UNIX_TIMESTAMP(created) as timestamp,
                UNIX_TIMESTAMP(completed) as accepted,
                rejectMessage,
                quantity
            FROM housepoints
            WHERE student = ${data[i].id}
            ORDER BY timestamp DESC
        `;

        delete data[i].id;
    }

    return { data };
});


route('get/users/all', async ({ query, cookies, req }) => {
    if (!await requireAdmin(cookies, query)) return AUTH_ERR;

    const data = await query`
        SELECT 
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
    `;

    return { data };
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
    const { name, year: yearStr} = params;

    const year = parseInt(yearStr);

    if (isNaN(year)) return `Year '${year}' is not a number`;
    if ((year < 9 || year > 12) && year !== 0) {
        return `Year '${year}' is not between 9 and 12`;
    }

    if (name.length < 3) return `Name '${name}' too short`;

    if (!await requireAdmin(cookies, query)) return AUTH_ERR;

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


route('update/users/admin/:code?admin', async ({ query, params, cookies }) => {
    if (!await requireAdmin(cookies, query)) return AUTH_ERR;

    const { code, admin } = params;

    let id = await idFromCode(query, code);
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

    const queryRes = await query`UPDATE users SET admin = ${admin === '1'} WHERE id = ${id}`;
    if (!queryRes.affectedRows) return {
        status: 406,
        error: 'User not found'
    };
});


route('update/users/year/:code/:by', async ({ query, params, cookies }) => {
    if (!await requireAdmin(cookies, query)) return AUTH_ERR;

    const { code, by: yC } = params;
    const yearChange = parseInt(yC);

    if (isNaN(yearChange)) {
        return `Year change '${yearChange}' is not a number`;
    }
    if (yearChange < -2 || yearChange > 2) {
        return `Can't change year by more than 2 at once, trying to change by ${yearChange}`;
    }

    let id = await idFromCode(query, code);
    if (typeof id === 'string') return id;

    const queryRes = await query`UPDATE users SET year = year + ${yearChange} WHERE id = ${id}`;
    if (!queryRes.affectedRows) return {
        status: 406,
        error: 'User not found'
    };
});


route('delete/users/:code', async ({ query, params: { code}, cookies }) => {
    if (!await requireAdmin(cookies, query)) return AUTH_ERR;

    if (code === cookies[COOKIE_CODE_KEY]) return AUTH_ERR;

    const id = await idFromCode(query, code);
    if (typeof id === 'string') return id;

    await query`DELETE FROM housepoints WHERE student = ${id}`;

    const queryRes = await query`DELETE FROM users WHERE id = ${id}`;
    if (!queryRes.affectedRows) return {
        status: 406,
        error: 'User not found'
    };
});
