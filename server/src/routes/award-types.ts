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

    const { name='', required=-1, description='' } = body;

    if (!name) return 'Missing parameter name';
    if (!Number.isInteger(required) || required < 0) {
        return 'Invalid house point requirement';
    }

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
            ${required}
        )
    `;

    return {
        id,
        status: 201
    };
});


/**
 * @admin
 * @param awardTypeID
 * @param newName
 */
route('update/award-types/name', async ({ query, body }) => {
    if (!await isAdmin(body, query)) return AUTH_ERR;

    const { awardTypeID: id='', name='' } = body;

    if (!id) return 'Missing parameter id';
    if (!name) return 'Missing parameter name';

    const queryRes = await query<mysql.OkPacket>`
        UPDATE awardTypes
        SET name = ${name}
        WHERE id = ${id}
    `;

    if (queryRes.affectedRows === 0) return {
        status: 406,
        error: `No Award Types to delete with that ID`
    }
});

/**
 * @admin
 * @param awardTypeID
 * @param {int} newQuantity
 */
route('update/award-types/hps-required', async ({ query, body }) => {
    if (!await isAdmin(body, query)) return AUTH_ERR;

    const { awardTypeID:id='', quantity=-1 } = body;

    if (!id) return 'Missing parameter id';
    if (!Number.isInteger(quantity) || quantity < 0) {
        return 'Invalid house point requirement';
    }

    const queryRes = await query<mysql.OkPacket>`
        UPDATE awardTypes
        SET hpsRequired = ${quantity}
        WHERE id = ${id}
    `;

    if (queryRes.affectedRows === 0) return {
        status: 406,
        error: `No Award Types found that ID`
    }
});


/**
 * @admin
 * @param awardTypeID
 * @param newDescription
 */
route('update/award-types/description', async ({ query, body }) => {
    if (!await isAdmin(body, query)) return AUTH_ERR;

    const { awardTypeID: id ='', description='' } = body;

    if (!id) return 'Missing parameter id';
    if (!description) return 'Missing parameter description';

    const queryRes = await query<mysql.OkPacket>`
        UPDATE awardTypes
        SET description = ${description}
        WHERE id = ${id}
    `;

    if (queryRes.affectedRows === 0) return {
        status: 406,
        error: `No Award Types to delete with that ID`
    }
});

/**
 * @admin
 * @param awardTypeID
 */
route('delete/award-types', async ({ query, body }) => {
    if (!await isAdmin(body, query)) return AUTH_ERR;

    if (!body.awardTypeID) return 'Missing parameter id';

    const queryRes = await query<mysql.OkPacket>`
        DELETE FROM awardTypes
        WHERE id = ${body.awardTypeID}
    `;

    if (queryRes.affectedRows === 0) return {
        status: 406,
        error: `No Award Types to delete with that ID`
    };
});