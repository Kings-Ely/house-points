import chalk from 'chalk';
import fetch from "node-fetch";
import { performance } from 'perf_hooks';
const now = performance.now;

/**
 * @name testExecutor
 * @function
 * @param {(path: string) => Promise<any>} api
 * @returns {boolean | Error}
 */

const PORT = 8090;

export class TestResult {
    failed = 0;
    passed = 0;
    fails = [];
    time = 0;

    register (res, test={batteryName: 'unknown', batteryID: -2}) {
        if (res === true) {
            this.passed++;

        } else if (res instanceof TestResult) {
            this.failed += res.failed;
            this.passed += res.passed;
            this.fails = [...this.fails, ...res.fails];

        } else {
            this.fails.push([res, test]);
            this.failed++;
        }
    }

    str (verbose=false) {
        return `
            ---   TEST REPORT   ---
                ${chalk[this.failed < 1 ? 'green' : 'red'](this.failed)} tests failed
                ${chalk.green(this.passed.toString())} tests passed
                
            In ${chalk.cyan(this.time.toFixed(0))}ms
            
            ${this.failed === 0 ? chalk.green('All tests passed!') : ''}
            
            ${this.fails.map(([res, test]) =>
                `\n ${test.batteryName} (#${test.batteryID+1}): ${res}`
            )}
        `;
    }
}

async function api (path) {
    const url = `http://localhost:${PORT}/${path}`;

    const res = await fetch(url, {
        method: 'GET',
        headers: {
            cookie: 'myCode=admin'
        }
    }).catch(e => {
        console.log('Error in API request');
        console.log(e);
    });

    const body = await res.text();

    console.log(`[GET] ${url}: ${body.substring(0, 50)}`);

    return body;
}

export default class Test {
    test;
    id;
    batteryName;
    batteryID;

    /**
     * @param {testExecutor} test
     * @param {string | number} id
     * @param {string} batteryName
     * @param {number} batteryID
     */
    constructor (test, id = 'test', batteryName='', batteryID = 0) {
        this.id = id;
        this.test = test;
        this.batteryName = batteryName;
        this.batteryID = batteryID;
    }

    /**
     * @param {Context} env
     * @returns {boolean | Error}
     */
    run (env) {
        return this.test(env);
    }

    static currentID = 0;
    static currentName = 'unknownName';

    static battery (name) {
        this.currentName = name;
    }

    /** @type {Test[]} */
    static tests = [];

    /**
     * @param {testExecutor} test
     */
    static test (test) {
        Test.tests.push(new Test(test, Test.tests.length, this.currentName, this.currentID));
    }

    /**
     * @returns {TestResult}
     */
    static async testAll () {
        let time = now();

        const res = new TestResult();

        for (let test of Test.tests) {
            res.register(await test.run(api), test);
        }

        res.time = Math.round(now() - time);

        return res;
    }
}
