import type { IncomingMessage, ServerResponse } from "http";

import type { queryFunc } from "./sql";
import Path from "./path";

export interface IHandlerArgs {
    url: string;
    res: ServerResponse;
    req: IncomingMessage;
    params: Record<string, string>;
    query: queryFunc;
}

export type Handler = (args: IHandlerArgs) => Promise<Record<any, any> | undefined | void | null>;

export class Route {
    private readonly path: Path;
    private readonly handler?: Handler;

    constructor (path: string, handler: Handler) {
        let pathOrError = Path.parse(path);
        if (typeof pathOrError === 'string') {
            throw new Error(pathOrError);
        }
        this.path = pathOrError;
        this.handler = handler;
    }

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

    public getParams (rawPath?: string): Record<any, any> {
        const path = Path.parse(rawPath);
        if (typeof path === 'string') {
            return {};
        }

        const params: Record<any, any> = {};

        for (let i = 0; i < this.path.components.length; i++) {
            // check for dynamic component of path
            if (this.path.components[i][0] === ':') {
                params[this.path.components[i].substr(1)] = path.components[i] || '';
            }
        }

        for (let param of this.path.params) {
            const defaultValue = this.path.paramDict[param] || '';
            params[param] = path.paramDict[param] || defaultValue;
        }

        return params;
    }

    public async handle (args: IHandlerArgs): Promise<string> {
        if (!this.handler) {
            args.res.writeHead(404);
            return '';
        }

        let res = await this.handler(args) ?? {};

        if (typeof res !== 'object') {
            res = {
                error: 'Handler returned non-object',
                value: res
            };
        }

        if (res.error) {
            args.res.writeHead(500);
        }

        return JSON.stringify(res);
    }
}
