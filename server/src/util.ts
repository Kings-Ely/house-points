import fs from "fs";
import path from "path";
import dotenv from "dotenv";

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
