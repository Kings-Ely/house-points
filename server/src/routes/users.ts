import emailValidator from 'email-validator';
import mysql from 'mysql2';

import route from '../';

import {
    addHousePointsToUser,
    AUTH_ERR,
    generateUUId,
    idFromSession,
    isAdmin,
    isLoggedIn,
    passwordHash,
    validPassword
} from '../util';

/**
 * @admin
 * Gets all users
 * @param userId
 * @param email
 * @param sessionId
 */
route('get/users', async ({ query, body }) => {
    const { userId = '', email = '', sessionId = '' } = body;

    if (sessionId) {
        if (userId) return `Invalid body: cannot specify both 'session' and 'id'`;
        if (email) return `Invalid body: cannot specify both 'session' and 'email'`;

        const data = await query`
            SELECT
                users.id,
                users.email,
                users.admin,
                users.student,
                users.year
            FROM users, sessions
            WHERE sessions.id = ${sessionId}
                AND sessions.userId = users.id
                AND UNIX_TIMESTAMP(sessions.opened) + sessions.expires > UNIX_TIMESTAMP()
                AND sessions.active = 1
        `;

        if (!data.length)
            return {
                status: 406,
                error: 'User not found'
            };

        const user = data[0];

        await addHousePointsToUser(query, user);

        return user;
    }

    if (email) {
        if (userId) return `Invalid body: cannot specify both 'email' and 'id'`;
        if (!(await isLoggedIn(body, query))) return AUTH_ERR;

        const { email } = body;

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
        if (!data[0])
            return {
                status: 406,
                error: 'User not found'
            };

        const user = data[0];

        await addHousePointsToUser(query, user);

        // censor the data if they don't have access
        if (!(await isAdmin(body, query))) {
            const id = await idFromSession(query, body.session);
            if (id !== user.id) {
                delete user.id;

                for (let hp of user['housePoints']) {
                    delete hp.id;
                    delete hp.userId;
                    delete hp.rejectMessage;
                }
            }
        }

        return user;
    }

    // gets all users
    if (!userId) {
        if (!(await isAdmin(body, query))) return AUTH_ERR;

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
        await Promise.all(
            data.map(async (user: any) => {
                await addHousePointsToUser(query, user);
            })
        );

        return { data };
    }

    // user with specific Id
    const data = await query`
        SELECT 
            id,
            email,
            admin,
            student,
            year
        FROM users
        WHERE id = ${userId}
    `;

    if (!data.length)
        return {
            status: 406,
            error: 'User not found'
        };

    const user = data[0];

    await addHousePointsToUser(query, user);

    return user;
});

/**
 * @admin
 * Gets the details of multiple users from a list of Ids.
 * Ids are delimited by ','
 * @param {string[]} userIds
 */
