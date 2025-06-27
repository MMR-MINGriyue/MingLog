"use strict";
/**
 * 应用配置管理
 * 处理用户设置、窗口状态等配置信息
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
exports.configManager = exports.ConfigManager = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const electron_1 = require("electron");
const logger_1 = require("./logger");
class ConfigManager {
    constructor() {
        this.configPath = path.join(electron_1.app.getPath('userData'), 'config.json');
        this.defaultConfig = {
            windowState: {
                width: 1200,
                height: 800,
                isMaximized: false,
                isFullScreen: false
            },
            theme: 'system',
            language: 'zh-CN',
            autoUpdate: true,
            startMinimized: false,
            fontSize: 14,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            lineHeight: 1.6,
            devTools: process.env.NODE_ENV === 'development',
            debugMode: process.env.NODE_ENV === 'development'
        };
        this.config = this.loadConfig();
    }
    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const configData = fs.readFileSync(this.configPath, 'utf-8');
                const parsedConfig = JSON.parse(configData);
                // 合并默认配置和用户配置
                const config = { ...this.defaultConfig, ...parsedConfig };
                // 确保窗口状态的完整性
                config.windowState = { ...this.defaultConfig.windowState, ...parsedConfig.windowState };
                logger_1.logger.info('配置文件加载成功', { path: this.configPath });
                return config;
            }
        }
        catch (error) {
            logger_1.logger.error('加载配置文件失败，使用默认配置', error, { path: this.configPath });
        }
        return { ...this.defaultConfig };
    }
    saveConfig() {
        try {
            const configDir = path.dirname(this.configPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
            logger_1.logger.debug('配置文件保存成功', { path: this.configPath });
        }
        catch (error) {
            logger_1.logger.error('保存配置文件失败', error, { path: this.configPath });
        }
    }
    // 获取配置
    get(key) {
        return this.config[key];
    }
    // 设置配置
    set(key, value) {
        this.config[key] = value;
        this.saveConfig();
        logger_1.logger.debug('配置已更新', { key, value });
    }
    // 获取完整配置
    getAll() {
        return { ...this.config };
    }
    // 重置为默认配置
    reset() {
        this.config = { ...this.defaultConfig };
        this.saveConfig();
        logger_1.logger.info('配置已重置为默认值');
    }
    // 窗口状态管理
    getWindowState() {
        return { ...this.config.windowState };
    }
    setWindowState(state) {
        this.config.windowState = { ...this.config.windowState, ...state };
        this.saveConfig();
    }
    // 主题管理
    getTheme() {
        return this.config.theme;
    }
    setTheme(theme) {
        this.set('theme', theme);
    }
    // 语言管理
    getLanguage() {
        return this.config.language;
    }
    setLanguage(language) {
        this.set('language', language);
    }
    // 编辑器设置
    getEditorConfig() {
        return {
            fontSize: this.config.fontSize,
            fontFamily: this.config.fontFamily,
            lineHeight: this.config.lineHeight
        };
    }
    setEditorConfig(config) {
        if (config.fontSize !== undefined)
            this.set('fontSize', config.fontSize);
        if (config.fontFamily !== undefined)
            this.set('fontFamily', config.fontFamily);
        if (config.lineHeight !== undefined)
            this.set('lineHeight', config.lineHeight);
    }
    // 开发设置
    isDevelopment() {
        return this.config.debugMode || process.env.NODE_ENV === 'development';
    }
    shouldShowDevTools() {
        return this.config.devTools;
    }
    // 导出配置（用于备份）
    exportConfig() {
        return JSON.stringify(this.config, null, 2);
    }
    // 导入配置（用于恢复）
    importConfig(configJson) {
        try {
            const importedConfig = JSON.parse(configJson);
            // 验证配置格式
            if (typeof importedConfig === 'object' && importedConfig !== null) {
                this.config = { ...this.defaultConfig, ...importedConfig };
                this.saveConfig();
                logger_1.logger.info('配置导入成功');
                return true;
            }
        }
        catch (error) {
            logger_1.logger.error('配置导入失败', error);
        }
        return false;
    }
}
exports.ConfigManager = ConfigManager;
// 创建全局配置管理实例
exports.configManager = new ConfigManager();
