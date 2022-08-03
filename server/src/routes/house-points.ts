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

/**
 * @account
 * Gets all house points and filters them based on the parameters
 *
 * @param {string} id - house points with this ID
 * @param {string} userID - house points with a user=userID
 * @param {13 >= number >= 9} yearGroup - house points earned by a student in this year group
 * @param {'Accepted'|'Pending'|'Rejected'} status - house points with this status
 * @param {number} from - house points created after this timestamp
 * @param {number} to - house points created before this timestamp
 */
route('get/house-points?id&userID&yearGroup&status&from&to', async ({ query, params, cookies }) => {
    if (!await isLoggedIn(cookies, query)) return AUTH_ERR;

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
            
        ORDER BY created DESC
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

/**
 * @admin
 * Gives a house point to the student with that userID
 *
 * @param {string} description - description of house point
 * @param {string} event - id of event house points should be associated with
 */
route(
    'create/house-points/give/:userID/:quantity?description&event',
async ({ query, cookies, params }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    const { userID, description, event, quantity: rawQuantity } = params;

    let student = await userFromID(query, userID);
    if (!student) return `Student with ID '${userID}' not found`;
    if (!student['student']) return 'Can only give house points to students';

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

/**
 * @account
 * Creates a house points request.
 * All users can do this.
 * This house point can be GET but does not count towards any house points counts
 */
route(
    'create/house-points/request/:userID/:quantity?description&event',
async ({ query, params, cookies }) => {
    if (!await isLoggedIn(cookies, query)) return AUTH_ERR;

    const { userID, description, event, quantity: rawQuantity } = params;

    let quantity = parseInt(rawQuantity);
    if (isNaN(quantity) || !quantity) {
        return 'Quantity must be an integer';
    }
    if (quantity < 1) {
        return 'Quantity must be greater than 0';
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

/**
 * @admin
 * Updates the status of the house points.
 * You cannot change a house point fron 'Accepted' or 'Rejected' to any other status,
 * only from 'Pending'.
 * This route is the only way to change the status of a house point.
 * Takes a house point ID
 *
 * @param {string} reject - If present, rejects the house points instead of accepting it.
 *                          This is the message shown to the student for why the HP was rejected.
 */
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

/**
 * @admin
 * Updates the quantity of a house point
 */
route('update/house-points/quantity/:housePointID/:quantity', async ({ query, cookies, params }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    const { housePointID: id, quantity: rawQuantity } = params;

    const quantity = parseInt(rawQuantity);
    if (isNaN(quantity)) return 'Quantity must be an integer';
    if (quantity < 1) return 'Quantity must be greater than 0';


    const queryRes = await query`
        UPDATE housepoints
        SET quantity = ${quantity}
        WHERE id = ${id}
    `;

    if (!queryRes.affectedRows) return {
        status: 406,
        error: `No house point found with ID '${id}'`
    };
});

/**
 * @admin
 * Deletes a house point from a house point ID
 */
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
