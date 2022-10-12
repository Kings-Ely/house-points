import fs from 'fs';
import c from 'chalk';
import { queryFunc } from "./sql";
import { removeColour, tagFuncParamsToString } from './util';
import { IFlags } from './index';
import mysql from 'mysql2';

export enum LogLvl {
    NONE,
    ERROR,
    WARN,
    INFO,
    VERBOSE
}

/**
 * Remove sensitive info from log messages
 */
export function filterForLogging (str: string): string {
    let toFilterOut: string[] = [
        process.env.DB_HOST,
        process.env.DB_USER,
        process.env.DB_PASS,
        process.env.DB,
    ].filter((s): s is string => !!s);
    
    for (const search of toFilterOut) {
        str = str.replace(search, '<REDACTED>');
    }
    
    return str;
}

class Logger {
    private fileHandle?: fs.WriteStream;
    private path = '';
    private level: LogLvl = LogLvl.VERBOSE;
    private dbLogLevel: LogLvl = 2;
    private dbQuery: queryFunc | undefined;
    private useConsole = true;
    private active = true;

    /**
     * Outputs a message to the console and/or file
     */
    public output(level: LogLvl, type: string, ...messages: any[]): void {
        if (!this.active || this.level < level) {
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
            console.log(filterForLogging(message));
        } else {
            fs.appendFileSync(this.path, filterForLogging(message) + '\n');
        }

        if (this.dbLogLevel >= level) {
            this.logToDB(removeColour(message)).then();
        }
    }

    private async logToDB(message: string, from = 'server'): Promise<mysql.OkPacket | undefined> {
        if (!this.dbQuery) return;
        return await this.dbQuery<mysql.OkPacket>`
            INSERT INTO logs (msg, madeBy)
            VALUES (${filterForLogging(message)}, ${from})
        `;
    }

    /**
     * Logs a message but only if the 'verbose' flag is set
     */
    public verbose(msg: string | TemplateStringsArray, ...params: any[]) {
        this.output(LogLvl.VERBOSE, c.grey`VERB`, tagFuncParamsToString(msg, params));
    }

    /**
     * Logs a message
     */
    public log(msg: string | TemplateStringsArray, ...params: any[]) {
        this.output(LogLvl.INFO, c.grey`INFO`, tagFuncParamsToString(msg, params));
    }

    /**
     * Logs a warning
     */
    public warn(msg: string | TemplateStringsArray, ...params: any[]) {
        this.output(LogLvl.WARN, c.yellow`WARN`, tagFuncParamsToString(msg, params));
    }

    /**
     * Logs an error
     */
    public error(msg: string | TemplateStringsArray, ...params: any[]) {
        this.output(LogLvl.ERROR, c.red`ERR`, tagFuncParamsToString(msg, params));
    }

    /**
     * Closes any active file handles
     */
    public async close(): Promise<unknown> {
        this.active = false;
        return new Promise(resolve => {
            this.fileHandle?.close?.(resolve);
        });
    }

    public setLogOptions(options: IFlags) {
        this.level = options.logLevel;
        this.dbLogLevel = options.dbLogLevel;
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
    
    public setupQuery(query: queryFunc) {
        this.dbQuery = query;
    }
    
    // Singleton instance of this class
    static instance: Logger = new Logger();
}

export function setupLogger(options: IFlags) {
    Logger.instance.setLogOptions(options);
}

export default Logger.instance;
