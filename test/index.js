#!/usr/bin/env zx

import { $ } from "zx";

const PORT = 8090;

async function startServer () {
	await $`cd dist/api; php -S localhost:${PORT}`;
}

async function api (path,) {
	return await fetch(`http://localhost${PORT}/${path}`);
}

const tests = [];

async function test () {

}


(async () => {
	await startServer();
	await test();
})();