#!/usr/bin/env zx
$.verbose = false
$.log = () => {};

import fetch from 'node-fetch';
import { $ } from "zx";
import c from 'chalk';
import setup from './setup.js';

const PORT = 8090;

const tests = [
	async (api) => {
		let res = await api('ping.php');
		return res === '1' ?  true : res;
	}
];

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

async function api (path) {
	const url = `http://localhost:${PORT}/${path}`;
	console.log(`[GET] ${url}`);

	const res = await fetch(url, {
		method: 'GET'
	}).catch(e => {
		console.log('Error in API request');
		console.log(e);
	});

	return await res.text();
}

function logResults (results) {
	let successes = 0;
	let fails = [];

	for (let res of results) {
		if (res === true) {
			successes++;
		} else {
			fails.push(res);
		}
	}

	console.log(c.yellow`	TEST RESULTS`);
	console.log(`${c.green(successes)} / ${successes+fails.length} passed`);
	if (fails) {
		console.log(c.red`${fails.length} Fails:`);
	}
	let i = 0;
	for (let fail of fails) {
		console.log(c.red`Fail #${i}:`);
		console.log(fail);
		i++;
	}
}

async function test () {
	let results = [];

	for (let test of tests) {
		let res = await test(api);
		results.push(res);
	}

	logResults(results);
}


(async () => {
	try {
		await setup();
		await startServer();
		await test();
	} catch (e) {
		console.error(e);
	}
})();