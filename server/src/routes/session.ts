import route from '../index';
import { error } from '../log';
import {authLvl, generateUUID} from '../util';

route('get/sessions/auth-level/:sessionID', async ({ query, params }) => {
    const { sessionID } = params;

    return {
        level: await authLvl(sessionID, query)
    };
});

route('create/sessions/:email/:password?expires=86400', async ({ query, params }) => {

    // password in plaintext
    const { email, password } = params;

    if (!email || !password) {
        return 'Missing email or password';
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
        INSERT INTO sessions (id, user)
        VALUES (${sessionID}, ${res[0].id})
    `;

    return { sessionID, userID: res[0].id };
});

route('create/sessions/:userID?expires=86400', async ({ query, params }) => {

    const { userID } = params;

    if (!userID) {
        return 'UserID not specified';
    }

    const res = await query`
        SELECT email
        FROM users
        WHERE id = ${userID}
    `;
    if (!res.length) return 'Invalid userID';

    const sessionID = await generateUUID();

    await query`
        INSERT INTO sessions (id, user)
        VALUES (${sessionID}, ${userID})
    `;

    return { sessionID, userID };
});

route('delete/sessions/:sessionID', async ({ query, params }) => {
    const { sessionID } = params;

    const queryRes = await query`
        DELETE FROM sessions
        WHERE id = ${sessionID}
    `;

    if (!queryRes.affectedRows) {
        return 'Session not found';
    }
})