import route from "../";
import { AUTH_ERR, COOKIE_CODE_KEY, idFromCode, requireAdmin } from "../util";


route('get/house-points/with-id/:id', async ({ query, params, cookies }) => {
    const { id: rawID } = params;
    const id = parseInt(rawID);

    if (isNaN(id)) return `ID '${rawID}' is not a integer`;

    if (!await requireAdmin(cookies, query)) {
        const res = await query`
            SELECT users.code
            FROM housepoints, users
            WHERE housepoints.id = ${id}
              AND housepoints.student = users.id
        `;

        // doesn't get to know if house point even exists or not
        if (!res.length) return AUTH_ERR;
        if (res[0]['code'] !== cookies[COOKIE_CODE_KEY]) return AUTH_ERR;
    }

    const res = await query`
        SELECT 
            users.name as student, 
            users.year as studentYear, 
            housepoints.quantity as quantity, 
            housepoints.event as eventID, 
            housepoints.description as description,
            UNIX_TIMESTAMP(housepoints.created) as created,
            UNIX_TIMESTAMP(housepoints.completed) as completed,
            housepoints.status,
            housepoints.rejectMessage
        FROM housepoints, users
        WHERE housepoints.id = ${id}
          AND housepoints.student = users.id
    `;
    if (!res.length) return {
        status: 406,
        error: `No house point found with ID '${id}'`
    }

    return res[0];
});


route('get/house-points/with-status/:status', async ({ query, cookies, params: { status} }) => {
    if (!await requireAdmin(cookies, query)) return AUTH_ERR;

    return { data: await query`
        SELECT
            housepoints.id as id,
            users.name as student,
            users.year as studentYear,
            housepoints.quantity as quantity,
            housepoints.event as eventID,
            housepoints.description as description,
            UNIX_TIMESTAMP(housepoints.created) as created,
            UNIX_TIMESTAMP(housepoints.completed) as completed,
            housepoints.status,
            housepoints.rejectMessage
        FROM housepoints, users
        WHERE
            housepoints.status = ${status} AND
            housepoints.student = users.id
        ORDER BY completed, created DESC
    `};
});


route('get/house-points/all', async ({ query, cookies }) => {
    if (!await requireAdmin(cookies, query)) return AUTH_ERR;

    return { data: await query`
        SELECT
            housepoints.id as id,
            users.name as student,
            users.year as studentYear,
            housepoints.quantity as quantity,
            housepoints.event as eventID,
            housepoints.description as description,
            UNIX_TIMESTAMP(housepoints.created) as created,
            UNIX_TIMESTAMP(housepoints.completed) as completed,
            housepoints.status,
            housepoints.rejectMessage
        FROM housepoints, users
        WHERE housepoints.student = users.id
        ORDER BY completed, created DESC
    `};
});

route('get/house-points/earned-by/:code', async ({ query, params: { code } }) => {
    return { data: await query`
        SELECT
            housepoints.id as id,
            users.name as student,
            users.year as studentYear,
            housepoints.quantity as quantity,
            housepoints.event as eventID,
            housepoints.description as description,
            UNIX_TIMESTAMP(housepoints.created) as created,
            UNIX_TIMESTAMP(housepoints.completed) as completed,
            housepoints.status,
            housepoints.rejectMessage
        FROM housepoints, users
        WHERE housepoints.student = users.id
            AND users.code = ${code}
        ORDER BY completed, created DESC
    `};
});


route(
    'create/house-points/give/:user/:quantity/:description?event',
async ({ query, cookies, params }) => {
    if (!await requireAdmin(cookies, query)) return AUTH_ERR;

    const { user, description, event: rawEvent, quantity: rawQuantity } = params;

    let quantity = parseInt(rawQuantity);
    if (isNaN(quantity) || !quantity) {
        return 'Quantity must be an integer';
    }
    if (quantity < 1) {
        return 'Quantity must be at least 1';
    }

    let event: number | null = parseInt(rawEvent);
    if (isNaN(event) || !event) event = null;

    const id = await idFromCode(query, user);
    if (typeof id === 'string') return id;

    await query`
        INSERT INTO housepoints (student, quantity, event, description, status, completed)
        VALUES (
            ${id},
            ${quantity},
            ${event},
            ${description},
            'Accepted',
            CURRENT_TIMESTAMP
        )
    `;

    return { status: 201 };
});


route(
    'create/house-points/request/:user/:quantity/:description?event',
async ({ query, params }) => {
    const { user, description, event: rawEvent, quantity: rawQuantity } = params;

    let quantity = parseInt(rawQuantity);
    if (isNaN(quantity) || !quantity) {
        return 'Quantity must be an integer';
    }
    if (quantity < 1) {
        return 'Quantity must be at least 1';
    }

    let event: number | null = parseInt(rawEvent);
    if (isNaN(event) || !event) event = null;

    const id = await idFromCode(query, user);
    if (typeof id === 'string') return id;

    await query`
        INSERT INTO housepoints (student, quantity, event, description, status, completed)
        VALUES (
            ${id},
            ${quantity},
            ${event},
            ${description},
            'Pending',
            CURRENT_TIMESTAMP
        )
    `;

    return { status: 201 };
});


route(
    'update/house-points/accepted/:id?reject',
async ({ query, cookies, params }) => {
    if (!await requireAdmin(cookies, query)) return AUTH_ERR;

    const { id: rawID, reject } = params;

    const id = parseInt(rawID);
    if (isNaN(id) || !id) return `Invalid house point ID '${rawID}', must be an integer`;

    if (!(await query`SELECT * FROM housepoints WHERE id = ${id}`).length) {
        return {
            status: 406,
            error: `No house point found with ID '${id}'`
        };
    }

    if (reject) {
        await query`
            UPDATE housepoints 
            SET 
                rejectMessage = ${reject},
                completed = CURRENT_TIMESTAMP,
                status='Rejected' 
            WHERE id = ${id}
        `;
    } else {
        await query`
            UPDATE housepoints 
            SET 
                completed = CURRENT_TIMESTAMP,
                status='Accepted' 
            WHERE id = ${id}
        `;
    }

    return { status: 200 };
});


route('delete/house-points/with-id/:id', async ({ query, cookies, params }) => {
    const { id: rawID } = params;
    const id = parseInt(rawID);
    if (isNaN(id)) return `Invalid house point ID '${rawID}', must be a integer`;

    // if we aren't an admin user, we can still delete it if
    // they own the house point
    if (!await requireAdmin(cookies, query)) {
        const res = await query`
            SELECT users.code
            FROM housepoints, users
            WHERE housepoints.id = ${id}
              AND housepoints.student = users.id
        `;

        // doesn't get to know if house point even exists or not
        if (!res.length) return AUTH_ERR;
        if (res[0]['code'] !== cookies[COOKIE_CODE_KEY]) {
            return AUTH_ERR;
        }
    }

    const res = await query`DELETE FROM housepoints WHERE id = ${id}`;
    if (!res.affectedRows) return {
        status: 406,
        error: `No house points to delete with ID '${id}'`
    }
});
