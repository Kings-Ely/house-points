import route from "../";
import {
    AUTH_ERR,
    generateUUID,
    getSessionID,
    isAdmin,
    isLoggedIn,
    userFromID,
    userFromSession,
    userID
} from '../util';


route('get/house-points?id&userID&yearGroup&status&from&to', async ({ query, params, cookies }) => {
    // Single route for getting house points with filters

    let { id, userID, yearGroup: ygRaw, status, from: fromRaw, to: toRaw } = params;

    let yearGroup = parseInt(ygRaw) || 0;
    let from = parseInt(fromRaw) || 0;
    let to = parseInt(toRaw) || 0;

    const res = await query`
        SELECT
            housepoints.id,
            housepoints.quantity,
            housepoints.description,
            housepoints.status,
            UNIX_TIMESTAMP(housepoints.created) as created,
            UNIX_TIMESTAMP(housepoints.completed) as completed,
            housepoints.rejectMessage,
            
            users.id as userID,
            users.email as studentEmail,
            users.year as studentYear,
            
            housepoints.event as eventID,
            events.name as eventName,
            events.description as eventDescription,
            UNIX_TIMESTAMP(events.time) as eventTime
            
        FROM users, housepoints
        LEFT JOIN events
        ON events.id = housepoints.event
        
        WHERE
            housepoints.student = users.id
            
            AND ((housepoints.id = ${id})         OR ${!id})
            AND ((users.id = ${userID})           OR ${!userID})
            AND ((housepoints.status = ${status}) OR ${!status})
            AND ((users.year = ${yearGroup})      OR ${!yearGroup})
            AND ((created >= ${from})             OR ${!from})
            AND ((created <= ${to})               OR ${!to})
    `;

    // either require admin or the house point to belong to the user
    if (!await isAdmin(cookies, query)) {
        const user = await userFromSession(query, getSessionID(cookies));
        if (!user) return AUTH_ERR;
        if (!user['id']) return AUTH_ERR;

        for (let i = 0; i < res.length; i++) {
            if (res[i]['userID'] === user['id']) {
                continue;
            }

            // if the house point does not belong to the user, censor it
            delete res[i]['userID'];
            delete res[i]['studentEmail'];
            delete res[i]['rejectMessage'];
            delete res[i]['description'];
        }
    }

    return { data: res };
});

route(
    'create/house-points/give/:userID/:quantity?description&event',
async ({ query, cookies, params }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

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
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

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
    if (!await isAdmin(cookies, query)) {
        if (!await isLoggedIn(cookies, query)) return AUTH_ERR;

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
