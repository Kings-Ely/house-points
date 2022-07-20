import type { IncomingMessage, ServerResponse } from "http";
import type { queryFunc } from "./sql";
import log from "./log";

export interface IHandlerArgs {
    url: string;
    res: ServerResponse;
    req: IncomingMessage;
    params: Record<string, string>;
    query: queryFunc;
}

export type Handler = (args: IHandlerArgs) => Promise<Record<any, any> | undefined>;

function componentsFromPath(path?: string): string[] {
    return (path || '').split('/').filter(Boolean);
}

export class Route {
    private readonly components: string[] = [];
    private readonly handler?: Handler;

    constructor (path: string, handler: Handler) {
        this.components = componentsFromPath(path);
        this.handler = handler;

        // check the path structure is valid
        for (let i = 0; i < this.components.length; i++) {
            if (this.components[i] === '**') {
                if (i !== this.components.length - 1) {
                    throw `Invalid route '${path}': '**' must be last component`;
                }
            }
        }
    }

    public matches (path?: string): boolean {

        const components = componentsFromPath(path);

        let len = components.length;

        if (len !== this.components.length) {
            return false;
        }

        for (let i = 0; i < len; i++) {
            // path matches exactly
            if (components[i] === this.components[i]) {
                continue;
            }
            // path component is dynamic
            if (this.components[i][0] === ':') {
                continue;
            }

            return false;
        }

        log`path '${path}' matched with route '${this.components.join('/')}'`;

        return true;
    }

    public getParams (path?: string): Record<any, any> {
        const components = componentsFromPath(path);

        const params: Record<any, any> = {};

        for (let i = 0; i < this.components.length; i++) {
            // check for dynamic component of path
            if (this.components[i][0] === ':') {
                params[this.components[i].substr(1)] = components[i] || '';
            }
        }

        return params;
    }

    public async handle (args: IHandlerArgs): Promise<string> {
        if (!this.handler) {
            args.res.statusCode = 404;
            return '';
        }
        const res = await this.handler(args) ?? {};

        if (typeof res !== 'object') {
            args.res.statusCode = 500;
            args.res.end('Internal Server Error');
            return '';
        }

        if (res.error) {
            args.res.statusCode = 500;
            args.res.end(res.error);
        }
        return JSON.stringify(res);
    }
}
