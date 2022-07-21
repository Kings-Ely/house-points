#!/usr/bin/env zx
import { $ } from "zx";
import fs from 'fs';
import path from 'path';
import c from 'chalk';
import commandLineArgs from 'command-line-args';

import setup from './setup.js';
import Test from './framework.js';
import fetch from "node-fetch";

const flags = commandLineArgs([
	{ name: 'verbose', alias: 'v', type: Boolean, defaultValue: false },
	{ name: 'doLighthouse', alias: 'l', type: Boolean, defaultValue: false },
]);

async function importAll (flags, dir='./test/tests') {
	const files = fs.readdirSync(dir);
	for (let f of files) {

		const file = path.join(dir, f);

		if (file.substring(file.length-3, file.length) !== '.js') {
			await importAll(file);
		} else {
			// ../ as it is being run from the dir above, but imports are relative to this file
			await import(path.join('../', file));
		}
	}
}

async function api (path) {
	const url = `http://localhost:${process.env.PORT}/${path}`;

	const res = await fetch(url, {
		method: 'GET',
		headers: {
			cookie: 'myCode=admin'
		}
	}).catch(e => {
		console.log('Error in API request');
		console.log(e);
	});

	if (!res) {
		console.log(`No response on path '${path}'`);
		return { error: 'No response' };
	}

	if (res.status === 404) {
		console.log(`404 on path '${path}'`);
		return { error: '404' };
	}

	if (!res.ok) {
		console.error(`ERROR from '${path}': ${JSON.stringify(await res.json())}`);
		return {};
	}

	const body = await res.text();

    if (flags.verbose) {
        console.log(`api [GET] ${url}: ${body.substring(0, 50)}`);
    }

	return JSON.parse(body);
}

(async () => {

	$.verbose = flags.verbose;

	try {
		await setup(flags);
		await importAll(flags);

		const testRes = await Test.testAll(api, flags);
		console.log(testRes.str(flags.verbose));

		if ((await api(`control/kill/${process.env.KILL_CODE}`)).ok) {
            console.log(c.green`Server Killed, finished testing`);
        }

	} catch (e) {
		console.error(e);
	}
})();
