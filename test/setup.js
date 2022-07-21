import mysql from 'mysql2';
import fs from 'fs';
import now from 'performance-now';
import c from 'chalk';
import { config } from 'dotenv';
import { $ } from "zx";

async function startServer (flags) {
	let t = now();
	await $`npm run build-server`;
	console.log(c.green(`Built server in ${(now() - t).toPrecision(4)}ms`));

	$`node --enable-source-maps server -d ${flags.verbose ? '-v' : ''}`;
	console.log(c.green(`Started server`));
	// wait some time for the server to start
	return new Promise(r => setTimeout(r, 100));
}


export default async function (flags) {

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

	return new Promise((resolve, reject) => {
		con.query(`
			DROP DATABASE hpsnea;
			CREATE DATABASE hpsnea;
			use hpsnea;
		`, (err) => {

			if (err) {
				reject(err);
				return;
			}

			console.log(c.green`Database created`);

			const setUpQuery = fs.readFileSync('./sql/schema.sql', 'utf8');

			con.query(setUpQuery, (err) => {
				if (err) {
					reject(err);
					return;
				}

				console.log(c.green`Database schema created`);
				con.end();

				resolve();
			});
		});
	});
}
