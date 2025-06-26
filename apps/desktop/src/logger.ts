/**
 * 日志系统
 * 提供统一的日志记录和错误处理
 */

import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  stack?: string;
}

export class Logger {
  private logDir: string;
  private logFile: string;
  private currentLevel: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.currentLevel = level;
    this.logDir = path.join(app.getPath('userData'), 'logs');
    this.logFile = path.join(this.logDir, `minglog-${this.getDateString()}.log`);
    
    this.ensureLogDirectory();
    this.cleanOldLogs();
  }

  private getDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private cleanOldLogs(): void {
    try {
      const files = fs.readdirSync(this.logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7); // 保留7天的日志

      files.forEach(file => {
        if (file.startsWith('minglog-') && file.endsWith('.log')) {
          const filePath = path.join(this.logDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime < cutoffDate) {
            fs.unlinkSync(filePath);
          }
        }
      });
    } catch (error) {
      console.error('清理旧日志失败:', error);
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    const levelName = LogLevel[entry.level];
    let formatted = `[${entry.timestamp}] [${levelName}] ${entry.message}`;
    
    if (entry.data) {
      formatted += `\nData: ${JSON.stringify(entry.data, null, 2)}`;
    }
    
    if (entry.stack) {
      formatted += `\nStack: ${entry.stack}`;
    }
    
    return formatted + '\n';
  }

  private writeToFile(entry: LogEntry): void {
    try {
      const formatted = this.formatLogEntry(entry);
      fs.appendFileSync(this.logFile, formatted);
    } catch (error) {
      console.error('写入日志文件失败:', error);
    }
  }

  private log(level: LogLevel, message: string, data?: any, error?: Error): void {
    if (level < this.currentLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      stack: error?.stack
    };

    // 输出到控制台
    const levelName = LogLevel[level];
    const consoleMessage = `[${levelName}] ${message}`;
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(consoleMessage, data);
        break;
      case LogLevel.INFO:
        console.info(consoleMessage, data);
        break;
      case LogLevel.WARN:
        console.warn(consoleMessage, data);
        break;
      case LogLevel.ERROR:
        console.error(consoleMessage, data, error);
        break;
    }

    // 写入文件
    this.writeToFile(entry);
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, error?: Error, data?: any): void {
    this.log(LogLevel.ERROR, message, data, error);
  }

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  getLogFile(): string {
    return this.logFile;
  }
}

// 创建全局日志实例
export const logger = new Logger(
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO
);
