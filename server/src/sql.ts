import mysql from 'mysql2';
import log, { error } from "./log";

export type queryFunc = (queryParts: TemplateStringsArray, ...params: any[]) => Promise<any>;

export default function (dbConfig?: mysql.ConnectionOptions): queryFunc {

    // define defaults from .env file
    const config: mysql.ConnectionOptions = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB,
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

            log`Connected to SQL server`;
            hasConnectedSQL = true;
        });

        con.on('error', (err: any) => {
            if (err.code === 'PROTOCOL_CONNECTION_LOST') {
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

            const query =  queryParts.reduce((acc, cur, i) => {
                return acc + cur + (params[i] ? con.escape(params[i]) : '');
            }, '');

           log('QUERY: ', query);

            con.query(query, (err, result) => {
                if (err) {
                    console.error(err);
                    fail(err);
                }
                resolve(result);
            });
        })
    };
}
