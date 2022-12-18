import mysql from 'mysql2';
import fs from 'fs';
import now from 'performance-now';
import c from 'chalk';
import { config } from 'dotenv';
import { exec } from 'child_process';

/**
 * Builds and starts the API on localhost ready to test
 * @returns {Promise<void>}
 */
async function startServer(): Promise<void> {
    let time = now();

    return new Promise((resolve, reject) => {
        // runs these commands on the command line
        // 'change directory' to the server directory
        // 'webpack' to compile and bundle the server source code
        exec(`cd server; webpack`, (err, _, er) => {
            if (err) reject(err);
            if (er) reject(er);

            console.log(c.green(`Built server in ${(now() - time).toPrecision(4)}ms`));
            time = now();

            // command to start the server running on localhost
            exec(
                `node --enable-source-maps server --logTo=test.log --logLevel=4 --dbLogLevel=2`,
                (err, _, er) => {
                    if (err) reject(err);
                    if (er) reject(er);
                }
            );

            console.log(c.green(`Server starting`));

            // wait for the server to start
            setTimeout(resolve, 500);
        });
    });
}

/**
 * Runs all the setup required to run the tests, including
 * starting the server and setting up the database
 */
export default async function setup(): Promise<void> {
    // setup environment variables
    config({ path: './server/.env' });

    await startServer();
    
    let con = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB,
        multipleStatements: true
    });

    return new Promise<void>((resolve, reject) => {
        // clears the database
        con.query(
            `
			DROP DATABASE ${process.env.DB};
			CREATE DATABASE ${process.env.DB};
			use ${process.env.DB};
		`,
            err => {
                if (err) {
                    reject(`${err}, ${err.stack}`);
                    return;
                }

                console.log(c.green`Database created`);

                const setUpQuery = fs.readFileSync('./sql/schema.sql', 'utf8');

                con.query(setUpQuery, err => {
                    if (err) {
                        reject(`${err}, ${err.stack}`);
                        return;
                    }

                    console.log(c.green`Database schema created`);
                    con.end();

                    resolve();
                });
            }
        );
    });
}
