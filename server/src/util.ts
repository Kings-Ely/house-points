import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { v4 as UUIDv4 } from 'uuid';

import { Cookies } from './route';
import { queryFunc } from './sql';
import crypto from "crypto";

/**
 * Gets the session ID from the cookies using the given cookies object
 * and the COOKIE_SESSION_KEY environment variable.
 */
export function getSessionID (cookies: Cookies): string {
    return cookies[process.env.COOKIE_SESSION_KEY || 'sessionID'] || '';
}

/**
 * Object to return from a route if incorrect credentials were provided.
 * Frozen (immutable) and constant.
 * */
export const AUTH_ERR: Readonly<{error: string, status: number}> = Object.freeze({
    error: 'You are not authorized for this action',
    status: 401
});

/**
 * Checks to see if an object is JSON-parsable.
 * Note that this is expensive for large JSON strings
 */
export function isJson (item: unknown): boolean {
    if (typeof item !== 'string') {
        return false;
    }

    try {
        item = JSON.parse(item);
    } catch (e) {
        return false;
    }

    return item !== null;
}

/**
 * Loads env from path
 * (relative to '/server'. or more specifically, the directory containing the server JS file)
 */
export function loadEnv (filePath = ".env"): void {
    const contents = fs.readFileSync(path.join(path.resolve(__dirname), filePath), 'utf8');

    process.env = {
        ...process.env,
        ...dotenv.parse(contents)
    };
}



/**
 * Parses a string of the form "a=b;c=d" into an object
 */
export function parseCookies (cookie: string): Record<string, string> {
    const list: Record<string, any> = {};
    if (!cookie) return list;

    cookie.split(`;`).forEach(function(cookie) {
        let [ name, ...rest] = cookie.split(`=`);
        name = name?.trim();
        if (!name) return;
        const value = rest.join(`=`).trim();
        if (!value) return;
        list[name] = decodeURIComponent(value);
    });

    return list;
}

// DB query helpers

/**
 * Gets the authorisation level of a user from their code
 * 0: not signed in
 * 1: normal student
 * 2: admin
 */
export async function authLvl (sessionID: string, query: queryFunc) {
    if (!sessionID) return 0;

    const res = await query`
        SELECT users.admin
        FROM sessions, users
        WHERE sessions.id = ${sessionID}
            AND sessions.user = users.id
            AND UNIX_TIMESTAMP(sessions.opened) + sessions.expires > UNIX_TIMESTAMP()
           
    `;

    if (!res.length) return 0;

    const [ user ] = res;

    return (user?.['admin'] === 1) ? 2 : 1;
}

/**
 * True if user code is valid
 */
export async function isLoggedIn (cookies: Cookies, query: queryFunc): Promise<boolean> {
    return await authLvl(getSessionID(cookies), query) > 0;
}

/**
 * True if user code is valid and an admin
 */
export async function isAdmin (cookies: Cookies, query: queryFunc): Promise<boolean> {
    return await authLvl(getSessionID(cookies), query) >= 2;
}

/**
 * Decode URL parameter
 * @param {string} param
 */
export function decodeParam (param: string): string {
    return decodeURIComponent(param.replace(/\+/g, ' '))
}

/**
 * Generate a random UUID using UUID v4 generator.
 * Does not check for collisions at the moment, but should be fine.
 */
export async function generateUUID (): Promise<string> {
    return UUIDv4();
}

export function passwordHash (password: string) {
    const salt = crypto
        .randomBytes(16)
        .toString('base64');

    const passwordHash = crypto
        .createHash('sha256')
        .update(password + salt)
        .digest('hex');

    return [ passwordHash, salt ];
}

export function validPassword (password: string): true | string {
    if (!password) return 'No password';
    if (password.length < 5) return 'Password is too short, must be over 4 characters';
    if (password.length > 64) return 'Password is too long, must be under 64 characters';

    return true;
}

/**
 * Gets the userID from a session ID
 */
export async function IDFromSession (query: queryFunc, sessionID: string): Promise<string> {
    const res = await query`
        SELECT user
        FROM sessions
        WHERE id = ${sessionID}
        AND UNIX_TIMESTAMP(opened) + expires > UNIX_TIMESTAMP()
    `;

    if (!res.length) return '';

    return res?.[0]?.['user'] || '';
}

/**
 * Gets the user ID from a cookies object
 */
export async function userID (cookies: Cookies, query: queryFunc) {
    return IDFromSession(query, getSessionID(cookies));
}

/**
 * Gets the user details from a user ID
 */
export async function userFromID (query: queryFunc, id: string): Promise<Record<string, any> | null> {
    const res = await query`
        SELECT
            id,
            email,
            year,
            admin,
            student
        FROM users
        WHERE id = ${id}
    `;

    if (!res.length) return null;

    await addHousePointsToUser(query, res[0]);

    return res[0];
}

/**
 * Gets the user details from a session token
 */
export async function userFromSession (query: queryFunc, id: string): Promise<Record<string, any> | null> {
    const res = await query`
        SELECT
            users.id,
            users.email,
            users.year,
            users.admin,
            users.student
        FROM users, sessions
        WHERE
            sessions.user = users.id
            
            AND sessions.id = ${id}
            AND UNIX_TIMESTAMP(opened) + expires > UNIX_TIMESTAMP()
    `;

    if (!res.length) return null;

    await addHousePointsToUser(query, res[0]);

    return res[0];
}

/**
 * Adds house point details to a user
 * Adds 'housePoints', 'accepted', 'rejected', 'pending' keys to the user object.
 * Assumed admin level authentication, censor the data after if necessary.
 */
export async function addHousePointsToUser (query: queryFunc, user: any & { id: string }) {
    if (!user['id']) {
        throw new Error('User has no ID');
    }

    user['housePoints'] = await query`
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
            AND users.id = ${user['id']}
       ORDER BY created DESC
    `;

    // add the quick count stats
    user['accepted'] ??= user['housePoints']
        .reduce((acc: number, hp: any) => acc + (hp['status'] === 'Accepted' ? hp['quantity'] : 0), 0);

    user['pending'] ??= user['housePoints']
        .reduce((acc: number, hp: any) => acc + (hp['status'] === 'Pending' ? hp['quantity'] : 0), 0);

    user['rejected'] ??= user['housePoints']
        .reduce((acc: number, hp: any) => acc + (hp['status'] === 'Rejected' ? hp['quantity'] : 0), 0);

    // user passed by reference as it's an object so don't need to return anything
}