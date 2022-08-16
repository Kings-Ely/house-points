import https from "https";
import http, { IncomingMessage, ServerResponse } from "http";
import fs from "fs";
import commandLineArgs from 'command-line-args';
import c from 'chalk';
import connectSQL, { queryFunc } from './sql';
import log, { LogLvl, setupLogger } from "./log";
import { loadEnv } from "./util";
import requestHandler, { Handler } from "./requestHandler";


export interface IFlags {
    logLevel: number,
    dbLogLevel: number,
    logTo: string,
    port: number
}

export const flags = commandLineArgs([
    { name: 'logLevel', type: Number, defaultValue: LogLvl.INFO },
    { name: 'dbLogLevel', type: Number, defaultValue: LogLvl.WARN },
    { name: 'logTo', type: String },
    { name: 'port', alias: 'p', type: Number, defaultValue: 0 }
]);


/**
 * Handlers for the server
 */
const handlers: Record<string, Handler> = {};

/**
 * Queries the database
 */
export let query: queryFunc | null;

/**
 * Define a route that the server will respond to.
 */
export default function route (path: string, handler: Handler) {
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

function startServer () {

    let options = {};
    if (process.env.PROD === '1') {
        options = {
            key: fs.readFileSync("./privatekey.pem"),
            cert: fs.readFileSync("./certificate.pem")
        };
    }

    let port = process.env.PORT;

    if (flags.port) {
        port = flags.port;
    }

    if (!port) {
        log.error`No port specified in .env or command line`;
        return;
    }

    let server: http.Server | https.Server;

    function handle (req: IncomingMessage, res: ServerResponse) {
        if (!query) {
            log.error`No query function available`;
            res.statusCode = 503;
            return res.end(JSON.stringify({
                status: 503,
                error: 'Waiting for server to start...'
            }));
        }
        requestHandler(req, res, query, handlers);
    }

    if (process.env.PROD !== '1') {
        server = http.createServer(options, handle)
            .listen(port, () => {
                log.log(c.green(`Dev server started on port ${port}`));
            });
    } else {
        server = https.createServer(options, handle)
            .listen(port, () => {
                log.log(c.green(`Production server started on port ${port}`));
            });
    }

    process.on('SIGTERM', () => {
        server.close(async () => {
            log.log`Server stopped, stopping process...`;
            await log.close();
            process.exit(0);
        });
    });
}

function connectToMySQL () {
    log.log`Connecting to SQL server...`;
    query = connectSQL();
}

(async () => {
    loadEnv();
    setupLogger(flags as any);
    connectToMySQL();
    startServer();
})();
