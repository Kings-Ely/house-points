#!/usr/bin/env zx

import { $ } from "zx";
import c from 'chalk';

const PORT = 8090;

const tests = [() => false, () => 'failed!', () => true, () => true];

async function startServer () {
	$`cd dist/api; php -S localhost:${PORT}`;

	// sleep for a bit to wait for sever to start - not sure how long this takes however
	await new Promise(r => setTimeout(r, 100));
}

async function api (path) {
	return await fetch(`http://localhost${PORT}/${path}`);
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
	for (let fail of fails) {
		console.log(c.red`Fail: ${fail}`);
	}
}

async function test () {
	let results = [];

	for (let test of tests) {
		results.push(test(api));
	}

	logResults(results);
}


(async () => {
	await startServer();
	await test();
})();