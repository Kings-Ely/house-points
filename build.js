#!/usr/bin/env zx

import { $ } from "zx";
import now from "performance-now";
import chalk from 'chalk';
import * as fs from "fs";

async function uploadFrontend () {
    const paths = fs.readdirSync('./dist/');

    for (const path of paths) {
        console.log('Uploading path ' + path);
        if (fs.statSync('./dist/' + path).isDirectory()) {
            await $`sshpass -f './sshPass.txt' scp -r ./dist/${path} josephcoppin@josephcoppin.com:~/public_html/quiz`;
            continue;
        }
        await $`sshpass -f './sshPass.txt' scp ./dist/${path} josephcoppin@josephcoppin.com:~/public_html/quiz`;
    }
}

async function main () {
    const start = now();

    await uploadFrontend();

    console.log(chalk.green('Finished Uploading in ' + (now() - start).toFixed(3)));
}

main();