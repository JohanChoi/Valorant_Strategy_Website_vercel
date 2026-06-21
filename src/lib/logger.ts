// Logger utility for consistent logging across the application
// Log levels: 'error' | 'warn' | 'info' | 'debug'

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const getCurrentLogLevel = (): LogLevel => {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel | undefined;
  
  // Default to 'info' if not set
  if (!envLevel || !(envLevel in LOG_LEVELS)) {
    return 'info';
  }
  
  return envLevel;
};

const currentLogLevel = getCurrentLogLevel();
const currentLogLevelValue = LOG_LEVELS[currentLogLevel];

const formatLog = (level: LogLevel, message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  if (data) {
    return `${prefix} ${message}`, data;
  }
  return `${prefix} ${message}`;
};

export const logger = {
  error: (message: string, data?: unknown) => {
    if (LOG_LEVELS.error <= currentLogLevelValue) {
      console.error(...(Array.isArray(formatLog('error', message, data)) ? formatLog('error', message, data) : [formatLog('error', message, data)]));
    }
  },
  warn: (message: string, data?: unknown) => {
    if (LOG_LEVELS.warn <= currentLogLevelValue) {
      console.warn(...(Array.isArray(formatLog('warn', message, data)) ? formatLog('warn', message, data) : [formatLog('warn', message, data)]));
    }
  },
  info: (message: string, data?: unknown) => {
    if (LOG_LEVELS.info <= currentLogLevelValue) {
      console.info(...(Array.isArray(formatLog('info', message, data)) ? formatLog('info', message, data) : [formatLog('info', message, data)]));
    }
  },
  debug: (message: string, data?: unknown) => {
    if (LOG_LEVELS.debug <= currentLogLevelValue) {
      console.debug(...(Array.isArray(formatLog('debug', message, data)) ? formatLog('debug', message, data) : [formatLog('debug', message, data)]));
    }
  },
};
