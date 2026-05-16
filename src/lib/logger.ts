/* eslint-disable @typescript-eslint/no-explicit-any */

const IS_DEV = process.env.NODE_ENV === "development";

const logger = {
  info: (message: string, ...args: any[]) => {
    if (IS_DEV) {
      console.log(`[INFO] [${new Date().toISOString()}] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, ...args);
  },
  error: (message: string, error?: any, ...args: any[]) => {
    console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, error, ...args);
  },
};

export default logger;
