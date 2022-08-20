import route from "../";
import { addHousePointsToEvent, AUTH_ERR, generateUUId, isAdmin, isLoggedIn, userFromSession } from '../util';
import mysql from "mysql2";

/**
 * @account
 * Single route for getting house points with some filters
 *
 * @param {number} from - events which have a time after this timestamp
 * @param {number} to - events which have a time before this timestamp
 * @param {string} eventId - events which have this Id
 * @param {string} userId - events which have house points which belong to this user
 */
route('get/events', async ({ query, body }) => {
    if (!await isLoggedIn(body, query)) return AUTH_ERR;

    let { eventId='', userId='', from=0, to=0 } = body;

    let data = await query`
        SELECT
            id,
            name,
            description,
            UNIX_TIMESTAMP(time) as time
            
        FROM events
        WHERE
            ((id = ${eventId})     OR ${!eventId})
            AND ((time >= ${from}) OR ${!from})
            AND ((time <= ${to})   OR ${!to})
            
        ORDER BY time DESC
    `;

    const admin = await isAdmin(body, query);
    const signedIn = await isLoggedIn(body, query);
    if (!signedIn) return AUTH_ERR;

    const user = await userFromSession(query, body.session);
    if (!user || !user.id) return AUTH_ERR;

    for (let i = 0; i < data.length; i++) {
        await addHousePointsToEvent(query, data[i]);

        if (!admin) {
            for (let j = 0; j < data[i]['housePoints'].length; j++) {
                if (data[i]['housePoints'][j]['userId'] === user['id']) {
                    continue;
                }

                // if the house point does not belong to the user, censor it
                delete data[i]['housePoints'][j]['userId'];
                delete data[i]['housePoints'][j]['rejectMessage'];
            }
        }
    }

    // filter by user Id
    if (userId) {
        data = data.filter((evt: Record<string, any>) => {
            for (let hp of evt['housePoints']) {
                if (hp['userId'] === userId) {
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
 * @param {int} time
 * @param description
 */
route('create/events', async ({ query, body }) => {
    if (!await isAdmin(body, query)) return AUTH_ERR;

    const { name='', time=Math.ceil(Date.now()/1000), description='' } = body;

    if (name.length < 3) {
        return `Event name must be more than 3 characters, got '${name}'`;
    }

    if (!Number.isInteger(time)) {
        return 'Timestamp must be an integer (UNIX timestamp)';
    }
    if (time < 1) {
        return 'Timestamp must be at least 1';
    }

    const id = await generateUUId();

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
 * Updates the name of an event from an event Id
 * @param eventId
 * @param name
 */
route('update/events/name', async ({ query, body }) => {
    if (!await isAdmin(body, query)) return AUTH_ERR;

    const { eventId='', name='' } = body;

    if (!eventId) return 'EventId is not in body of request';
    if (!name) return 'Event must have name';

    let queryRes = await query<mysql.OkPacket>`
        UPDATE events
        SET name = ${name}
        WHERE id = ${eventId}
   `;
    if (queryRes.affectedRows === 0) return {
        status: 406,
        error: `Event not found`
    };
});

/**
 * @admin
 * Updates the description of an event from an event Id
 * @param eventId
 * @param description
 */
route('update/events/description', async ({ query, body }) => {
    if (!await isAdmin(body, query)) return AUTH_ERR;

    const { eventId='', description='' } = body;

    if (!eventId) return 'EventId is not in body of request';

    let queryRes = await query<mysql.OkPacket>`
        UPDATE events
        SET description = ${description}
        WHERE id = ${eventId}
   `;
    if (queryRes.affectedRows === 0) return {
        status: 406,
        error: `Event not found`
    };
});

/**
 * @admin
 * Updates the timestamp of an event from an event Id
 * @param eventId
 * @param {int} time
 */
route('update/events/time', async ({ query, body }) => {
    if (!await isAdmin(body, query)) return AUTH_ERR;

    const { eventId='', time=Math.ceil(Date.now()/1000) } = body;

    if (!eventId) return 'EventId is not in body of request';
    if (!Number.isInteger(time)) {
        return `Invalid event time, must be an integer (UNIX timestamp)`;
    }

    let queryRes = await query<mysql.OkPacket>`
        UPDATE events
        SET time = FROM_UNIXTIME(${time})
        WHERE id = ${eventId}
   `;
    if (!queryRes.affectedRows) return {
        status: 406,
        error: `Event with Id '${eventId}' not found`
    };
});

/**
 * @admin
 * Deletes an event from an event Id
 * @param eventId
 * @param {1|0} deleteHps - if true, also deletes all house points with an event Id of this event
 */
route('delete/events', async ({ query, body }) => {
    if (!await isAdmin(body, query)) return AUTH_ERR;

    const { eventId='', deleteHps=true } = body;
    if (!eventId) return 'EventId is not in body of request';

    if (deleteHps) {
        await query`
            DELETE FROM housepoints
            WHERE event = ${eventId}
        `;
    }

    const res = await query<mysql.OkPacket>`
        DELETE FROM events
        WHERE id = ${eventId}
    `;
    if (!res.affectedRows) return {
        status: 406,
        error: `No events to delete with that Id`
    }
});
