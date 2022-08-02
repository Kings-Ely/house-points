import route from "../";
import { AUTH_ERR, generateUUID, getSessionID, isAdmin, isLoggedIn, userFromSession } from '../util';

route('get/events?id&userID&from&to', async ({ query, params, cookies }) => {
    // Single route for getting house points with filters

    let { id, userID, from: fromRaw, to: toRaw } = params;

    let from = parseInt(fromRaw) || 0;
    let to = parseInt(toRaw) || 0;

    const res = await query`
        SELECT
            events.id,
            events.name,
            events.description,
            UNIX_TIMESTAMP(events.time) as time,
            SUM(
                CASE 
                    WHEN housepoints.status='Accepted' 
                        THEN housepoints.quantity 
                    ELSE 0
                END
            ) AS housePointCount
            
        FROM events, users
        LEFT JOIN housepoints
            ON housepoints.student = users.id
        
        WHERE
            housepoints.event = events.id
            
            AND ((events.id = ${id})  OR ${!id})
            AND ((created >= ${from}) OR ${!from})
            AND ((created <= ${to})   OR ${!to})
            AND (users.id = ${userID} OR ${!userID})
        GROUP BY events.id, events.name, events.description, events.time
    `;

    const admin = await isAdmin(cookies, query);
    const signedIn = await isLoggedIn(cookies, query);

    if (!signedIn) return AUTH_ERR;

    const user = await userFromSession(query, getSessionID(cookies));
    if (!user) return AUTH_ERR;
    if (!user['id']) return AUTH_ERR;

    for (let i = 0; i < res.length; i++) {
        res[i]['housePoints'] = await query`
            SELECT
                housepoints.id,
                housepoints.quantity,
                housepoints.description,
                
                users.id as userID,
                users.email as studentEmail,
                users.year as studentYear,
                
            FROM users, housepoints
            
            WHERE
                housepoints.student = users.id
                
                AND ((housepoints.event = ${id}) OR ${!id})
                AND ((users.id = ${userID})      OR ${!userID})
                
            ORDER BY
                time DESC
        `;

        if (!admin) {
            for (let j = 0; j < res[i]['housePoints'].length; j++) {
                if (res[i]['housePoints'][j]['userID'] === user['id']) {
                    continue;
                }

                // if the house point does not belong to the user, censor it
                delete res[i]['housePoints'][j]['userID'];
                delete res[i]['housePoints'][j]['studentEmail'];
                delete res[i]['housePoints'][j]['rejectMessage'];
                delete res[i]['housePoints'][j]['description'];
            }
        }
    }

    return { data: res };
});

route('create/events/:name/:timestamp?description', async ({ query, cookies, params }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    const { name, timestamp: tsRaw, description } = params;

    if (name.length < 3) {
        return `Event name must be more than 3 characters, got '${name}'`;
    }

    let time = parseInt(tsRaw);
    if (isNaN(time) || !time) {
        return 'Timestamp must be an integer (UNIX timestamp)';
    }
    if (time < 1) {
        return 'Timestamp must be at least 1';
    }

    const id = await generateUUID();

    await query`
        INSERT INTO events (id, name, time, description)
        VALUES (
            ${id},
            ${name},
            FROM_UNIXTIME(${time}),
            ${description || ''}
        )
    `;

    return { status: 201, id };
});

route('update/events/change-name/:id/:name', async ({ query, cookies, params }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    const { id, name: newName } = params;

    let queryRes = await query`
        UPDATE events
        SET name = ${newName}
        WHERE id = ${id}
   `;

    if (queryRes.affectedRows === 0) {
        return {
            status: 406,
            error: `Event with ID '${id}' not found`
        };
    }
});

route('update/events/change-time/:id/:time', async ({ query, cookies, params }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    const { id, time: rawTime } = params;

    const time = parseInt(rawTime);
    if (isNaN(time) || !time) {
        return `Invalid event time '${rawTime}', must be an integer (UNIX timestamp)`;
    }

    let queryRes = await query`
        UPDATE events
        SET time = FROM_UNIXTIME(${time})
        WHERE id = ${id}
   `;

    if (!queryRes.affectedRows) return {
        status: 406,
        error: `Event with ID '${id}' not found`
    };
});

route('delete/events/with-id/:id?deleteHps=1', async ({ query, cookies, params }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    const { id, deleteHps } = params;

    if (deleteHps === '1') {
        await query`DELETE FROM housepoints WHERE event = ${id}`;
    }

    const res = await query`DELETE FROM events WHERE id = ${id}`;
    if (!res.affectedRows) return {
        status: 406,
        error: `No events to delete with ID '${id}'`
    }
});
