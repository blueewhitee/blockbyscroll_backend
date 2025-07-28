/**
 * Centralized logging utility for the NoMoScroll backend.
 * 
 * Provides structured logging with configurable levels to prevent
 * sensitive data from being logged in production environments.
 * 
 * Log Levels (in order of severity):
 * - DEBUG: Detailed information for debugging (includes sensitive data)
 * - INFO: General operational information
 * - WARN: Warning messages for potential issues
 * - ERROR: Error conditions that need attention
 * 
 * Usage:
 * - Set LOG_LEVEL environment variable to control verbosity
 * - Defaults to INFO level for production safety
 * - Use logger.debug() for sensitive data that should only appear in development
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  [key: string]: any;
}

class Logger {
  private currentLevel: LogLevel;
  private serviceName: string;

  constructor() {
    this.serviceName = 'nomoscroll-backend';
    this.currentLevel = this.parseLogLevel(process.env.LOG_LEVEL || 'INFO');
  }

  private parseLogLevel(level: string): LogLevel {
    const normalizedLevel = level.toUpperCase();
    switch (normalizedLevel) {
      case 'DEBUG':
        return LogLevel.DEBUG;
      case 'INFO':
        return LogLevel.INFO;
      case 'WARN':
      case 'WARNING':
        return LogLevel.WARN;
      case 'ERROR':
        return LogLevel.ERROR;
      default:
        // Default to INFO for safety - won't log DEBUG messages in production
        return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  private formatLogEntry(level: string, message: string, metadata?: Record<string, any>): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: level.toLowerCase(),
      message,
      service: this.serviceName
    };

    // Add any additional metadata
    if (metadata) {
      Object.assign(entry, metadata);
    }

    return entry;
  }

  private writeLog(entry: LogEntry): void {
    try {
      // Use JSON.stringify for structured logging compatible with Cloud Run
      console.log(JSON.stringify(entry));
    } catch (error) {
      // Fallback to simple console.log if JSON serialization fails
      console.log(`[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`);
    }
  }

  /**
   * Log debug messages. Only appears when LOG_LEVEL=DEBUG.
   * Use this for sensitive data like API keys, request/response bodies, etc.
   */
  debug(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry = this.formatLogEntry('DEBUG', message, metadata);
      this.writeLog(entry);
    }
  }

  /**
   * Log general operational information.
   * Use this for normal application flow, startup messages, etc.
   */
  info(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry = this.formatLogEntry('INFO', message, metadata);
      this.writeLog(entry);
    }
  }

  /**
   * Log warning messages for potential issues.
   * Use this for recoverable errors, validation warnings, etc.
   */
  warn(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.formatLogEntry('WARN', message, metadata);
      this.writeLog(entry);
    }
  }

  /**
   * Log error conditions that need attention.
   * Use this for exceptions, API failures, etc.
   */
  error(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry = this.formatLogEntry('ERROR', message, metadata);
      this.writeLog(entry);
    }
  }

  /**
   * Get the current log level for debugging purposes
   */
  getCurrentLevel(): string {
    return LogLevel[this.currentLevel];
  }

  /**
   * Check if a specific level would be logged
   */
  isLevelEnabled(level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'): boolean {
    const levelEnum = LogLevel[level as keyof typeof LogLevel];
    return this.shouldLog(levelEnum);
  }
}

// Export a singleton instance
export const logger = new Logger();

// Export the class for testing purposes
export { Logger };
