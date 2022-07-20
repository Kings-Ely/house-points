#!/usr/bin/env zx

import { $ } from "zx";
import now from "performance-now";
import c from 'chalk';
import * as fs from "fs";

$.verbose = false;

const REMOTE_ADDRESS = 'josephcoppin@josephcoppin.com';
const REMOTE_FRONTEND_PATH = '/public_html/school/house-points';
const REMOTE_BACKEND_PATH = '/hpsnea-server';
const LOCAL_PATH = './dist/';

async function uploadFrontend () {
    if (process.argv.includes('--no-front')) return;

    console.log('Uploading frontend...');

    const paths = fs.readdirSync(LOCAL_PATH);

    for (const path of paths) {
        // skip hidden files and directories
        if (path[0] === '.') continue;

        if (fs.statSync(LOCAL_PATH + path).isDirectory()) {
            await $`sshpass -f './sshPass.txt' rsync -r --exclude='*.env' ${LOCAL_PATH}${path} ${REMOTE_ADDRESS}:~${REMOTE_FRONTEND_PATH}`;
            continue;
        }
        await $`sshpass -f './sshPass.txt' rsync ${LOCAL_PATH}${path} ${REMOTE_ADDRESS}:~${REMOTE_FRONTEND_PATH}`;
    }
}

async function buildBackend () {
    console.log('Building backend...');

    await $`npm run build-server`;
}

async function uploadBackend () {
    console.log('Uploading backend...');

    const paths = [
        './server/index.js',
        './server/index.js.map',
    ];

    await Promise.all(paths.map(async (path) =>
        await $`sshpass -f './sshPass.txt' rsync -r --exclude='*.env' ${path} ${REMOTE_ADDRESS}:~${REMOTE_BACKEND_PATH}`
    ));
}

(async () => {
    const start = now();

    await buildBackend();
    await uploadFrontend();
    await uploadBackend();

    const duration = now() - start;
    console.log(c.green(`Finished Building in ${duration.toFixed(3)}`));
})();
