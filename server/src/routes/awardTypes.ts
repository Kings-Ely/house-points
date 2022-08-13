import route from "../";
import { AUTH_ERR, generateUUID, isAdmin, isLoggedIn } from '../util';
import mysql from "mysql2";

/**
 * @account
 * No options as you always want all of them
 */
route('get/award-types', async ({ query, body }) => {
    if (!await isLoggedIn(body, query)) return AUTH_ERR;

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
 * @param name
 * @param required
 * @param description
 */
route('create/award-types', async ({ query, body }) => {
    if (!await isAdmin(body, query)) return AUTH_ERR;

    const { name='', required='', description='' } = body;
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
 * @param id
 * @param newName
 */
route('update/award-types/name', async ({ query, body }) => {
    if (!await isAdmin(body, query)) return AUTH_ERR;

    const { id='', newName='' } = body;

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
 * @param id
 * @param {int} newQuantity
 */
route('update/award-types/hps-required', async ({ query, body }) => {
    if (!await isAdmin(body, query)) return AUTH_ERR;

    const { id='', newQuantity='' } = body;

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
 * @param id
 * @param newDescription
 */
route('update/award-types/description', async ({ query, body }) => {
    if (!await isAdmin(body, query)) return AUTH_ERR;

    const { id='', newDescription='' } = body;

    if (!id) return 'Missing parameter id';
    if (!newDescription) return 'Missing parameter newDescription';

    const queryRes = await query<mysql.OkPacket>`
        UPDATE awardTypes
        SET description = ${newDescription}
        WHERE id = ${id}
    `;

    if (queryRes.affectedRows === 0) return 'Award type not found with that ID';
});

/**
 * @admin
 * @param id
 */
route('delete/award-types', async ({ query, body }) => {
    if (!await isAdmin(body, query)) return AUTH_ERR;

    const { id='' } = body;

    if (!id) return 'Missing parameter id';

    const queryRes = await query<mysql.OkPacket>`
        DELETE FROM awardTypes
        WHERE id = ${id}
    `;

    if (queryRes.affectedRows === 0) return 'Award type not found';
});