import type { IncomingMessage, ServerResponse } from "http";

import type { queryFunc } from "./sql";
import Path from "./path";
import log, { warning } from "./log";
import {AUTH_ERR} from "./util";

export interface IHandlerArgs {
    url: string;
    res: ServerResponse;
    req: IncomingMessage;
    params: Record<string, string>;
    query: queryFunc;
    cookies: Cookies;
}

export type Cookies = Record<string, string>;

export type Handler = (args: IHandlerArgs) => Promise<
    Record<any, any>
    | undefined
    | void
    | null
    | string
>;

export interface IJSONResponse {
    status: number;
    ok: boolean;
    error?: string;
}

export class Route {
    private readonly path: Path;
    private readonly handler: Handler;

    constructor (path: string, handler: Handler) {
        let pathOrError = Path.parse(path);
        if (typeof pathOrError === 'string') {
            throw new Error(pathOrError);
        }
        this.path = pathOrError;
        this.handler = handler;
    }

    /**
     * Checks that the given path has the same structure as this route's path
     */
    public matches (rawPath?: string): boolean {

        const path = Path.parse(rawPath);
        if (typeof path === 'string') {
            return false;
        }

        for (let i = 0; i < this.path.components.length; i++) {
            // path matches exactly
            if (path.components[i] === this.path.components[i]) {
                continue;
            }
            // path component is dynamic
            if (this.path.components[i][0] === ':') {
                continue;
            }

            return false;
        }

        return true;
    }

    /**
     * Returns a map of parameters from a given path, based on this route's path
     */
    public getParams (rawPath?: string): Record<any, any> {
        const path = Path.parse(rawPath);
        if (typeof path === 'string') {
            warning`Path parse error: ${path}`;
            return {};
        }

        const params: Record<any, any> = {};

        for (let i = 0; i < this.path.components.length; i++) {
            // check for dynamic component of path
            if (this.path.components[i][0] === ':') {
                params[this.path.components[i].substring(1)] = path.components[i] || '';
            }
        }

        for (let param of this.path.params) {
            const defaultValue = this.path.paramDict[param] || '';
            params[param] = path.paramDict[param] || defaultValue;
        }

        return params;
    }

    /**
     * Runs this route's handler and returns an object
     */
    public async handle (args: IHandlerArgs): Promise<IJSONResponse & Record<any, any>> {
        let res = await this.handler(args);

        if (typeof res === 'string') {
            res = { error: res };
        }

        res ||= {};

        if (Array.isArray(res)) {
            res = { error: 'Arrays not allowed from handlers' };
        }

        if (typeof res !== 'object') {
            res = {
                error: 'Handler returned non-object',
                value: res
            };
        }

        return {
            ok: !res.error,
            status: res.error ? 500 : 200,
            ...res
        };
    }
}
