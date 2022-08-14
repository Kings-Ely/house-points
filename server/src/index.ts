import https from "https";
import http, { IncomingMessage, ServerResponse } from "http";
import fs from "fs";
import commandLineArgs from 'command-line-args';
import c from 'chalk';
import connectSQL, { queryFunc } from './sql';
import log, { error, LogLvl, setLogOptions, close as stopLogger } from "./log";
import { loadEnv } from "./util";
import requestHandler, { Handler } from "./requestHandler";

export const flags = commandLineArgs([
    { name: 'log', type: Number, defaultValue: LogLvl.ALL },
    { name: 'logTo', type: String, defaultValue: 'server.log' },
    { name: 'verbose', alias: 'v', type: Boolean, defaultValue: false },
    { name: 'useConsole', alias: 'c', type: Boolean, defaultValue: false },
    { name: 'port', alias: 'p', type: Number, defaultValue: 0 }
]);

/**
 *
 */
const handlers: Record<string, Handler> = {};

/**
 * Queries the database
 */
let query: queryFunc = () => new Promise(() => {
    error`SQL server not connected`;
    return null;
});

/**
 * Define a route that the server will respond to.
 */
export default function route (path: string, handler: Handler) {
    try {
        handlers[path] = handler;
    } catch (e) {
        error`Error adding route: ${e}`;
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
        error`No port specified in .env or command line`;
        return;
    }

    let server: http.Server | https.Server;

    function handle (req: IncomingMessage, res: ServerResponse) {
        return requestHandler(req, res, query, handlers);
    }

    if (process.env.PROD !== '1') {
        server = http.createServer(options, handle)
            .listen(port, () => {
                log(c.green(`Dev server started on port ${port}`));
            });
    } else {
        server = https.createServer(options, handle)
            .listen(port, () => {
                log(c.green(`Production server started on port ${port}`));
            });
    }

    process.on('SIGTERM', () => {
        server.close(async () => {
            log`Server stopped, stopping process...`;
            await stopLogger();
            process.exit(0);
        });
    });
}

function connectToMySQL () {
    log`Connecting to SQL server...`;
    query = connectSQL();
}

(async () => {
    loadEnv();
    setLogOptions(flags);
    connectToMySQL();
    startServer();
})();
