import emailValidator from 'email-validator';
import mysql from "mysql2";

import route from '../';
import {
    addHousePointsToUser,
    AUTH_ERR,
    generateUUID,
    getSessionID,
    IDFromSession,
    isAdmin,
    isLoggedIn, passwordHash, validPassword
} from '../util';


/**
 * @admin
 * Gets all users
 */
route('get/users', async ({ query, cookies }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    const data = await query`
        SELECT 
            id,
            email, 
            year,
            admin,
            student
        FROM users
        ORDER BY
            student,
            admin DESC,
            year,
            email
    `;

    // add house points to all users without waiting for one user to finish
    await Promise.all(data.map(async (user: any) => {
        await addHousePointsToUser(query, user);
    }));

    return { data };
});

/**
 * @admin
 * Gets the user details from a user ID
 */
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

    await addHousePointsToUser(query, user);

    return user;
});

/**
 * @admin
 * Gets the user details from an email
 * Note that this exposes the user ID
 */
route('get/users/from-email/:email',
    async ({ query, params, cookies }) => {
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

    await addHousePointsToUser(query, user);

    return user;
});

/**
 * Gets the user details frm a session, checking that the session is valid first
 */
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

    await addHousePointsToUser(query, user);

    return user;
});

/**
 * @admin
 * Gets the details of multiple users from a list of IDs.
 * IDs are delimited by ','
 */
route('get/users/batch-info/:userIDs',
    async ({ query, params, cookies }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    const { userIDs } = params;

    if (!userIDs) return 'No codes';

    const IDs = userIDs.split(',').filter(Boolean);

    if (!IDs.length) return {
        status: 406,
        error: 'No IDs'
    }

    const data = await query`
        SELECT 
            id,
            admin,
            student,
            email,
            year
        FROM users
        WHERE id IN (${IDs})
    `;

    for (let i = 0; i < data.length; i++) {
        await addHousePointsToUser(query, data[i]);
    }

    return { data };
});

/**
 * @account
 * Gets the data required for to make the leaderboard.
 */
route('get/users/leaderboard', async ({ query, cookies }) => {
    if (!await isLoggedIn(cookies, query)) return AUTH_ERR;

    let data = (await query`
        SELECT 
            email,
            year,
            id
        FROM users
        WHERE student = true
        ORDER BY year DESC, email
    `);

    data.forEach((u: any) => addHousePointsToUser(query, u));

    if (!await isAdmin(cookies, query)) {
        // remove id from each user
        for (let i = 0; i < data.length; i++) {
            delete data[i]['id'];
        }
    }

    data = data.sort((a, b) => b['accepted'] - a['accepted']);

    return { data };
});

/**
 * @admin
 * Creates an account from an email and password.
 * Note admin - students cannot create their own accounts
 * Generates a salt and ID for the student.
 * Hashes the password along with the salt before storing it in the DB.
 *
 * @param {(13 >= number >= 9) || (number == 0)} year - year of student
 *                                                      if the year is 0 then it is a non-student (teacher)
 *                                                      account, and they are assumed to be an admin
 *
 */
route('create/users/:email/:password?year=9',
    async ({ query, params, cookies }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    const { email, year: yearStr, password } = params;

    const year = parseInt(yearStr);

    if (isNaN(year)) return `Year '${year}' is not a number`;
    if ((year < 9 || year > 13) && year !== 0) {
        return `Year '${year}' is not between 9 and 13`;
    }

    if (!emailValidator.validate(email)) {
        return `Invalid email`;
    }

    let currentUser = await query`
        SELECT id FROM users WHERE email = ${email}
    `;
    if (currentUser.length) {
        return `User with that email already exists`;
    }

    const validPasswordRes = validPassword(password);
    if (typeof validPasswordRes === 'string') {
        return validPasswordRes;
    }

    const admin = year === 0 ? 1 : 0;
    const student = year === 0 ? 0 : 1;

    const [ passHash, salt ] = passwordHash(password);

    const userID = await generateUUID();

    await query`
        INSERT INTO users
            (id,          email,    password,        salt,    year,    admin,    student)
        VALUES
            (${userID}, ${email}, ${passHash}, ${salt}, ${year}, ${admin}, ${student})
    `;

    return { status: 201, userID };
});

/**
 * @admin
 * Change a user's admin status from their ID.
 * If the userID is the same as the ID associated with the session in cookies
 * it returns an error.
 * Otherwise, you could remove all admins from the system.
 *
 * @param {1|any} admin - whether they should be an admin now.
 *                        1 for admin, anything else for not admin.
 */
route('update/users/admin/:userID?admin',
    async ({ query, params, cookies }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    const { userID, admin } = params;

    const mySession = getSessionID(cookies);
    if (!mySession) return 'No session ID found';

    if (await IDFromSession(query, mySession) === userID) return {
        status: 403,
        error: 'You cannot change your own admin status'
    };

    const queryRes = await query<mysql.OkPacket>`
        UPDATE users
        SET admin = ${admin === '1'}
        WHERE id = ${userID}
   `;
    if (!queryRes.affectedRows) return {
        status: 406,
        error: 'User not found'
    };
});

/**
 * @admin
 * Update a student's year.
 * Needed for when everyone goes up a year.
 * Changes a students year by an amount between -3 and 3 and not 0
 * Cannot change a non-student's year from 0
 */
route('update/users/year/:userID/:by',
    async ({ query, params, cookies }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    const { userID: user, by: yC } = params;
    const yearChange = parseInt(yC);

    if (isNaN(yearChange)) {
        return `Year change '${yearChange}' is not a number`;
    }
    if (Math.abs(yearChange) > 2) {
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

    const queryRes = await query<mysql.OkPacket>`
        UPDATE users
        SET year = ${newYear} 
        WHERE id = ${user}
    `;

    if (!queryRes.affectedRows) return {
        status: 406,
        error: 'User not found'
    };
});

/**
 * Updates the password from a session ID and new password.
 * This is a high risk route, as you are updating the password of a user,
 * and this must be able to be done by a user without login details
 * if they are using the 'forgot password' feature.
 */
route('update/users/password/:sessionID/:password', async ({ query, params }) => {
    const { sessionID, password } = params;

    const userID = await IDFromSession(query, sessionID);

    if (!userID) return {
        status: 401,
        error: 'Invalid session ID'
    }

    const validPasswordRes = validPassword(password);
    if (typeof validPasswordRes === 'string') {
        return validPasswordRes;
    }

    const [ passHash, salt ] = passwordHash(password);

    const queryRes = await query<mysql.OkPacket>`
        UPDATE users
        SET
            password = ${passHash},
            salt = ${salt}
        WHERE id = ${userID}
    `;

    if (!queryRes.affectedRows) return {
        status: 406,
        error: 'User not found'
    };
});

/**
 * @admin
 * Deletes a user from a user ID
 */
route('delete/users/:userID', async ({ query, params, cookies }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    const { userID } = params;

    if (await IDFromSession(query, getSessionID(cookies)) === userID) return {
        status: 403,
        error: 'You cannot delete your own account'
    };

    await query`DELETE FROM housepoints WHERE student = ${userID}`;

    const queryRes = await query<mysql.OkPacket>`
        DELETE FROM users 
        WHERE id = ${userID}
    `;
    if (!queryRes.affectedRows) return {
        status: 406,
        error: 'User not found'
    };
});
