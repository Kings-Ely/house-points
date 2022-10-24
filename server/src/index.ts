import http, { IncomingMessage, ServerResponse } from 'http';
import commandLineArgs from 'command-line-args';
import c from 'chalk';
import connectSQL  from './sql';
import log, { LogLvl, setupLogger } from './log';
import { loadEnv } from './util';
import requestHandler, { Handler } from './requestHandler';

export interface IFlags {
    logLevel: number;
    dbLogLevel: number;
    logTo: string;
    port: number;
    env: string;
}

export const flags = {
    logLevel: LogLvl.INFO,
    dbLogLevel: LogLvl.WARN,
    port: 0,
    env: '.env',
    ...commandLineArgs([
        { name: 'logLevel', type: Number },
        { name: 'dbLogLevel', type: Number },
        { name: 'logTo', type: String },
        { name: 'port', alias: 'p', type: Number },
        { name: 'env', type: String },
    ]),
};

/**
 * Handlers for the api routes
 */
const handlers: Record<string, Handler> = {};

/**
 * Define a route that the server will respond to.
 */
export default function route(path: string, handler: Handler) {
    log.verbose(`Adding route: ${path}`);
    try {
        handlers[path] = handler;
    } catch (e) {
        log.error`Error adding handler ${path}: ${e}`;
    }
}

import './routes/users';
import './routes/server';
import './routes/house-points';
import './routes/events';
import './routes/session';
import './routes/award-types';
import './routes/awards';
import './routes/backups';

function startServer() {
    
    const [ dbCon, query ] = connectSQL();
    
    log.verbose`Connected to database on server start ${typeof dbCon} ${typeof query}`;
    
    log.setupQuery(query);
    
    let options = {};

    let port: number | string | undefined = process.env.PORT;

    if (flags.port) {
        port = flags.port;
    }

    if (!port) {
        log.error`No port specified in .env or command line`;
        return;
    }

    let server: http.Server;

    async function handle(req: IncomingMessage, res: ServerResponse) {
        log.verbose`Handling [${req.method}] ${req.url}`;
        if (!query) {
            log.error`No query function available`;
            res.statusCode = 503;
            return res.end(
                JSON.stringify({
                    status: 503,
                    error: 'Waiting for server to start...',
                })
            );
        }
        await requestHandler(req, res, query, dbCon, handlers);
    }

    server = http.createServer(options, handle).listen(port, () => {
        log.log(c.green(`Dev server started on port ${port}`));
    });
    
    process.on('SIGTERM', () => {
        server.close(async () => {
            log.log`Server stopped, stopping process...`;
            await log.close();
            process.exit(1);
        });
    });
}


(async () => {
    log.verbose`Loading ENV variables`;
    loadEnv(flags.env);
    log.verbose`Setting up logger`;
    setupLogger(flags as IFlags);
    log.verbose`Starting server`;
    startServer();
})();
