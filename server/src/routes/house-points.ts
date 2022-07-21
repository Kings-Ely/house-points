import route from "../";
import { AUTH_ERR, authLvl, idFromCodeOrID, makeCode, requireAuth } from "../util";
import log from "../log";
import {red} from "chalk";


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
    if (!data.length) return `No house point found with ID ${id}`;
    return data[0];
});


route('get/house-points/pending', async ({ query, cookies }) => {
    if (!await requireAuth(cookies, query)) return AUTH_ERR;

    return await query`
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
    `;
});


route('change/house-points/accepted/:id?reject', async ({ query, cookies, params }) => {
    if (!await requireAuth(cookies, query)) return AUTH_ERR;

    const { id: rawID, reject } = params;

    const id = parseInt(rawID);
    if (isNaN(id)) return `Invalid house point ID '${rawID}', must be a number`;

    if (!(await query`SELECT * FROM housepoints WHERE id = ${id}`).length) {
        return `No house point found with ID '${id}'`;
    }

    await query`UPDATE housepoints SET completed = CURRENT_TIMESTAMP, status='Accepted' WHERE id = ${id}`;

    if (reject) {
        await query`UPDATE housepoints SET rejectMessage = ${reject}, status='Rejected' WHERE id = ${id}`;
    }
});
