"use strict";
/**
 * 日志系统
 * 提供统一的日志记录和错误处理
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = exports.LogLevel = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const electron_1 = require("electron");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor(level = LogLevel.INFO) {
        this.currentLevel = level;
        this.logDir = path.join(electron_1.app.getPath('userData'), 'logs');
        this.logFile = path.join(this.logDir, `minglog-${this.getDateString()}.log`);
        this.ensureLogDirectory();
        this.cleanOldLogs();
    }
    getDateString() {
        return new Date().toISOString().split('T')[0];
    }
    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }
    cleanOldLogs() {
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
        }
        catch (error) {
            console.error('清理旧日志失败:', error);
        }
    }
    formatLogEntry(entry) {
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
    writeToFile(entry) {
        try {
            const formatted = this.formatLogEntry(entry);
            fs.appendFileSync(this.logFile, formatted);
        }
        catch (error) {
            console.error('写入日志文件失败:', error);
        }
    }
    log(level, message, data, error) {
        if (level < this.currentLevel) {
            return;
        }
        const entry = {
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
    debug(message, data) {
        this.log(LogLevel.DEBUG, message, data);
    }
    info(message, data) {
        this.log(LogLevel.INFO, message, data);
    }
    warn(message, data) {
        this.log(LogLevel.WARN, message, data);
    }
    error(message, error, data) {
        this.log(LogLevel.ERROR, message, data, error);
    }
    setLevel(level) {
        this.currentLevel = level;
    }
    getLogFile() {
        return this.logFile;
    }
}
exports.Logger = Logger;
// 创建全局日志实例
exports.logger = new Logger(process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO);
