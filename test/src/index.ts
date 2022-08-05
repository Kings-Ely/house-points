import c from 'chalk';
import fetch from "node-fetch";
import commandLineArgs, { CommandLineOptions } from 'command-line-args';
import childProcess from 'child_process';
import now from 'performance-now';

import setup from './setup';
import Test from './framework';

import './tests/smoke';
import './tests/self';
import './tests/users';
import './tests/events';
import './tests/house-points';

const flags = commandLineArgs([
	{ name: 'verbose', alias: 'v', type: Boolean, defaultValue: false },
	{ name: 'deploy', alias: 'd', type: Boolean, defaultValue: false },
]);

export type API = (path: string, code?: string) => Promise<any>;
export type testExecutor = (api: API, args: CommandLineOptions) => Promise<boolean | Error | string>;

const adminPassword = 'password';
const adminEmail = encodeURIComponent('admin@example.com');

let adminSessionID: string | null = null;

/**
 * Makes API request to localhost API server
 * Uses http, and the port stored in the .env file
 */
async function api (path: string, session: string | null = null): Promise<any> {
	// assume host is localhost
	const url = `http://localhost:${process.env.PORT}/${path}`;

	if (session === null) {
		if (adminSessionID === null) {
			let res = await api(`create/sessions/from-login/${adminEmail}/${adminPassword}`, '');
			if (res.error || !res.ok) {
				throw c.red(res.error);
			}
			adminSessionID = res.sessionID;
		}
		session = adminSessionID;
	}

	// get request to api server
	const res = await fetch(url, {
		method: 'GET',
		headers: {
			cookie: process.env.COOKIE_SESSION_KEY + '=' + session
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

	await setup(flags);

	const testRes = await Test.testAll(api, flags);
	console.log(testRes.str(flags.verbose));

	if (testRes.failed === 0 && flags.deploy) {
		console.log('All tests passed, Deploying...');
		deploy().then(() => {
			console.log(c.green('Finished in ' + timeSinceStart() + 'ms'));
		});
	}

	// stop the server process by sending it a 'kill signal'
	if ((await api(`delete/server`)).ok) {
		console.log(c.green(`Server Killed, finished testing in ${timeSinceStart()}ms`));
	} else {
		console.log(c.red(`Server not killed`));
	}
})();
