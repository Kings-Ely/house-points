#!/usr/bin/env zx
import { $ } from "zx";
import setup from './setup.js';
import Test from './framework.js';
import fs from 'fs';
import path from 'path';

const VERBOSE = process.argv.indexOf('-v') !== -1;

$.verbose = VERBOSE;

async function startServer () {
	console.log('Building server...');
	$`webpack -c server/webpack.config.js`;

	console.log('Starting server...');
	$`node --enable-source-maps server -dc ${VERBOSE ? '-v' : ''}`;
}

async function importAll (dir='./test/tests') {
	const files = fs.readdirSync(dir);
	for (let f of files) {

		const file = path.join(dir, f);

		if (file.substr(file.length-3, file.length) !== '.js') {
			await importAll(file);
		} else {
			// ../ as it is being run from the dir above, but imports are relative to this file
			await import(path.join('../', file));
		}
	}
}

(async () => {
	try {
		await setup();
		await startServer();
		await importAll();

		console.log((await Test.testAll()).str(VERBOSE));

	} catch (e) {
		console.error(e);
	}
})();
