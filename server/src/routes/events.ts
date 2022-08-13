import route from "../";
import { AUTH_ERR, generateUUID, isAdmin, isLoggedIn, userFromSession } from '../util';
import mysql from "mysql2";

/**
 * @account
 * Single route for getting house points with some filters
 *
 * @param {number} from - events which have a time after this timestamp
 * @param {number} to - events which have a time before this timestamp
 * @param {string} id - events which have this ID
 * @param {string} userID - events which have house points which belong to this user
 */
route('get/events', async ({ query, body }) => {
    if (!await isLoggedIn(body, query)) return AUTH_ERR;

    let { id, userID, from: fromRaw, to: toRaw } = body;

    let from = parseInt(fromRaw) || 0;
    let to = parseInt(toRaw) || 0;

    let data = await query`
        SELECT
            id,
            name,
            description,
            UNIX_TIMESTAMP(time) as time
            
        FROM events
        WHERE
            ((id = ${id})          OR ${!id})
            AND ((time >= ${from}) OR ${!from})
            AND ((time <= ${to})   OR ${!to})
            
        ORDER BY time DESC
    `;

    const admin = await isAdmin(body, query);
    const signedIn = await isLoggedIn(body, query);

    if (!signedIn) return AUTH_ERR;

    const user = await userFromSession(query, body.session);
    if (!user) return AUTH_ERR;
    if (!user['id']) return AUTH_ERR;

    for (let i = 0; i < data.length; i++) {
        data[i]['housePoints'] = await query`
            SELECT
                housepoints.id,
                housepoints.quantity,
                housepoints.description,
                
                users.id as userID,
                users.email as studentEmail,
                users.year as studentYear
                
            FROM users, housepoints
            
            WHERE
                housepoints.student = users.id
                
                AND ((housepoints.event = ${id}) OR ${!id})
                AND ((users.id = ${userID})      OR ${!userID})
                
            ORDER BY users.year DESC, users.email
        `;

        data[i]['housePointCount'] = data[i]['housePoints']
            .reduce((acc: any, cur: any) => acc + cur['quantity'], 0);

        if (!admin) {
            for (let j = 0; j < data[i]['housePoints'].length; j++) {
                if (data[i]['housePoints'][j]['userID'] === user['id']) {
                    continue;
                }

                // if the house point does not belong to the user, censor it
                delete data[i]['housePoints'][j]['userID'];
                delete data[i]['housePoints'][j]['rejectMessage'];
            }
        }
    }

    // filter by user ID
    if (userID) {
        data = data.filter((evt: Record<string, any>) => {
            for (let hp of evt['housePoints']) {
                if (hp['userID'] === userID) {
                    return true;
                }
            }
            return false;
        });
    }

    return { data };
});

/**
 * @admin
 * Creates an event
 * Does not add house points, this must be done separately
 * @param name
 * @param timestamp
 * @param description
 */
route('create/events', async ({ query, body }) => {
    if (!await isAdmin(body, query)) return AUTH_ERR;

    const { name, timestamp: tsRaw, description } = body;

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

/**
 * @admin
 * Updates the name of an event from an event ID
 * @param id
 * @param name
 */
route('update/events/change-name', async ({ query, body }) => {
    if (!await isAdmin(body, query)) return AUTH_ERR;

    const { id, name: newName } = body;

    let queryRes = await query<mysql.OkPacket>`
        UPDATE events
        SET name = ${newName}
        WHERE id = ${id}
   `;

    if (queryRes.affectedRows === 0) return {
        status: 406,
        error: `Event not found`
    };
});

/**
 * @admin
 * Updates the timestamp of an event from an event ID
 * @param id
 * @param {int} time
 */
route('update/events/change-time/:id/:time', async ({ query, body }) => {
    if (!await isAdmin(body, query)) return AUTH_ERR;

    const { id, time: rawTime } = body;

    const time = parseInt(rawTime);
    if (isNaN(time) || !time) {
        return `Invalid event time '${rawTime}', must be an integer (UNIX timestamp)`;
    }

    let queryRes = await query<mysql.OkPacket>`
        UPDATE events
        SET time = FROM_UNIXTIME(${time})
        WHERE id = ${id}
   `;

    if (!queryRes.affectedRows) return {
        status: 406,
        error: `Event with ID '${id}' not found`
    };
});

/**
 * @admin
 * Deletes an event from an event ID
 * @param {1|0} deleteHps - if true, also deletes all house points with an event ID of this event
 * @param id
 */
route('delete/events/with-id', async ({ query, body }) => {
    if (!await isAdmin(body, query)) return AUTH_ERR;

    const { id, deleteHps = 1 } = body;

    if (deleteHps === '1') {
        await query`DELETE FROM housepoints WHERE event = ${id}`;
    }

    const res = await query<mysql.OkPacket>`
        DELETE FROM events 
        WHERE id = ${id}
    `;
    if (!res.affectedRows) return {
        status: 406,
        error: `No events to delete with ID '${id}'`
    }
});
