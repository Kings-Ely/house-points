import route from "../";
import { AUTH_ERR, generateUUId, isAdmin, isLoggedIn, userFromId, userFromSession } from "../util";
import * as notifications from "../notifications";
import mysql from "mysql2";

/**
 * @account
 * Single route for getting house points with some filters
 */
/**
 * @account
 * Gets all house points and filters them based on the parameters
 *
 * @param {string} awardId - house points with this Id
 * @param {string} userId - house points with a user=userId
 * @param {13 >= number >= 9} yearGroup - house points earned by a student in this year group
 * @param {'Accepted'|'Pending'|'Rejected'} status - house points with this status
 * @param {number} from - house points created after this timestamp
 * @param {number} to - house points created before this timestamp
 */
route('get/awards', async ({ query, body }) => {
    if (!await isLoggedIn(body, query)) return AUTH_ERR;

    let { awardId='', userId='', yearGroup=0, from=0, to=0 } = body;

    if (!Number.isInteger(yearGroup) || yearGroup > 13 || yearGroup < 9) {
        if (yearGroup !== 0) return 'Invalid year group';
    }
    if (!Number.isInteger(from)) {
        return 'Invalid from';
    }
    if (!Number.isInteger(to)) {
        return 'Invalid to';
    }

    const res = await query`
        SELECT
            awards.id,
            awards.description,
            UNIX_TIMESTAMP(awards.awarded) as awarded,
            
            users.id as userId,
            users.email as studentEmail,
            users.year as studentYear,
            
            awardTypes.name as awardName,
            awardTypes.description as awardDescription,
            awardTypes.hpsRequired as awardHpsRequired
            
        FROM users, awards, awardTypes
        
        WHERE
            awards.student = users.id
            AND awards.type = awardTypes.id
            
            AND ((awards.id = ${awardId})    OR ${!awardId})
            AND ((users.id = ${userId})      OR ${!userId})
            AND ((users.year = ${yearGroup}) OR ${!yearGroup})
            AND ((awarded >= ${from})        OR ${!from})
            
        ORDER BY awarded DESC
    `;

    // either require admin or the house point to belong to the user
    if (!await isAdmin(body, query)) {
        const user = await userFromSession(query, body.session);
        if (!user) return AUTH_ERR;
        if (!user['id']) return AUTH_ERR;

        for (let i = 0; i < res.length; i++) {
            if (res[i]['userId'] === user['id']) {
                continue;
            }

            // if the house point does not belong to the user, censor it
            delete res[i]['userId'];
            delete res[i]['studentEmail'];
            delete res[i]['description'];
        }
    }

    return { data: res };
});

/**
 * @admin
 * @notification
 * Gives a house point to the student with that userId
 *
 * @param {string} description - description of house point
 * @param {string} eventId - id of event house points should be associated with
 * @param awardTypeId
 */
route('create/awards', async ({ query, body }) => {
    if (!await isAdmin(body, query)) return AUTH_ERR;

    const { userId, description='', awardTypeId } = body;

    let student = await userFromId(query, userId);
    if (!student) return `Student with Id '${userId}' not found`;
    if (!student['student']) return 'Can only give house points to students';

    if (!awardTypeId) return 'Missing parameter awardTypeId';

    let awardsData = await query`
        SELECT *
        FROM awardTypes
        WHERE id = ${awardTypeId}
    `;
    if (!awardsData.length) {
        return `Award type with that Id not found`;
    }

    awardsData = await query`
        SELECT *
        FROM users, housepoints, events
        WHERE users.id = housepoints.student
            AND housepoints.event = events.id
            AND users.id = ${userId}
            AND events.id = ${awardTypeId}
    `;
    if (awardsData.length > 0) {
        return `Student already in event`;
    }

    const id = await generateUUId();

    await query`
        INSERT INTO awards (id, student, type, description)
        VALUES (
            ${id},
            ${userId},
            ${awardTypeId},
            ${description}
        )
    `;

    return { status: 201, id };
});

/**
 * @admin
 * Updates the description of an award
 *
 * @param awardId
 * @param {int} description new description
 */
route('update/awards/description', async ({ query, body }) => {
    if (!await isAdmin(body, query)) return AUTH_ERR;

    const { awardId: id='', description='' } = body;

    const queryRes = await query<mysql.OkPacket>`
        UPDATE housepoints
        SET description = ${description}
        WHERE id = ${id}
    `;

    if (!queryRes.affectedRows) return {
        status: 406,
        error: `No house point found with Id '${id}'`
    };
});