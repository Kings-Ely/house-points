import mysql from 'mysql2';
import fs from 'fs';
import now from 'performance-now';
import c from 'chalk';
import { config } from 'dotenv';
import { CommandLineOptions } from "command-line-args";
import { exec } from "child_process";

async function startServer (flags: CommandLineOptions) {
	let t = now();

	return new Promise((resolve, reject) => {
		exec(`cd server; webpack`, (err, out, er) => {
			if (err) reject(err);
			if (er) reject(er);

			console.log(c.green(`Built server in ${(now() - t).toPrecision(4)}ms`));

			exec(`node --enable-source-maps server -v`, (err, out, er) => {
				if (err) reject(err);
				if (er) reject(er);
			});

			setTimeout(resolve, 500);
		});
	});
}


export default async function (flags: CommandLineOptions) {

	// setup environment variables
	config({ path: './server/.env' });

	await startServer(flags);

	let con = mysql.createConnection({
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		password: process.env.DB_PASS,
		database: process.env.DB,
		multipleStatements: true
	});

	return new Promise<void>((resolve, reject) => {
		con.query(`
			DROP DATABASE hpsnea;
			CREATE DATABASE hpsnea;
			use hpsnea;
		`, (err) => {

			if (err) {
				reject(`${err}, ${err.stack}`);
				return;
			}

			console.log(c.green`Database created`);

			const setUpQuery = fs.readFileSync('./sql/schema.sql', 'utf8');

			con.query(setUpQuery, (err) => {
				if (err) {
					reject(`${err}, ${err.stack}`);
					return;
				}

				console.log(c.green`Database schema created`);
				con.end();

				resolve();
			});
		});
	});
}
