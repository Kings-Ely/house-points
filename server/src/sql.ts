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


/**
 * Creates a connection to the database
 * And importantly keeps the connection alive
 * if it goes down
 */
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
    
    // queue of functions which are waiting for the connection to be established
    // this builds up when the connection drops and is cleared when the connection is re-established
    let queryQueue: (() => any)[] = [];

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
            
            for (const q of queryQueue) {
                q();
            }
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
    
    /**
     * Executes a query on the database
     * Is a tagged template literal, so takes in a string with placeholders
     * and an array of values to replace the placeholders with
     *
     * Prevents SQL injection by using placeholders rather than
     * string concatenation, and escaping the values
     */
    function query (queryParts: TemplateStringsArray, ...params: any[]): Promise<any> {
        return new Promise((resolve, fail) => {
            if (!hasConnectedSQL) {
                queryQueue.push(() => (query(queryParts, ...params).then(resolve).catch(fail)));
            }
            
            const queryStr = queryParts.reduce((acc, cur, i) => {
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
            
            log.verbose`QUERY: ${con.escape(queryStr)} ${JSON.stringify(params)}`;
            
            // if it's an array, add all the elements of the array in place as params
            // Flatten 2D arrays
            for (let i = 0; i < params.length; i++) {
                if (Array.isArray(params[i])) {
                    // insert the contents of the sub array into the array at it's index
                    params.splice(i, 1, ...params[i]);
                }
            }
            
            con.query(queryStr, params, (err, result) => {
                if (err) {
                    log.error(JSON.stringify(err));
                    fail(err);
                }
                resolve(result);
            });
        });
    }

    // returns function to get raw connection and
    // query function in tuple
    return [() => con, query];
}
