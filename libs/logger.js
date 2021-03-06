var winston = require('winston');
/**
 * Sets up and returns global winston logger instance.
 * @return {winston.Logger}
 */
function setupLogger() {
    // setup winston logger
    var winstonLogger = new winston.Logger();
    winstonLogger.add(winston.transports.Console);
    winstonLogger.add(winston.transports.File, { filename: 'excep.log',maxsize: 1024 * 1024});
    return winstonLogger;
}

/**
 * Global winston logger instance.
 * @type {winston.Logger}
 */
module.exports = setupLogger();
