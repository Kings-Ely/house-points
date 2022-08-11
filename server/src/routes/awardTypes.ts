import route from "../";
import { AUTH_ERR, generateUUID, getSessionID, isAdmin, isLoggedIn, userFromSession } from '../util';
import mysql from "mysql2";
import * as notifications from "../notifications";

/**
 * @account
 * No options as you always want all of them
 */
route('get/award-types', async ({ query, cookies }) => {
    if (!await isLoggedIn(cookies, query)) return AUTH_ERR;

    return {
        data: await query`
            SELECT
                id,
                name,
                description,
                hpsRequired
            FROM awardTypes
        `
    };
});


/**
 * @admin
 *
 */
route('create/award-types/:name/:required?description', async ({ query, params, cookies }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;


    const { name, required, description='' } = params;
    const hpsRequired = parseInt(required);

    if (!name) return 'Missing parameter name';
    if (isNaN(hpsRequired)) return 'Invalid house point requirement';

    const id = await generateUUID();

    await query`
        INSERT INTO awardTypes (
            id,
            name,
            description,
            hpsRequired
        ) VALUES (
            ${id},
            ${name},
            ${description},
            ${hpsRequired}
        )
    `;

    return {
        id,
        status: 201
    };
});

/**
 * @admin
 */
route('delete/award-types/with-id/:id', async ({ query, params, cookies }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    const { id } = params;

    if (!id) return 'Missing parameter id';

    const queryRes = await query<mysql.OkPacket>`
        DELETE FROM awardTypes
        WHERE id = ${id}
    `;

    if (queryRes.affectedRows === 0) return 'Award type not found';
});


/**
 * @admin
 */
route('update/award-types/name/:id/:newName', async ({ query, cookies, params }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    const { id, newName } = params;

    if (!id) return 'Missing parameter id';
    if (!newName) return 'Missing parameter newName';

    const queryRes = await query<mysql.OkPacket>`
        UPDATE awardTypes
        SET name = ${newName}
        WHERE id = ${id}
    `;

    if (queryRes.affectedRows === 0) return 'Award type not found with that ID';
});

/**
 * @admin
 */
route('update/award-types/hps-required/:id/:newQuantity', async ({ query, cookies, params }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    const { id, newQuantity } = params;

    const quantity = parseInt(newQuantity);

    if (!id) return 'Missing parameter id';
    if (isNaN(quantity)) return 'Invalid quantity';

    const queryRes = await query<mysql.OkPacket>`
        UPDATE awardTypes
        SET hpsRequired = ${quantity}
        WHERE id = ${id}
    `;

    if (queryRes.affectedRows === 0) return 'Award type not found with that ID';
});


/**
 * @admin
 */
route('update/award-types/description/:id/:newDescription', async ({ query, cookies, params }) => {
    if (!await isAdmin(cookies, query)) return AUTH_ERR;

    const { id, newDescription } = params;

    if (!id) return 'Missing parameter id';
    if (!newDescription) return 'Missing parameter newDescription';

    const queryRes = await query<mysql.OkPacket>`
        UPDATE awardTypes
        SET description = ${newDescription}
        WHERE id = ${id}
    `;

    if (queryRes.affectedRows === 0) return 'Award type not found with that ID';
});