import route from "../";
import { AUTH_ERR, idFromCodeOrID, requireAdmin } from "../util";


route('get/house-points/from-id/:id', async ({ query, params: { id: rawID} }) => {
    const id = parseInt(rawID);
    if (isNaN(id)) return "Invalid house point ID";
    const data = await query`
        SELECT 
            housepoints.id, 
            quantity, 
            event, 
            description, 
            created, 
            completed, 
            status, 
            rejectMessage,
            users.name
        FROM housepoints, users
        WHERE
            housepoints.id = ${id}
        AND users.id = housepoints.student
    `;
    if (!data.length) return {
        error: `No house point found with ID ${id}`,
        status: 406
    };
    return data[0];
});


route('get/house-points/pending', async ({ query, cookies }) => {
    if (!await requireAdmin(cookies, query)) return AUTH_ERR;

    return { data: await query`
        SELECT
            housepoints.id as hpID,
            housepoints.description,
            UNIX_TIMESTAMP(housepoints.created) as timestamp,
            users.name as studentName,
            users.code as studentCode,
            housepoints.quantity
        FROM housepoints, users
        WHERE
            housepoints.status = 'Pending' AND
            housepoints.student = users.id
        ORDER BY timestamp DESC
    `};
});


route(
    'create/house-points/give/:user/:quantity?description&event',
async ({ query, cookies, params }) => {
    if (!await requireAdmin(cookies, query)) return AUTH_ERR;

    const { user, description, event: rawEvent, rawQuantity } = params;

    let quantity = parseInt(rawQuantity);
    if (isNaN(quantity) || !quantity) quantity = 1;

    let event: number | null = parseInt(rawEvent);
    if (isNaN(event) || !event) event = null;

    const id = await idFromCodeOrID(query, '', user);
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
    'create/house-points/request/:user/:quantity?description',
async ({ query, cookies, params }) => {
    if (!await requireAdmin(cookies, query)) return AUTH_ERR;

    const { user, description, rawQuantity } = params;

    let quantity = parseInt(rawQuantity);
    if (isNaN(quantity) || !quantity) quantity = 1;

    const id = await idFromCodeOrID(query, '', user);
    if (typeof id === 'string') return id;

    await query`
        INSERT INTO housepoints (student, quantity, description)
        VALUES (${id}, ${quantity}, ${description})
    `;

    return { status: 201 };
});


route(
    'change/house-points/accepted/:id?reject',
async ({ query, cookies, params }) => {
    if (!await requireAdmin(cookies, query)) return AUTH_ERR;

    const { id: rawID, reject } = params;

    const id = parseInt(rawID);
    if (isNaN(id)) return `Invalid house point ID '${rawID}', must be a number`;

    if (!(await query`SELECT * FROM housepoints WHERE id = ${id}`).length) {
        return {
            status: 406,
            error: `No house point found with ID '${id}'`
        };
    }

    await query`UPDATE housepoints SET completed = CURRENT_TIMESTAMP, status='Accepted' WHERE id = ${id}`;

    if (reject) {
        await query`UPDATE housepoints SET rejectMessage = ${reject}, status='Rejected' WHERE id = ${id}`;
    }

    return { status: 200 };
});
