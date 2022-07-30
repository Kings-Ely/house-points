import route from "../";
import {AUTH_ERR, generateUUID, getSessionID, requireAdmin, requireLoggedIn, userFromID, userID} from '../util';


route('get/house-points/with-id/:housePointID', async ({ query, params, cookies }) => {
    const { housePointID: id } = params;

    if (!await requireAdmin(cookies, query)) {
        const res = await query`
            SELECT users.code
            FROM housepoints, users
            WHERE housepoints.id = ${id}
              AND housepoints.student = users.id
        `;

        // doesn't get to know if house point even exists or not
        if (!res.length) return AUTH_ERR;
        if (res[0]['code'] !== getSessionID(cookies)) return AUTH_ERR;
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
            users.email as studentEmail,
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

route('get/house-points/earned-by/:userID', async ({ query, params, cookies }) => {
    if (!await requireLoggedIn(cookies, query)) return AUTH_ERR;

    const { userID: id } = params;

    return { data: await query`
        SELECT
            housepoints.id as id,
            users.email as studentEmail,
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
            AND users.id = ${id}
        ORDER BY completed, created DESC
    `};
});


route(
    'create/house-points/give/:userID/:quantity?description&event',
async ({ query, cookies, params }) => {
    if (!await requireAdmin(cookies, query)) return AUTH_ERR;

    const { userID, description, event, quantity: rawQuantity } = params;

    let student = await userFromID(query, userID);
    if (!student) return `Student with ID '${userID}' not found`;
    if (!student.student) return 'Can only give house points to students';

    let quantity = parseInt(rawQuantity);
    if (isNaN(quantity) || !quantity) {
        return 'Quantity must be an integer';
    }
    if (quantity < 1) {
        return 'Quantity must be at least 1';
    }

    await query`
        INSERT INTO housepoints (id, student, quantity, event, description, status, completed)
        VALUES (
            ${await generateUUID()},
            ${userID},
            ${quantity},
            ${event},
            ${description || ''},
            'Accepted',
            CURRENT_TIMESTAMP
        )
    `;

    return { status: 201 };
});


route(
    'create/house-points/request/:userID/:quantity?description&event',
async ({ query, params }) => {
    const { userID, description, event, quantity: rawQuantity } = params;

    let quantity = parseInt(rawQuantity);
    if (isNaN(quantity) || !quantity) {
        return 'Quantity must be an integer';
    }
    if (quantity < 1) {
        return 'Quantity must be at least 1';
    }

    let student = await userFromID(query, userID);
    if (!student) return `Student with ID '${userID}' not found`;
    if (!student.student) return 'Can only give house points to students';

    await query`
        INSERT INTO housepoints (id, student, quantity, event, description, status)
        VALUES (
            ${await generateUUID()},
            ${userID},
            ${quantity},
            ${event},
            ${description},
            'Pending'
        )
    `;

    return { status: 201 };
});


route(
    'update/house-points/accepted/:housePointID?reject',
async ({ query, cookies, params }) => {
    if (!await requireAdmin(cookies, query)) return AUTH_ERR;

    const { housePointID: id, reject } = params;

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
});


route('delete/house-points/with-id/:housePointID', async ({ query, cookies, params }) => {
    const { housePointID: id } = params;

    // if we aren't an admin user, we can still delete it if
    // they own the house point
    if (!await requireAdmin(cookies, query)) {
        if (!await requireLoggedIn(cookies, query)) return AUTH_ERR;

        const res = await query`
            SELECT users.id
            FROM housepoints, users
            WHERE housepoints.id = ${id}
              AND housepoints.student = users.id
        `;

        // doesn't get to know if house point even exists or not
        if (!res.length) return AUTH_ERR;
        if (res[0]['id'] !== await userID(cookies, query)) {
            return AUTH_ERR;
        }
    }

    const res = await query`DELETE FROM housepoints WHERE id = ${id}`;
    if (!res.affectedRows) return {
        status: 406,
        error: `No house points to delete with ID '${id}'`
    }
});
