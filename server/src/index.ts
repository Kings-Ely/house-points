import * as https from "https";
import * as fs from "fs";
import * as http from "http";
import type { IncomingMessage, ServerResponse } from "http";
import { config } from 'dotenv';
import { Handler, Route } from "./route";
import c from 'chalk';

export const flags = {
    dev: process.argv.indexOf('--dev') !== -1
};

const handlers: Route[] = [];

export function route (path: string, handler: Handler) {
    handlers.push(new Route(path, handler));
}

async function serverResponse (req: IncomingMessage, res: ServerResponse) {

    // set response headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Credentials", "true");


    // find route which matches request path
    const route = handlers.find((route) => route.matches(req.url));

    // if one doesn't exist, return 404 and don't continue
    if (!route) {
        res.writeHead(404);
        return;
    }

    const [params, positionParams] = route.getParams(req.url);
    await route.handle({
        params,
        positionParams,
        res,
        req,
        url: req.url || ''
    });
}

(async () => {
    config();

    let options = {};

    if (!flags.dev) {
        options = {
            key: fs.readFileSync("./privatekey.pem"),
            cert: fs.readFileSync("./certificate.pem")
        };
    }

    console.log('Starting server...');

    const PORT = process.env.PORT;

    if (!PORT) {
        console.error('No port specified in .env');
        return;
    }

    if (flags.dev) {
        http.createServer(options, serverResponse)
            .listen(PORT, () => {
                console.log(c.green(`Dev server started on port ${PORT}`));
            });
    } else {
        https.createServer(options, serverResponse)
            .listen(PORT, () => {
                console.log(c.green(`Production server started on port ${PORT}`));
            });
    }

})();
