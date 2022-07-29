import mysql from 'mysql2';
import c from 'chalk';

import log, { error, warning } from "./log";
import { flags } from "./index";

export type queryFunc = (queryParts: TemplateStringsArray, ...params: any[]) => Promise<any>;

export default function (dbConfig?: mysql.ConnectionOptions): queryFunc {

    // define defaults from .env file
    const config: mysql.ConnectionOptions = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
        ...(dbConfig ?? {})
    };

    let con: mysql.Connection;

    let hasConnectedSQL = false;

    // as the server will periodically disconnect from the database,
    // we need to reconnect when the connection is lost
    function handleDisconnect() {
        con = mysql.createConnection(config);

        con.connect((err) => {
            if (err) {
                error`error when connecting to db: ${JSON.stringify(err)}`;
                setTimeout(handleDisconnect, 500);
            }

            log(c.green(`Connected to SQL server`));
            hasConnectedSQL = true;
        });

        con.on('error', (err: any) => {
            if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                warning`Lost connection to SQL server`;
                handleDisconnect();
            } else {
                throw err;
            }
        });
    }

    handleDisconnect();

    return (queryParts: TemplateStringsArray, ...params: any[]): Promise<any> => {
        return new Promise((resolve, fail) => {
            if (!hasConnectedSQL) {
                fail('SQL server not connected');
            }

            const query = queryParts.reduce((acc, cur, i) => {
                let str = acc + cur;
                if (params[i] === undefined) {
                    return str;
                } else if (Array.isArray(params[i])) {
                    return str + '?'.repeat(params[i].length);
                } else {
                    return str + '?';
                }
            }, '');

            if (flags.verbose) {
                log`QUERY: ${con.escape(query)} ${JSON.stringify(params)}`;
            }

            // if it's an array, add all the elements of the array in place as params
            for (let i = 0; i < params.length; i++) {
                if (Array.isArray(params[i])) {
                    params.splice(i, 1, ...params[i]);
                }
            }

            con.query(query, params, (err, result) => {
                if (err) {
                    error(JSON.stringify(err));
                    fail(err);
                }
                resolve(result);
            });
        })
    };
}
