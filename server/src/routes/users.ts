import emailValidator from 'email-validator';
import * as crypto from "crypto";

import route from '../';
import { AUTH_ERR, generateUUID, getSessionID, IDFromSession, isAdmin, isLoggedIn } from '../util';

route('get/users/from-id/:id', async ({ query, params, cookies }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    const { id } = params;

    if (!id) return 'No user ID';

    const data = await query`
        SELECT 
            id,
            email,
            admin,
            student,
            year
        FROM users
        WHERE id = ${id}
    `;

    if (!data.length) return {
        status: 406,
        error: 'User not found'
    };

    const user = data[0];

    user['housepoints'] = await query`
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

    return user;
});

route('get/users/from-email/:email', async ({ query, params, cookies }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    const { email } = params;

    if (!email) return 'No email';

    const data = await query`
        SELECT 
            id,
            email,
            admin,
            student,
            year
        FROM users
        WHERE email = ${email}
    `;

    if (!data.length) return {
        status: 406,
        error: 'User not found'
    };

    const user = data[0];

    user['housepoints'] = await query`
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

    return user;
});

route('get/users/from-session/:session', async ({ query, params }) => {
    const { session } = params;
    if (!session) return 'No session ID';

    const data = await query`
        SELECT
            users.id,
            users.email,
            users.admin,
            users.student,
            users.year
        FROM users, sessions
        WHERE sessions.id = ${session}
            AND sessions.user = users.id
            AND UNIX_TIMESTAMP(sessions.opened) + sessions.expires > UNIX_TIMESTAMP()
    `;

    if (!data.length) return {
        status: 406,
        error: 'User not found'
    };

    const user = data[0];

    user['housepoints'] = await query`
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

    return user;
});

route('get/users/batch-info/:userIDs', async ({ query, params, cookies }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    const { userIDs } = params;

    if (!userIDs) return 'No codes';

    const data = await query`
        SELECT 
            id,
            admin,
            student,
            email,
            year
        FROM users
        WHERE id IN (${userIDs.split(',')})
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
            WHERE student = ${data[i]['id']}
            ORDER BY timestamp DESC
        `;
    }

    return { data };
});


route('get/users', async ({ query, cookies }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    const data = await query`
        SELECT 
            users.id,
            users.email, 
            users.year,
            users.admin,
            users.student,
            SUM(CASE WHEN housepoints.status='Pending' THEN housepoints.quantity ELSE 0 END) AS pending,
            SUM(CASE WHEN housepoints.status='Accepted' THEN housepoints.quantity ELSE 0 END) AS accepted,
            SUM(CASE WHEN housepoints.status='Rejected' THEN housepoints.quantity ELSE 0 END) AS rejected
        FROM users 
        LEFT JOIN housepoints
        ON housepoints.student = users.id
        GROUP BY 
            users.id, 
            users.email, 
            users.year,
            users.admin,
            users.student
        ORDER BY 
            users.student,
            users.admin DESC,
            year,
            email;
    `;

    return { data };
});

route('get/users/leaderboard', async ({ query, cookies }) => {
    if (!await isLoggedIn(cookies, query)) return AUTH_ERR;

    return {
        data: await query`
            SELECT 
                users.email, 
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
            GROUP BY users.email, users.year
            ORDER BY housepoints DESC, year DESC, email;
        `
    };
});


route('create/users/:email/:password?year=9', async ({ query, params, cookies }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    const { email, year: yearStr, password } = params;

    const year = parseInt(yearStr);

    if (isNaN(year)) return `Year '${year}' is not a number`;
    if ((year < 9 || year > 13) && year !== 0) {
        return `Year '${year}' is not between 9 and 13`;
    }

    if (!emailValidator.validate(email)) {
        return `Invalid email '${email}'`;
    }

    // password requirements
    if (!password) return 'No password';
    if (password.length < 5) return 'Password is too short, must be over 4 characters';
    if (password.length > 64) return 'Password is too long, must be under 64 characters';

    const admin = year === 0 ? 1 : 0;
    const student = year === 0 ? 0 : 1;

    const salt = crypto.randomBytes(16).toString('base64');

    const passwordHash = crypto
        .createHash('sha256')
        .update(password + salt)
        .digest('hex');

    await query`
        INSERT INTO users
            (id,                      email,    password,        salt,    year,    admin,     student)
        VALUES
            (${await generateUUID()}, ${email}, ${passwordHash}, ${salt}, ${year}, ${admin}, ${student})
    `;

    return { status: 201 };
});


route('update/users/admin/:userID?admin', async ({ query, params, cookies }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    const { userID, admin } = params;

    const mySession = getSessionID(cookies);
    if (!mySession) return 'No session ID found';

    if (await IDFromSession(query, mySession) === userID) {
        return {
            status: 403,
            error: 'You cannot change your own admin status'
        };
    }

    const queryRes = await query`UPDATE users SET admin = ${admin === '1'} WHERE id = ${userID}`;
    if (!queryRes.affectedRows) return {
        status: 406,
        error: 'User not found'
    };
});

route('update/users/year/:userID/:by', async ({ query, params, cookies }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    const { userID: user, by: yC } = params;
    const yearChange = parseInt(yC);

    if (isNaN(yearChange)) {
        return `Year change '${yearChange}' is not a number`;
    }
    if (yearChange < -2 || yearChange > 2) {
        return `Can't change year by more than 2 at once, trying to change by ${yearChange}`;
    }

    const currentYear = await query`SELECT year FROM users WHERE id = ${user}`;
    if (!currentYear.length) return {
        status: 406,
        error: 'User not found'
    }
    const year = currentYear[0].year;
    if (year === 0) {
        return `Cannot change year of user from '0'`;
    }

    const newYear = currentYear[0].year + yearChange;

    const queryRes = await query`
        UPDATE users 
        SET year = ${newYear} 
        WHERE id = ${user}
    `;

    if (!queryRes.affectedRows) return {
        status: 406,
        error: 'User not found'
    };
});


route('delete/users/:userID', async ({ query, params, cookies }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    const { userID } = params;

    if (userID === await IDFromSession(query, getSessionID(cookies))) return AUTH_ERR;

    await query`DELETE FROM housepoints WHERE student = ${userID}`;

    const queryRes = await query`DELETE FROM users WHERE id = ${userID}`;
    if (!queryRes.affectedRows) return {
        status: 406,
        error: 'User not found'
    };
});
