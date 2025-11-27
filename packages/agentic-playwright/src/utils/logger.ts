/**
 * Logging utility for Playwright MCP Server
 * @module utils/logger
 */

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
  timestamp?: boolean;
}

/**
 * Logger class for consistent logging across the application
 */
class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    const levelStr = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    const level = LogLevel[levelStr as keyof typeof LogLevel] ?? LogLevel.INFO;

    this.config = {
      level,
      prefix: config.prefix || '[agentic-playwright]',
      timestamp: config.timestamp ?? true,
    };
  }

  /**
   * Format log message with timestamp and prefix
   */
  private format(level: string, message: string, data?: unknown): string {
    const parts: string[] = [];

    if (this.config.timestamp) {
      parts.push(new Date().toISOString());
    }

    parts.push(this.config.prefix || '');
    parts.push(`[${level}]`);
    parts.push(message);

    let formatted = parts.filter(Boolean).join(' ');

    if (data !== undefined) {
      formatted += '\n' + JSON.stringify(data, null, 2);
    }

    return formatted;
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: unknown): void {
    if (this.config.level <= LogLevel.DEBUG) {
      console.debug(this.format('DEBUG', message, data));
    }
  }

  /**
   * Log info message
   */
  info(message: string, data?: unknown): void {
    if (this.config.level <= LogLevel.INFO) {
      console.info(this.format('INFO', message, data));
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: unknown): void {
    if (this.config.level <= LogLevel.WARN) {
      console.warn(this.format('WARN', message, data));
    }
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown): void {
    if (this.config.level <= LogLevel.ERROR) {
      const errorData =
        error instanceof Error
          ? {
              errorName: error.name,
              errorMessage: error.message,
              stack: error.stack,
            }
          : error;

      console.error(this.format('ERROR', message, errorData));
    }
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }
}

/**
 * Singleton logger instance
 */
export const logger = new Logger();

/**
 * Create a child logger with a custom prefix
 */
export function createLogger(prefix: string): Logger {
  return new Logger({ prefix: `[${prefix}]` });
}
