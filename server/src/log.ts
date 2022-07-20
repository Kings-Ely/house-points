import fs from 'fs';

class Logger {
    private fileHandle?: fs.WriteStream;
    private path_ = '';
    public level: LogLvl = 3;
    public useConsole = false;

    get path () {
        return this.path_;
    }

    set path (path: string) {
        this.path_ = path;

        // create file if it doesn't exist or delete contents if it does
        fs.writeFileSync(path, '');

        this.fileHandle = fs.createWriteStream(path, {
            flags: 'a'
        });
    }

    constructor (path: string) {
        this.path = path;
    }

    log (type: string, message: string) {
        let out = `[${type}] ${message}`;
        if (this.useConsole) {
            console.log(out);
        } else {
            fs.appendFileSync(this.path, out + '\n');
        }
    }
}

export enum LogLvl {
    NONE,
    NO_WARN,
    NO_INFO,
    ALL,
    VERBOSE
}

const logger = new Logger('./error.log');

export function setLogOptions (options: any) {
    if (options.path) logger.path = options.path;
    if ('level' in options) logger.level = options.level;
    if ('useConsole' in options) logger.useConsole = options.useConsole;
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
        logger.log('LOG', msg + params.join(' '));
        return;
    }

    logger.log('LOG', reduceToMsg(msg, params));
}

/**
 * Logs a warning
 */
export function warning (msg: string | TemplateStringsArray, ...params: any[]) {
    if (logger.level < LogLvl.NO_INFO) {
        return;
    }

    if (typeof msg === 'string') {
        logger.log('WARN', msg + params.join(' '));
        return;
    }

    // convert the template string to a string
    const message = msg.reduce((acc, cur, i) => {
        return acc + cur + (params[i] || '');
    }, '');

    logger.log('WARN', message);
}

/**
 * Logs a warning
 */
export function error (msg: string | TemplateStringsArray, ...params: any[]) {
    if (logger.level < LogLvl.NO_WARN) {
        return;
    }

    if (typeof msg === 'string') {
        logger.log('ERR', msg + params.join(' '));
        return;
    }

    // convert the template string to a string
    const message = msg.reduce((acc, cur, i) => {
        return acc + cur + (params[i] || '');
    }, '');

    logger.log('ERR', message);
}
