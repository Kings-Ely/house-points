import fs from 'fs';
import c from 'chalk';
import { removeColour, tagFuncParamsToString } from './util';
import { IFlags, query } from './index';
import mysql from 'mysql2';

export enum LogLvl {
    NONE,
    ERROR,
    WARN,
    INFO,
    VERBOSE
}

class Logger {
    private fileHandle?: fs.WriteStream;
    private path = '';
    private level: LogLvl = 3;
    private dbLogLevel: LogLvl = 2;
    private useConsole = true;
    private active = true;

    /**
     * Outputs a message to the console and/or file
     */
    output(level: LogLvl, type: string, ...messages: any[]): void {
        if (!this.active) {
            return;
        }

        if (this.level < level) {
            return;
        }

        const message =
            `[${type}] ` +
            messages
                .map(m => {
                    // make sure it is all a string
                    if (typeof m === 'string') return m;
                    return JSON.stringify(m, null, 5);
                })
                .join(' ');

        if (this.useConsole) {
            console.log(message);
        } else {
            fs.appendFileSync(this.path, message + '\n');
        }

        if (this.dbLogLevel >= level) {
            this.logToDB(removeColour(message)).then();
        }
    }

    private async logToDB(message: string, from = 'server'): Promise<mysql.OkPacket | undefined> {
        if (!query) return;
        return await query<mysql.OkPacket>`
            INSERT INTO logs (msg, madeBy)
            VALUES (${message}, ${from})
        `;
    }

    /**
     * Logs a message but only if the 'verbose' flag is set
     */
    verbose(msg: string | TemplateStringsArray, ...params: any[]) {
        this.output(LogLvl.VERBOSE, c.grey`VERB`, tagFuncParamsToString(msg, params));
    }

    /**
     * Logs a message
     */
    log(msg: string | TemplateStringsArray, ...params: any[]) {
        const message = tagFuncParamsToString(msg, params);

        if (this.dbLogLevel >= LogLvl.INFO) {
            this.logToDB(message).then();
        }

        this.output(LogLvl.INFO, c.grey`INFO`, message);
    }

    /**
     * Logs a warning
     */
    warning(msg: string | TemplateStringsArray, ...params: any[]) {
        this.output(LogLvl.WARN, c.yellow`WARN`, tagFuncParamsToString(msg, params));
    }

    /**
     * Logs an error
     */
    error(msg: string | TemplateStringsArray, ...params: any[]) {
        this.output(LogLvl.ERROR, c.red`ERR`, tagFuncParamsToString(msg, params));
    }

    /**
     * Closes any active file handles
     */
    async close(): Promise<unknown> {
        this.active = false;
        return new Promise(resolve => {
            this.fileHandle?.close?.(resolve);
        });
    }

    setLogOptions(options: IFlags) {
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

            this.output(LogLvl.INFO, 'START', new Date().toISOString());
        }
    }

    static instance: Logger = new Logger();
}

export function setupLogger(options: IFlags) {
    Logger.instance.setLogOptions(options);
}

export default Logger.instance;
