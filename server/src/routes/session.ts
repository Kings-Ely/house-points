import route from '../index';
import { error } from '../log';
import { AUTH_ERR, authLvl, generateUUID, getSessionID, isAdmin, isLoggedIn } from '../util';
import emailValidator from "email-validator";
import * as notifications from '../notifications';
import type mysql from "mysql2";

/**
 * Gets the authorisation level of a session ID
 * Note that this is one of the few routes which does not require logged in or admin.
 * @returns 0 for invalid/expired, >= 1 for logged in, 2 for admin user
 */
route('get/sessions/auth-level/:sessionID', async ({ query, params }) => {
    const { sessionID } = params;

    return {
        level: await authLvl(sessionID, query)
    };
});

/**
 * @admin
 * Gets details about all sessions which have not yet expired.
 * Not really any purpose other than monitoring the server.
 */
route('get/sessions/active', async ({ query, cookies }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    return { data: await query`
        SELECT 
            users.email,
            users.id as userID,
            sessions.id,
            UNIX_TIMESTAMP(sessions.opened) as opened
        FROM sessions, users
        WHERE
            sessions.user = users.id
            AND UNIX_TIMESTAMP(sessions.opened) + sessions.expires > UNIX_TIMESTAMP()
    ` };
});

/**
 * Creates a session from login details
 * Note that the password is sent in cleartext to the server before being hashed in the database,
 * which could pose a security threat.
 *
 * @param {number} [expires=86400] - the number of seconds the session should be valid for
 */
route('create/sessions/from-login/:email/:password?expires=86400', async ({ query, params }) => {

    // password in plaintext
    const { email, password, expires: expiresRaw } = params;

    if (!email || !password) {
        return 'Missing email or password';
    }

    const expires = parseInt(expiresRaw);
    if (isNaN(expires)) {
        return 'Invalid expires parameter';
    }
    if (expires > 86400 * 365) {
        return 'Session must expire within a year';
    }
    if (expires < 1) {
        return 'Session must not have already expired';
    }

    // don't bother validating email here,
    // makes it slightly quickly for slightly less info to user
    // invalid emails can't be added to the database anyway

    const res = await query`
        SELECT id
        FROM users
        WHERE email = ${email}
            AND password = SHA2(CONCAT(${password}, salt), 256);
    `;

    if (!res.length) return 'Invalid email or password';
    if (res.length > 1) {
        // don't tell the user about this, it's a security issue
        error`Multiple users found with email ${email}`;
        return 'Invalid email or password';
    }

    const sessionID = await generateUUID();

    await query`
        INSERT INTO sessions (id, user, expires)
        VALUES (${sessionID}, ${res[0].id}, ${expires});
    `;

    return { sessionID, userID: res[0].id };
});

/**
 * @admin
 * Creates a session from a user ID.
 * This is an admin route because you should only be able to create a session from a
 * user ID if you already have a valid session.
 * This means the root of all sessions is valid login details.
 * Otherwise, if someone's userID was leaked, it could be used to continually generate sessions,
 * removing the benefits of sessions entirely over simply using the userID as the auth token.
 *
 * @param {number} [expires=86400] - the number of seconds the session should be valid for
 */
route('create/sessions/from-user-id/:userID?expires=86400', async ({ query, params, cookies }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    const { userID, expires: expiresRaw } = params;

    if (!userID) {
        return 'UserID not specified';
    }
    const expires = parseInt(expiresRaw);
    if (isNaN(expires)) {
        return 'Invalid expires parameter';
    }
    if (expires > 86400 * 365) {
        return 'Session must expire within a year';
    }
    if (expires < 1) {
        return 'Session must not have already expired';
    }

    const res = await query`
        SELECT email
        FROM users
        WHERE id = ${userID}
    `;
    if (!res.length) return 'Invalid userID';

    const sessionID = await generateUUID();

    await query`
        INSERT INTO sessions (id, user, expires)
        VALUES (${sessionID}, ${userID}, ${expires});
    `;

    return { sessionID, userID };
});

/**
 * Runs the 'forgotten password' flow.
 * Takes an email and sends a link to their email with a new session
 * which expires in 1 hour.
 */
route('create/sessions/for-forgotten-password/:email', async ({ query, params, cookies }) => {
    const { email } = params;

    if (!email) {
        return 'Email not specified';
    }
    if (!emailValidator.validate(email)) {
        return 'Invalid email';
    }

    const res = await query`
        SELECT id
        FROM users
        WHERE email = ${email}
    `;
    if (!res.length) return 'Invalid email';
    if (res.length > 1) {
        // don't tell the user about this, it's a security issue
        error`Multiple users found with email '${email}'`;
        return 'Invalid email';
    }
    const userID = res[0].id;
    const sessionID = await generateUUID();

    await query`
        INSERT INTO sessions (id, user, expires)
        VALUES (${sessionID}, ${userID}, ${60*60});
    `;

    await notifications.forgottenPasswordEmail(query, userID, sessionID);
});

/**
 * Removes the session from the database
 */
route('delete/sessions/with-id/:sessionID', async ({ query, params }) => {
    const { sessionID } = params;

    const queryRes = await query<mysql.OkPacket>`
        DELETE FROM sessions
        WHERE id = ${sessionID}
    `;
    if (queryRes.affectedRows === 0) return {
        status: 406,
        error: `Session not found`
    };
});

/**
 * @account
 * Deletes the session from the cookie sent with the request.
 * Checks that the session is valid first.
 */
route('delete/sessions/mine', async ({ query, cookies }) => {
    if (!await isLoggedIn(cookies, query)) return AUTH_ERR;

    await query`
        DELETE FROM sessions
        WHERE id = ${getSessionID(cookies)}
    `;
})