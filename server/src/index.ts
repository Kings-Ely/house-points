import { createServer } from "https";
import { createServer as createServerHTTP } from "http";
import * as fs from "fs";
import type { IncomingMessage, ServerResponse } from "http";
import commandLineArgs from 'command-line-args';
import c from 'chalk';

import { type Handler, Route } from "./route";
import connectSQL, { type queryFunc } from './sql';
import log, { error, LogLvl, setLogOptions, warning } from "./log";
import {loadEnv} from "./util";

const flags = commandLineArgs([
    { name: 'dev', alias: 'd', type: Boolean, defaultValue: false },
    { name: 'log', type: Number, defaultValue: LogLvl.ALL },
    { name: 'verbose', alias: 'v', type: Boolean, defaultValue: false },
    { name: 'useConsole', alias: 'c', type: Boolean, defaultValue: false },
    { name: 'port', alias: 'p', type: Number, defaultValue: 0 }
]);

const handlers: Route[] = [];

let query: queryFunc = () => new Promise(() => {
    error`SQL server not connected`;
});

export default function route (path: string, handler: Handler) {
    handlers.push(new Route(path, handler));
}

import './routes/users';
import './routes/ping';

async function serverResponse (req: IncomingMessage, res: ServerResponse) {

    if (flags.verbose) {
        log`${req.method} ${req.url}`;
    }

    // set response headers
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || '*');
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader('Content-Type', 'application/json');

    // find route which matches request path
    const routes = handlers.filter((route) => route.matches(req.url));

    if (routes.length > 1) {
        warning`Multiple routes match ${req.url}`;

    } else if (routes.length === 0) {
        res.writeHead(404);
        res.end('');
        warning`404: ${req.method} ${req.url}`;
        return;
    }

    const route = routes[0];

    res.writeHead(200);

    const finalResponse = await route.handle({
        params: route.getParams(req.url),
        res,
        req,
        url: req.url || '',
        query
    });

    res.end(finalResponse);
}

function startServer () {
    log`Starting server...`;

    let options = {};
    if (!flags.dev) {
        options = {
            key: fs.readFileSync("./privatekey.pem"),
            cert: fs.readFileSync("./certificate.pem")
        };
    }

    let PORT = process.env.PORT;

    if (flags.port) {
        PORT = flags.port;
    }

    if (!PORT) {
        error`No port specified in .env or command line`;
        return;
    }

    if (flags.dev) {
        createServerHTTP(options, serverResponse)
            .listen(PORT, () => {
                log(c.green(`Dev server started on port ${PORT}`));
            });
    } else {
        createServer(options, serverResponse)
            .listen(PORT, () => {
                log(c.green(`Production server started on port ${PORT}`));
            });
    }
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
