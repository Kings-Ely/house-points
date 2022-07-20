class Logger {
    private path: string;

    constructor(path: string) {
        this.path = path;
    }
    log (message: string) {
        console.log(`[${new Date()}] ${message}`);
    }
}

const logger = new Logger('./error.log');

export default function (msg: string) {
    logger.log(msg);
}