route('get/users/batch-info', async ({ query, body }) => {
    if (!(await isAdmin(body, query))) return AUTH_ERR;

    const { userIds: ids } = body;

    if (!ids?.length)
        return {
            status: 406,
            error: 'No Ids'
        };

    const data = await query`
        SELECT 
            id,
            admin,
            student,
            email,
            year
        FROM users
        WHERE id IN (${ids})
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
route('get/users/leaderboard', async ({ query, body }) => {
    if (!(await isLoggedIn(body, query))) return AUTH_ERR;

    let data = await query`
        SELECT 
            email,
            year,
            id
        FROM users
        WHERE student = true
        ORDER BY year DESC, email
    `;

    data.forEach((u: any) => addHousePointsToUser(query, u));

    if (!(await isAdmin(body, query))) {
        // remove id from each user
        for (let i = 0; i < data.length; i++) {
            delete data[i]?.['id'];
        }
    }

    data = data.sort((a, b) => b['accepted'] - a['accepted']);

    return { data };
});

/**
 * @admin
 * Creates an account from an email and password.
 * Note admin - students cannot create their own accounts
 * Generates a salt and Id for the student.
 * Hashes the password along with the salt before storing it in the DB.
 *
 * @param {(13 >= number >= 9) || (number == 0)} year - year of student
 *                                                      if the year is 0 then it is a
 *                                                      non-student (teacher) account,
 *                                                      and they are assumed to be an admin
 * @param email
 * @param password
 */
route('create/users', async ({ query, body }) => {
    if (!(await isAdmin(body, query))) return AUTH_ERR;

    const { email = '', year = 9, password = '' } = body;

    if (!Number.isInteger(year)) {
        return `Year is not a number`;
    }
    if ((year < 9 || year > 13) && year !== 0) {
        return `Year '${year}' is not between 9 and 13`;
    }

    if (!emailValidator.validate(email || '')) {
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

    const [passHash, salt] = passwordHash(password);

    const userId = await generateUUId();

    await query`
        INSERT INTO users
            (id,          email,    password,        salt,    year,    admin,    student)
        VALUES
            (${userId}, ${email}, ${passHash}, ${salt}, ${year}, ${admin}, ${student})
    `;

    return { status: 201, userId };
});

/**
 * @admin
 * Change a user's admin status from their Id.
 * If the userId is the same as the Id associated with the session in cookies
 * it returns an error.
 * Otherwise, you could remove all admins from the system.
 *
 * @param {1|any} admin - whether they should be an admin now.
 *                        1 for admin, anything else for not admin.
 * @param userId
 */
route('update/users/admin', async ({ query, body }) => {
    if (!(await isAdmin(body, query))) return AUTH_ERR;

    const { userId = '', admin = false } = body;

    const mySession = body.session;
    if (!mySession) return 'No session Id found';

    if (!admin) return 'Must specify admin in body';

    if ((await idFromSession(query, mySession)) === userId)
        return {
            status: 403,
            error: 'You cannot change your own admin status'
        };

    const queryRes = await query<mysql.OkPacket>`
        UPDATE users
        SET admin = ${admin}
        WHERE id = ${userId}
   `;
    if (!queryRes.affectedRows)
        return {
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
 * @param userId
 * @param {int} by
 */
route('update/users/year', async ({ query, body }) => {
    if (!(await isAdmin(body, query))) return AUTH_ERR;

    const { userId: user = '', by: yearChange } = body;

    if (!Number.isInteger(yearChange)) {
        return `Year change is not an integer`;
    }
    if (Math.abs(yearChange) > 2) {
        return `Can't change year by more than 2 at once, trying to change by ${yearChange}`;
    }

    const currentYear = await query`
        SELECT year 
        FROM users 
        WHERE id = ${user}
    `;
    if (!currentYear[0])
        return {
            status: 406,
            error: 'User not found'
        };
    const year = currentYear[0].year;
    if (year === 0) {
        return `Cannot change year of user from '0'`;
    }

    const newYear = currentYear[0].year + yearChange;

    if (newYear > 13 || newYear < 9) {
        return `Cannot change year to ${newYear}, must be between 8 and 13`;
    }

    const queryRes = await query<mysql.OkPacket>`
        UPDATE users
        SET year = ${newYear}
        WHERE id = ${user}
    `;

    if (!queryRes.affectedRows)
        return {
            status: 406,
            error: 'User not found'
        };
});

/**
 * Updates the password from a session Id and new password.
 * This is a high risk route, as you are updating the password of a user,
 * and this must be able to be done by a user without login details
 * if they are using the 'forgot password' feature.
 * @param sessionId
 * @param newPassword
 */
route('update/users/password', async ({ query, body }) => {
    const { sessionId = '', newPassword = '' } = body;

    const userId = await idFromSession(query, sessionId);

    if (!userId)
        return {
            status: 401,
            error: 'Invalid session Id'
        };

    const validPasswordRes = validPassword(newPassword);
    if (typeof validPasswordRes === 'string') {
        return validPasswordRes;
    }

    const [passHash, salt] = passwordHash(newPassword);

    const queryRes = await query<mysql.OkPacket>`
        UPDATE users
        SET
            password = ${passHash},
            salt = ${salt}
        WHERE id = ${userId}
    `;

    if (!queryRes.affectedRows)
        return {
            status: 406,
            error: 'User not found'
        };

    await query`
        UPDATE sessions
        SET active = 0
        WHERE
            id = ${sessionId}
            OR UNIX_TIMESTAMP(opened) + expires > UNIX_TIMESTAMP()
    `;
});

/**
 * @admin
 * Deletes a user from a user Id
 * @param userId
 */
route('delete/users', async ({ query, body }) => {
    if (!(await isAdmin(body, query))) return AUTH_ERR;

    const { userId } = body;

    if ((await idFromSession(query, body.session)) === userId)
        return {
            status: 403,
            error: 'You cannot delete your own account'
        };

    await query`
        DELETE FROM housepoints
        WHERE userId = ${userId}
    `;

    const queryRes = await query<mysql.OkPacket>`
        DELETE FROM users
        WHERE id = ${userId}
    `;
    if (!queryRes.affectedRows)
        return {
            status: 406,
            error: 'User not found'
        };
});
