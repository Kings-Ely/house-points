import chalk from 'chalk';
import { performance } from 'perf_hooks';
const now = performance.now;

/**
 * @name testExecutor
 * @function
 * @param {(path: string) => Promise<any>} api
 * @returns {boolean | Error}
 */

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

    run (...args) {
        return this.test(...args);
    }

    static currentID = 0;

    /** @type {Test[]} */
    static tests = [];

    /**
     * @param {string} name
     * @param {testExecutor} test
     */
    static test (name, test) {
        Test.tests.push(new Test(test, Test.tests.length, name, this.currentID));
    }

    /**
     * @returns {TestResult}
     */
    static async testAll (api, flags) {
        let time = now();

        const res = new TestResult();

        for (let test of Test.tests) {
            res.register(await test.run(api, flags), test);
        }

        res.time = Math.round(now() - time);

        return res;
    }
}
