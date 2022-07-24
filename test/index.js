#!/usr/bin/env zx
import { $ } from "zx";
import fs from 'fs';
import path from 'path';
import c from 'chalk';
import fetch from "node-fetch";
import commandLineArgs from 'command-line-args';
import childProcess from 'child_process';
import now from 'performance-now';

import setup from './setup.js';
import Test from './framework.js';

const flags = commandLineArgs([
	{ name: 'verbose', alias: 'v', type: Boolean, defaultValue: false },
	{ name: 'doLighthouse', alias: 'l', type: Boolean, defaultValue: false },
	{ name: 'deploy', alias: 'd', type: Boolean, defaultValue: false },
]);

/**
 * Imports all the tests from the 'tests' folder recursively
 * Means when a new file is added, it will be automatically imported
 * But means that this cannot be minified, as it will lose the folder structure
 * @param {*} flags
 * @param {string} [dir='./test/tests']
 * @returns {Promise<void>}
 */
async function importAll (flags, dir='./test/tests') {
	// loop over files in directory
	for (let f of fs.readdirSync(dir)) {

		// add root path of directory to file path
		const file = path.join(dir, f);

		// if the file ends with '.js', import it
		// otherwise, assume it's a director and import all the files in it
		if (file.substring(file.length-3, file.length) !== '.js') {
			await importAll(file);

		} else {
			// ../ as it is being run from the dir above, but imports are relative to this file
			await import(path.join('../', file));
		}
	}
}

/**
 * Makes API request to localhost API server
 * Uses http, and the port stored in the .env file
 * @param {string} path
 * @param {string} code
 * @returns {Promise<Record<string, any>>}
 */
async function api (path, code='admin') {
	// assume host is localhost
	const url = `http://localhost:${process.env.PORT}/${path}`;

	// get request to api server
	const res = await fetch(url, {
		method: 'GET',
		headers: {
			cookie: process.env.COOKIE_CODE_KEY + '=' + code
		}
	}).catch(e => {
		// don't do anything fancy with fetch errors, just log them
		console.log(c.red`Error in API request`);
		console.log(e);
	});

	if (!res) {
		console.log(`No response on path '${path}'`);
		return { error: 'No response' };
	}

	if (res.status === 404) {
		console.log(c.red(`404 on path '${path}'`));
		return res;
	}

	if (!res.ok) {
		console.error(c.red(`ERROR from '${path}': ${JSON.stringify(await res.json())}`));
		return {};
	}

	// get text content of response
	const body = await res.text();

    if (flags.verbose) {
        console.log(`${c.yellow`API`} '${url}': ${body}`);
    }

	return JSON.parse(body);
}

async function deploy () {
	return await new Promise((resolve, reject) => {

		let invoked = false;

		let process = childProcess.fork('./build/index.js');

		// listen for errors as they may prevent the exit event from firing
		process.on('error', err => {
			if (invoked) return;
			invoked = true;
			reject(err);
		});

		// execute the callback once the process has finished running
		process.on('exit', code => {
			if (invoked) return;
			invoked = true;
			if (code !== 0) {
				reject(new Error('exit code ' + code));
			}
		});
	});

}

(async () => {

	let start = now();

	const timeSinceStart = () => {
		const t = now() - start;
		return t.toFixed(2);
	}

	$.verbose = flags.verbose;

	try {
		await setup(flags);
		await importAll(flags);

		const testRes = await Test.testAll(api, flags);
		console.log(testRes.str(flags.verbose));

		if (testRes.failed === 0 && flags.deploy) {
			console.log('All tests passed, Deploying...');
			deploy().then(() => {
				console.log(c.green('Finished in ' + timeSinceStart() + 'ms'));
			});
		}

	} catch (e) {
		console.error(c.red(e));
	}

	try {
		// stop the server process by sending it a 'kill signal'
		if ((await api(`delete/server/${process.env.KILL_CODE}`)).ok) {
			console.log(c.green(`Server Killed, finished testing in ${timeSinceStart()}ms`));
		} else {
			console.log(c.red(`Server not killed, finished testing in ${timeSinceStart()}ms`));
		}
	} catch (e) {
		console.log(c.red(`Killing server failed with error, finished testing in ${timeSinceStart()}ms`));
		console.error(c.red(e));
	}
})();
