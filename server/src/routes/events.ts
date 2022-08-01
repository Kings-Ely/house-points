import route from "../";
import { AUTH_ERR, generateUUID, requireAdmin, requireLoggedIn } from '../util';

route('get/events/all', async ({ query, cookies }) => {
    if (!await requireLoggedIn(cookies, query)) return AUTH_ERR;

    return { data: await query`
        SELECT
            events.id,
            events.name,
            events.description,
            UNIX_TIMESTAMP(events.time) as time
        FROM
            events
        ORDER BY
            time DESC
    `};
});

route('create/events/:name/:timestamp?description', async ({ query, cookies, params }) => {
    if (!await requireAdmin(cookies, query)) return AUTH_ERR;

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
    if (!await requireAdmin(cookies, query)) return AUTH_ERR;

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
    if (!await requireAdmin(cookies, query)) return AUTH_ERR;

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
    if (!await requireAdmin(cookies, query)) return AUTH_ERR;

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
