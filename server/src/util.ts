import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { v4 as UUIDv4 } from 'uuid';
import { Cookies } from './route';

import { queryFunc } from './sql';


/**
 * Gets the session ID from the cookies using the given cookies object
 * and the COOKIE_SESSION_KEY environment variable.
 */
export function getSessionID (cookies: Cookies): string {
    return cookies[process.env.COOKIE_SESSION_KEY || 'sessionID'] || '';
}

export const AUTH_ERR = Object.freeze({
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
export async function requireLoggedIn (cookies: Cookies, query: queryFunc): Promise<boolean> {
    return await authLvl(getSessionID(cookies), query) > 0;
}

/**
 * True if user code is valid and an admin
 */
export async function requireAdmin (cookies: Cookies, query: queryFunc): Promise<boolean> {
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

export async function IDFromSession (query: queryFunc, sessionID: string): Promise<string | null> {
    const res = await query`
        SELECT user
        FROM sessions
        WHERE id = ${sessionID}
        AND UNIX_TIMESTAMP(opened) + expires > UNIX_TIMESTAMP()
    `;

    if (!res.length) return null;

    return res?.[0]?.['user'] || null;
}

export async function userID (cookies: Cookies, query: queryFunc) {
    return IDFromSession(query, getSessionID(cookies));
}

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

    return res[0];
}

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

    return res[0];
}