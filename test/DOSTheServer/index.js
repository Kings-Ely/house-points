import now from 'performance-now';
import * as https from "https";
import * as http from "http";

/**
 * Results for Apache server:
 *
 * Time goes up as N increases, but also as request index increases for each request.
 * For 1000 requests it is around 5000ms per request, which is actually fine for our applications atm.
 * For 100 requests which is more like the maximum workload, it is around 500ms per request,
 * which is perfectly fine.
 *
 * Results for the Node API:
 *	for just 100 it is at 9000ms per request, which is not great, and as each apache request might take
 *  multiple api requests, is the bottleneck of the backend performance of the system.
 *  For just 20 it is over 2000ms.
 */

const N = process.argv[3] || 100;
const rootPath = process.argv[2];

https.globalAgent.maxSockets = N + 1;

let results = [];

async function getFromPath(path, i) {
    return new Promise((resolve, reject) => {
        let start = now();
    
        if (i === N-1)
            console.log(`Last request started`);
        else if (i === 0)
            console.log(`First request started`);
    
        (rootPath.startsWith('https://') ? https : http).get(`${rootPath}/${path}`, () => {
            if (i === N-1)
                console.log(`Last request ended`);
            else if (i === 0)
                console.log(`First request ended`);
    
            let time = now() - start;
            results.push([time, i]);
            resolve();
        });
    });
}

async function run() {
    await Promise.all(Array.from({ length: N },
        (x, i) => i).map(i => getFromPath(``, i)));

    console.log(results.sort((a, b) => a[1] - b[1]));

    console.log(
        'Average: ',
        results.reduce((a, b) => a + b[0], 0) / results.length,
        `ms (${results.length})`
    );
    console.log(
        'Min: ',
        results.reduce((a, b) => Math.min(a, b[0]), results[0][0]),
        `ms`
    );
    console.log(
        'Max: ',
        results.reduce((a, b) => Math.max(a, b[0]), results[0][0]),
        `ms`
    );
}

run().catch(console.error);
