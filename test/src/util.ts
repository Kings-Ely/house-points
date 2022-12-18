import type { API } from './index';


// TYPES

export interface IGenerateUserRes {
    password: string;
    sessionId: string;
    userId: string;
    email: string;
}


// CONSTANTS

export const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';


// FUNCTIONS

export const randomFromAlph = (len = 5): string => {
    let str = '';
    for (let i = 0; i < len; i++) {
        str += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    }
    return str;
};

/**
 * Just throws error if something goes wrong, doesn't bother to return an erroneous response.
 * If year is 0 then it makes them an admin.
 */
export async function generateUser(api: API, year = 10): Promise<IGenerateUserRes> {
    const email = `${randomFromAlph()}@example.com`;

    const password = randomFromAlph();

    let res = await api(`create/users`, {
        email,
        password,
        year,
        admin: year === 0
    });
    if (res.ok !== true || (res.status !== 200 && res.status !== 201)) {
        throw `create/users/email/password failed: ${JSON.stringify(res)}`;
    }

    res = await api(`create/sessions/from-login`, {
        email,
        password,
    });
    if (
        res.ok !== true ||
        res.status !== 200 ||
        typeof res.sessionId !== 'string' ||
        typeof res.userId !== 'string'
    ) {
        throw `create/sessions/from-login/email/password failed: ${JSON.stringify(res)}`;
    }

    return { email, password, ...res };
}
