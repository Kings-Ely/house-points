import lighthouse from 'lighthouse';
import chrome from 'chrome-launcher';
import { fileURLToPath } from "url";
import c from 'chalk';

export const goodScore = 0.9;

export const lighthouseResCategories = ['performance', 'accessibility', 'best-practices', 'seo'];

function prettyPrintOutput (lhr) {

    if (lhr.runtimeError) {
        console.error(c.red`An error occurred running LightHouse: `);
        console.log(lhr.runtimeError);
        return;
    }

    console.log(c.yellow(`Lighthouse took ${lhr.timing.total}ms to run`));

    let failed = false;
    for (let cat of lighthouseResCategories) {
        const score = lhr.categories[cat].score;
        if (score < goodScore) {
            console.log(c.red`Bad score on ${cat}: ${score*100}%`);
            failed = true;
        }
    }

    if (!failed) {
        console.log(c.green(`All categories > ${goodScore*100}%!`));
    }

    console.log(c.green`Completed LightHouse analysis`);
}

export default async function run (url, log=false) {
    console.log(c.yellow(`Starting lighthouse on ${url}`));

    const tab = await chrome.launch({
        chromeFlags: ['--headless']
    });
    const runnerResult = await lighthouse(url, {
        port: tab.port
    });

    if (log) {
        prettyPrintOutput(runnerResult.lhr);
    }

    await tab.kill();

    return runnerResult.lhr;
}

// run as a script on the URL passed as an argument to the script
// but only if this script is the one being run from the command line
// and another argument is present
if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv.length > 2) {
    run(process.argv[2]);
}
