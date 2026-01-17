/**
 * Logger Utility
 * Centralized logging for the application
 */

const fs = require('fs');
const path = require('path');

const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL || 'info'];

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Format log message
 */
const formatMessage = (level, message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
};

/**
 * Write to log file
 */
const writeToFile = (level, message, meta) => {
    const logFile = path.join(logsDir, `${level}.log`);
    const formattedMessage = formatMessage(level, message, meta);
    fs.appendFileSync(logFile, formattedMessage + '\n');
};

/**
 * Log to console and file
 */
const log = (level, message, meta = {}) => {
    if (LOG_LEVELS[level] <= currentLevel) {
        const formattedMessage = formatMessage(level, message, meta);

        // Console output with colors
        const colors = {
            error: '\x1b[31m',
            warn: '\x1b[33m',
            info: '\x1b[36m',
            debug: '\x1b[90m'
        };
        const reset = '\x1b[0m';
        console.log(`${colors[level]}${formattedMessage}${reset}`);

        // File output
        writeToFile(level, message, meta);
    }
};

const logger = {
    error: (message, meta) => log('error', message, meta),
    warn: (message, meta) => log('warn', message, meta),
    info: (message, meta) => log('info', message, meta),
    debug: (message, meta) => log('debug', message, meta)
};

module.exports = { logger };
