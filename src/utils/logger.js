
/**
 * This is our app's diary (logger).
 * It writes messages to the console AND to a file (in production).
 * Different colors help us see what's important:
 * - 🔵 Info = normal stuff
 * - 🟡 Warning = something's off but not broken
 * - 🔴 Error = something broke!
 * - 🟢 Success = everything worked!
 */

const fs = require('fs');
const path = require('path');

// Log levels (like severity levels)
const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  SUCCESS: 'SUCCESS',
  DEBUG: 'DEBUG'
};

class Logger {
  constructor() {
    // In production, we also write to a file
    this.logFile = path.join(__dirname, '../../logs/app.log');
    this.enableFileLogging = process.env.NODE_ENV === 'production';
    
    // Create logs directory if it doesn't exist
    if (this.enableFileLogging) {
      const logsDir = path.dirname(this.logFile);
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
    }
  }
  
  /**
   * Main log function
   * @param {string} level - LOG_LEVELS.INFO, WARN, etc.
   * @param {string} message - What happened
   * @param {object} data - Optional extra data
   */
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data })
    };
    
    // Colors for console (makes it easy to read)
    const colors = {
      INFO: '\x1b[36m',     // Cyan
      WARN: '\x1b[33m',     // Yellow
      ERROR: '\x1b[31m',    // Red
      SUCCESS: '\x1b[32m',  // Green
      DEBUG: '\x1b[35m'     // Magenta
    };
    const resetColor = '\x1b[0m';
    
    // Print to console with color
    const color = colors[level] || resetColor;
    console.log(`${color}[${timestamp}] [${level}] ${message}${resetColor}`);
    if (data) {
      console.log(`  ${JSON.stringify(data, null, 2)}`);
    }
    
    // Write to file in production
    if (this.enableFileLogging) {
      const logString = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(this.logFile, logString);
    }
  }
  
  // Shortcut methods (easier to use)
  info(message, data = null) {
    this.log(LOG_LEVELS.INFO, message, data);
  }
  
  warn(message, data = null) {
    this.log(LOG_LEVELS.WARN, message, data);
  }
  
  error(message, data = null) {
    this.log(LOG_LEVELS.ERROR, message, data);
  }
  
  success(message, data = null) {
    this.log(LOG_LEVELS.SUCCESS, message, data);
  }
  
  debug(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      this.log(LOG_LEVELS.DEBUG, message, data);
    }
  }
}

module.exports = new Logger();