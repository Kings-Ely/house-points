import * as https from "https";
import * as fs from "fs";
import * as http from "http";
import type { IncomingMessage, ServerResponse } from "http";
import dotenv from 'dotenv';
import { Handler, Route } from "./route";
import c from 'chalk';
import connectSQL from './sql';
import log, {error, LogLvl, setLogOptions, warning} from "./log";
import commandLineArgs from 'command-line-args';
import path from "path";

const flags = commandLineArgs([
    { name: 'dev', alias: 'd', type: Boolean, defaultValue: false },
    { name: 'log', type: Number, defaultValue: LogLvl.ALL },
    { name: 'verbose', alias: 'v', type: Boolean, defaultValue: false },
    { name: 'useConsole', alias: 'c', type: Boolean, defaultValue: false },
]);

const handlers: Route[] = [];

let query = (...args: any[]) => new Promise(() => {
    error`SQL server not connected`;
});

export function route (path: string, handler: Handler) {
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
    res.setHeader("Access-Control-Allow-Methods", "GET, POST");
    res.setHeader("Access-Control-Allow-Credentials", "true");


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

    const params = route.getParams(req.url);
    const finalResponse = await route.handle({
        params,
        res,
        req,
        url: req.url || '',
        query
    });

    res.end(finalResponse);
}

function loadEnv () {
    const contents = fs.readFileSync(path.join(path.resolve(__dirname), '.env'), 'utf8');

    process.env = {
        ...process.env,
        ...dotenv.parse(contents)
    };
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

    const PORT = process.env.PORT;

    if (!PORT) {
        error`No port specified in .env`;
        return;
    }

    if (flags.dev) {
        http.createServer(options, serverResponse)
            .listen(PORT, () => {
                log(c.green(`Dev server started on port ${PORT}`));
            });
    } else {
        https.createServer(options, serverResponse)
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
