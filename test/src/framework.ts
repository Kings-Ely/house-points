import chalk from 'chalk';
import { performance } from 'perf_hooks';
import { API, testExecutor } from "./index";
import { CommandLineOptions } from "command-line-args";
const now = performance.now;

export class TestResult {
    failed = 0;
    passed = 0;
    fails: [any, any][] = [];
    time = 0;

    register (res: any, test={batteryName: 'unknown', batteryID: -2}) {
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

    constructor(test: testExecutor, id: string | number = 'test', batteryName = '', batteryID = 0) {
        this.id = id;
        this.test = test;
        this.batteryName = batteryName;
        this.batteryID = batteryID;
    }

    run(api: API, code: CommandLineOptions) {
        return this.test(api, code);
    }

    static currentID = 0;

    static tests: Test[] = [];


    static test(name: string, test: testExecutor) {
        Test.tests.push(new Test(test, Test.tests.length, name, this.currentID));
    }

    /**
     * @returns {TestResult}
     */
    static async testAll(api: API, flags: CommandLineOptions) {
        let time = now();

        const res = new TestResult();

        for (let test of Test.tests) {
            let testRes;
            try {
                testRes = await test.run(api, flags)
            } catch (e) {
                testRes = e;
            }
            res.register(testRes, test);
        }

        res.time = Math.round(now() - time);

        return res;
    }

    static eq (o1: Record<string, any>, o2: Record<string, any>) {
        const keys1 = Object.keys(o1);
        const keys2 = Object.keys(o2);
        if (keys1.length !== keys2.length) {
            return false;
        }
        for (const key of keys1) {
            const val1 = o1[key];
            const val2 = o2[key];
            const areObjects = Test.isOb(val1) && Test.isOb(val2);
            if (
                areObjects && !Test.eq(val1, val2) ||
                !areObjects && val1 !== val2
            ) {
                return false;
            }
        }
        return true;
    }

    static isOb(o: any) {
        return o != null && typeof o === 'object';
    }
}