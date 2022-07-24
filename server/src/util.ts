import fs from "fs";
import path from "path";
import dotenv from "dotenv";

import { queryFunc } from "./sql";
import { Cookies } from "./route";

export const AUTH_ERR = Object.freeze({
    error: 'You are not authorized for this action',
    status: 401
});

// overridden with .env variable if present
export let COOKIE_CODE_KEY = 'myCode';

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

    if (process.env.COOKIE_CODE_KEY) {
        COOKIE_CODE_KEY = process.env.COOKIE_CODE_KEY;
    }
}


/**
 * Generates a random string of a given length from a given character set
 */
export function makeCode (length: number, chars='abcdefghijklmnopqrstuvwxyz'): string {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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
 */
export async function authLvl (code: string, query: queryFunc) {
    if (!code) return 0;

    const level = await query`SELECT admin FROM users WHERE code = ${code.toLowerCase()}`;

    if (!level.length) return 0;

    const auth = level[0]['admin'] === 1;

    return auth ? 2 : 1;
}

/**
 * True if user code is valid
 */
export async function requireLoggedIn (cookies: Cookies, query: queryFunc): Promise<boolean> {
    return await authLvl(cookies[COOKIE_CODE_KEY], query) > 0;
}

/**
 * True if user code is valid and an admin
 */
export async function requireAdmin (cookies: Cookies, query: queryFunc): Promise<boolean> {
    return await authLvl(cookies[COOKIE_CODE_KEY], query) === 2;
}

/**
 * Returns a string for an error, otherwise a number which is the user's id
 */
export async function idFromCode (query: queryFunc, rawCode?: string): Promise<number | string> {


    const res = await query`SELECT id FROM users WHERE code = ${rawCode || ''}`;
    if (!res.length) {
        return `User not found with code '${rawCode}'`
    }
    const id = res[0]['id'];

    if (isNaN(id) || id < 100) return `Invalid user ID '${id}'`;

    return id;
}


/**
 * Decode URL parameter
 * @param {string} param
 */
export function decodeParam (param: string): string {
    return decodeURIComponent(param.replace(/\+/g, ' '))
}
