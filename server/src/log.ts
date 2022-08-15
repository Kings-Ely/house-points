import fs from 'fs';
import c from 'chalk';
import { tagFuncParamsToString } from "./util";
import { IFlags, query } from "./index";
import mysql from "mysql2";

export enum LogLvl {
    NONE,
    NO_WARN,
    NO_INFO,
    ALL,
    VERBOSE
}

class Logger {
    private fileHandle?: fs.WriteStream;
    private path = '';
    private level: LogLvl = 3;
    private dbLogLevel: LogLvl = 2;
    private useConsole = true;
    private active = true;

    private output (type: string, ...messages: any[]): void {
        if (!this.active) {
            return;
        }

        const message = messages
            .map(m => {
                // make sure it is all a string
                if (typeof m === 'string') return m;
                return JSON.stringify(m, null, 5);
            })
            .join(' ');

        let out = `[${type}] ${message}`;
        if (this.useConsole) {
            console.log(out);
        } else {
            fs.appendFileSync(this.path, out + '\n');
        }
    }

    private async logToDB (message: string): Promise<mysql.OkPacket | undefined> {
        if (!query) return;
        return await query<mysql.OkPacket>`
            INSERT INTO logs (msg) 
            VALUES (${message})
        `;
    }

    /**
     * Logs a message but only if the 'verbose' flag is set
     */
    verbose (msg: string | TemplateStringsArray, ...params: any[]) {
        if (this.level < LogLvl.VERBOSE) {
            return;
        }

        if (typeof msg === 'string') {
            this.output(c.grey`LOG`, msg, ...params);
            return;
        }

        const message = tagFuncParamsToString(msg, params);

        if (this.dbLogLevel >= LogLvl.VERBOSE) {
            this.logToDB(message).then();
        }

        this.output(c.grey`LOG`, message);
    }

    /**
     * Logs a message
     */
    log (msg: string | TemplateStringsArray, ...params: any[]) {
        if (this.level < LogLvl.ALL) {
            return;
        }

        if (typeof msg === 'string') {
            this.output(c.grey`LOG`, msg, ...params);
            return;
        }

        const message = tagFuncParamsToString(msg, params);

        if (this.dbLogLevel >= LogLvl.ALL) {
            this.logToDB(message).then();
        }

        this.output(c.grey`LOG`, message);
    }

    /**
     * Logs a warning
     */
    warning (msg: string | TemplateStringsArray, ...params: any[]) {
        if (this.level < LogLvl.NO_INFO) {
            return;
        }

        if (typeof msg === 'string') {
            this.output(c.yellow`WARN`, msg + ' ' + params.join(' '));
            return;
        }

        const message = tagFuncParamsToString(msg, params);

        if (this.dbLogLevel >= LogLvl.NO_INFO) {
            this.logToDB(message).then();
        }

        this.output(c.yellow`WARN`, message);
    }

    /**
     * Logs a warning
     */
    error (msg: string | TemplateStringsArray, ...params: any[]) {
        if (this.level < LogLvl.NO_WARN) {
            return;
        }

        if (typeof msg === 'string') {
            this.output(c.red`ERR`, msg + ' ' + params.join(' '));
            return;
        }

        const message = tagFuncParamsToString(msg, params);

        if (this.dbLogLevel >= LogLvl.NO_WARN) {
            this.logToDB(message).then();
        }

        this.output(c.red`ERR`, message);
    }

    async close () {
        this.active = false;
        return new Promise((resolve) => {
            this.fileHandle?.close(resolve);
        });
    }

    setLogOptions (options: IFlags) {
        this.level = options.logLevel;
        this.level = options.dbLogLevel;
        this.useConsole = !options.logTo;
        this.path = options.logTo;

        if (!this.useConsole) {
            console.log(`Logging to file: ${this.path}`);

            if (!fs.existsSync(this.path)) {
                fs.writeFileSync(this.path, '');
            }

            this.fileHandle = fs.createWriteStream(this.path, {
                flags: 'a'
            });

            this.output('START', new Date().toISOString());
        }
    }

    static instance: Logger = new Logger();
}

export function setupLogger (options: IFlags) {
    Logger.instance.setLogOptions(options);
}

export default Logger.instance;