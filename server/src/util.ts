import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { queryFunc } from "./sql";
import { Cookies } from "./route";
import log from "./log";

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
    const cookies: Record<string, string> = {};

    cookie.split(';').forEach(pair => {
        const [key, value] = pair.split('=');
        cookies[key] = value;
    });

    return cookies;
}

// DB query helpers

export async function authLvl (code: string, query: queryFunc) {
    if (!code) return 0;

    const level = await query`SELECT admin FROM users WHERE code = ${code.toLowerCase()}`;

    if (!level.length) return 0 ;

    const auth = level[0]['admin'] === 1;

    return auth ? 2 : 1;
}


export async function requireAuth (cookies: Cookies, query: queryFunc): Promise<boolean> {
    return await authLvl(cookies['code'], query) === 2;
}


/**
 * Returns a string for an error, otherwise a number which is the user's id
 */
export async function idFromCodeOrID (query: queryFunc, rawID?: string | number, rawCode?: string): Promise<number | string> {

    if (typeof rawID === 'number') {
        return rawID;
    }

    let id: number = parseInt(rawID || '');

    if (!id) {
        const res = await query`SELECT id FROM users WHERE code = ${rawCode || ''}`;
        if (!res.length) {
            return `User not found with code '${rawCode}'`
        }
        id = res[0]['id'];
    }

    if (isNaN(id) || id < 100) return `Invalid user ID '${id}'`;

    return id;
}
