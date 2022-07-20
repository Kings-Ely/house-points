#!/usr/bin/env zx
$.verbose = false
$.log = () => {};


import { $ } from "zx";
import c from 'chalk';
import setup from './setup.js';
import Test from './framework.js';
import fs from 'fs';
import path from 'path';

const VERBOSE = process.argv.indexOf('-v') !== -1;

const PORT = 8090;

async function startServer () {
	try {
		$`cd dist/api; php -S localhost:${PORT}`;
	} catch (e) {
		console.log(c.red`ERROR: --------- on PHP server start`);
		console.error(e);
	}

	// sleep for a bit to wait for sever to start - not sure how long this takes however
	await new Promise(r => setTimeout(r, 100));
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
