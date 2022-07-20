import type { IncomingMessage, ServerResponse } from "http";

export interface IHandlerArgs {
    url: string;
    res: ServerResponse;
    req: IncomingMessage;
    params: Record<string, string>;
    positionParams: string[];
}

export type Handler = (args: IHandlerArgs) => Promise<Record<any, any> | undefined>;

export class Route {
    private readonly components: string[] = [];
    private readonly handler?: Handler;

    constructor (path: string, handler: Handler) {
        this.components = path.split('/');
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

        const components = (path || '').split('/');

        if (components.length !== this.components.length) {
            return false;
        }
        for (let i = 0; i < components.length; i++) {
            // path matches exactly
            if (components[i] === this.components[i]) {
                continue;
            }
            // path component is dynamic
            if (this.components[i][0] === ':') {
                continue;
            }
            if (this.components[i] === '*') {
                continue;
            }
            // ** means anything after matches
            return this.components[i] === '**';

        }
        return true;
    }

    public getParams (path?: string): [ Record<any, any>, string[] ] {
        const components = (path || '').split('/');

        const params: Record<any, any> = {};
        const posParams: string[] = [];

        for (let i = 0; i < components.length; i++) {
            if (this.components[i][0] === ':') {
                params[this.components[i].substr(1)] = components[i];

            } else if (this.components[i] === '*') {
                posParams.push(components[i]);

            } else if (this.components[i] === '**') {
                posParams.push(...components.slice(i));
            }
        }

        return [ params, posParams ];
    }

    public async handle (args: IHandlerArgs): Promise<void> {
        if (!this.handler) {
            return;
        }
        const res = await this.handler(args) ?? {};

        if (typeof res !== 'object') {
            args.res.statusCode = 500;
            args.res.end('Internal Server Error');
        }

        if (res.error) {
            args.res.statusCode = 500;
            args.res.end(res.error);
        }

        args.res.end(JSON.stringify(res));
    }
}
