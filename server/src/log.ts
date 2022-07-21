import fs from 'fs';
import c from 'chalk';
import ErrnoException = NodeJS.ErrnoException;

class Logger {
    private fileHandle?: fs.WriteStream;
    private path_ = '';
    public level: LogLvl = 3;
    public useConsole = true;

    get path () {
        return this.path_;
    }

    set path (path: string) {
        this.path_ = path;

        if (!fs.existsSync(path)) {
            fs.writeFileSync(path, '');
        }

        this.fileHandle = fs.createWriteStream(path, {
            flags: 'a'
        });

        this.log('START', new Date().toISOString());
    }

    log (type: string, ...messages: any[]): void {
        messages = messages.map(r => JSON.stringify(r, undefined, 5));
        let out = `[${type}] ${messages.join(' ')}`;
        if (this.useConsole) {
            console.log(out);
        } else {
            fs.appendFileSync(this.path, out + '\n');
        }
    }

    async exit (): Promise<ErrnoException | null | undefined> {
        return new Promise((resolve) => {
            this.fileHandle?.close(resolve);
        });
    }
}

export enum LogLvl {
    NONE,
    NO_WARN,
    NO_INFO,
    ALL,
    VERBOSE
}

const logger = new Logger;

export async function close () {
    return await logger.exit();
}

export function setLogOptions (options: any) {
    if ('level' in options) logger.level = options.level;
    if ('useConsole' in options) logger.useConsole = options.useConsole;
    if ('logTo' in options) logger.path = options.logTo;
}

/**
 * Reduces the parameters to a template string function into a single string
 */
function reduceToMsg (msg: TemplateStringsArray, params: any[]) {
    return msg.reduce((acc, cur, i) => {
        if (typeof params[i] === 'object') {
            params[i] = JSON.stringify(params[i]);
        }
        let paramStr = (params[i] || '').toString();
        return acc + cur + paramStr;
    }, '');
}

/**
 * Logs a message
 */
export default function (msg: string | TemplateStringsArray, ...params: any[]) {
    if (logger.level < LogLvl.ALL) {
        return;
    }

    if (typeof msg === 'string') {
        logger.log(c.grey`LOG`, msg, ...params);
        return;
    }

    logger.log(c.grey`LOG`, reduceToMsg(msg, params));
}

/**
 * Logs a warning
 */
export function warning (msg: string | TemplateStringsArray, ...params: any[]) {
    if (logger.level < LogLvl.NO_INFO) {
        return;
    }

    if (typeof msg === 'string') {
        logger.log(c.yellow`WARN`, msg + ' ' + params.join(' '));
        return;
    }

    // convert the template string to a string
    const message = msg.reduce((acc, cur, i) => {
        return acc + cur + (params[i] || '');
    }, '');

    logger.log(c.yellow`WARN`, message);
}

/**
 * Logs a warning
 */
export function error (msg: string | TemplateStringsArray, ...params: any[]) {
    if (logger.level < LogLvl.NO_WARN) {
        return;
    }

    if (typeof msg === 'string') {
        logger.log(c.red`ERR`, msg + ' ' + params.join(' '));
        return;
    }

    // convert the template string to a string
    const message = msg.reduce((acc, cur, i) => {
        return acc + cur + (params[i] || '');
    }, '');

    logger.log(c.red`ERR`, message);
}
