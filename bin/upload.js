#!/usr/bin/env zx

import { $ } from 'zx';
import now from 'performance-now';
import c from 'chalk';
import * as fs from 'fs';

$.verbose = true;

const REMOTE_ADDRESS = 'josephcoppin@josephcoppin.com';
const REMOTE_FRONTEND_PATH = '/public_html/school/house-points';
const REMOTE_BACKEND_PATH = '/hpsnea-server';
const LOCAL_PATH = './dist/';

async function upload(localPath, remotePath, args = '') {
    return await $`sshpass -f './sshPass.txt' rsync ${args.split(
        ' '
    )} ${localPath} ${REMOTE_ADDRESS}:~${remotePath}`;
}

async function uploadFrontend() {
    if (process.argv.includes('--no-front')) return;

    console.log('Uploading frontend...');

    const paths = fs.readdirSync(LOCAL_PATH);

    for (const path of paths) {
        // skip hidden files and directories
        if (path[0] === '.') continue;

        if (fs.statSync(LOCAL_PATH + path).isDirectory()) {
            await upload(LOCAL_PATH + path, REMOTE_FRONTEND_PATH, "-r --exclude='*.env'");
            continue;
        }
        await upload(LOCAL_PATH + path, REMOTE_FRONTEND_PATH);
    }
}

async function uploadBackend() {
    console.log('Uploading backend...');

    const paths = {
        './server/index.js': '/index.js',
        './server/index.js.map': '/index.js.map',
        './server/staging.Dockerfile': '/Dockerfile',
        './server/package.json': '/package.json',
        './server/prod.env': '/.env'
    };

    await Promise.all(
        Object.keys(paths).map(async path => {
            if (fs.existsSync(path)) {
                await upload(path, REMOTE_BACKEND_PATH + paths[path]);
            }
        })
    );
}

(async () => {
    const start = now();
    
    await uploadFrontend();
    await uploadBackend();

    const duration = (now() - start) / 1000;
    console.log(c.green(`Finished Building in ${duration.toFixed(3)}s`));
})();
