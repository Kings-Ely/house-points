import mysql from 'mysql2';
import c from 'chalk';

import log from './log';

export type queryRes =
      mysql.RowDataPacket[]
    | mysql.RowDataPacket[][]
    | mysql.OkPacket
    | mysql.OkPacket[]
    | mysql.ResultSetHeader;

export type queryFunc = <Res extends queryRes = mysql.RowDataPacket[]>(
    queryParts: TemplateStringsArray,
    ...params: any[]
) => Promise<Res>;

export default function connect (dbConfig: mysql.ConnectionOptions = {}): [() => mysql.Connection, queryFunc] {
    // define defaults from .env file
    const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306;
    const config: mysql.ConnectionOptions = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB,
        port,
        ...dbConfig,
        decimalNumbers: true
    };

    let con: mysql.Connection;

    let hasConnectedSQL = false;

    // as the server will periodically disconnect from the database,
    // we need to reconnect when the connection is lost
    function handleDisconnect() {
        log.warn`Attempting to reconnect to SQL server on port ${port}...`;
        
        con = mysql.createConnection(config);

        con.connect(err => {
            if (err) {
                log.error`error when connecting to db: ${JSON.stringify(err)}`;
                setTimeout(handleDisconnect, 200);
            }

            log.log(c.green(`Connected to SQL server`));
            hasConnectedSQL = true;
        });

        con.on('error', (err: any) => {
            if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                log.warn`Lost connection to SQL server`;
                handleDisconnect();
            } else {
                throw err;
            }
        });
    }

    handleDisconnect();

    // returns query function
    return [() => con, (queryParts: TemplateStringsArray, ...params: any[]): Promise<any> => {
        return new Promise((resolve, fail) => {
            if (!hasConnectedSQL) {
                log.error('Cannot run SQL query before connecting to SQL server');
                fail('SQL server not connected');
            }

            const query = queryParts.reduce((acc, cur, i) => {
                let str = acc + cur;
                if (params[i] === undefined) {
                    return str;
                } else if (Array.isArray(params[i])) {
                    // so you have ?,?,...?,? in your query for each array element
                    return str + '?,'.repeat(params[i].length - 1) + '?';
                } else {
                    return str + '?';
                }
            }, '');
            
            log.verbose`QUERY: ${con.escape(query)} ${JSON.stringify(params)}`;

            // if it's an array, add all the elements of the array in place as params
            // Flatten 2D arrays
            for (let i = 0; i < params.length; i++) {
                if (Array.isArray(params[i])) {
                    // insert the contents of the sub array into the array at it's index
                    params.splice(i, 1, ...params[i]);
                }
            }

            con.query(query, params, (err, result) => {
                if (err) {
                    log.error(JSON.stringify(err));
                    fail(err);
                }
                resolve(result);
            });
        });
    }];
}
