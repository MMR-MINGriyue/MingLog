/**
 * MingLog 错误检测器
 * 负责实时监控和检测各种类型的错误
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class ErrorDetector extends EventEmitter {
    constructor() {
        super();
        this.config = null;
        this.errorPatterns = null;
        this.isMonitoring = false;
        this.logBuffer = [];
        this.errorHistory = [];
        this.monitoringInterval = null;
        this.performanceMetrics = {
            memory: [],
            cpu: [],
            responseTime: []
        };
    }

    async initialize(config) {
        this.config = config;
        
        // 加载错误模式
        await this.loadErrorPatterns();
        
        // 初始化监控
        this.setupMonitoring();
        
        console.log('🔍 错误检测器初始化完成');
    }

    async loadErrorPatterns() {
        try {
            const patternsFile = path.resolve(__dirname, '../config/error-patterns.json');
            const patternsData = await fs.readFile(patternsFile, 'utf8');
            this.errorPatterns = JSON.parse(patternsData);
            console.log('📋 错误模式加载完成');
        } catch (error) {
            throw new Error(`错误模式加载失败: ${error.message}`);
        }
    }

    setupMonitoring() {
        if (this.config.monitoring.enabled) {
            this.startMonitoring();
        }
    }

    startMonitoring() {
        if (this.isMonitoring) {
            return;
        }

        this.isMonitoring = true;
        console.log('🔍 开始错误监控...');

        this.monitoringInterval = setInterval(() => {
            this.performHealthCheck();
        }, this.config.monitoring.health_check_interval);

        // 监控性能指标
        this.startPerformanceMonitoring();
    }

    stopMonitoring() {
        if (!this.isMonitoring) {
            return;
        }

        this.isMonitoring = false;
        console.log('🛑 停止错误监控');

        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }

    async performHealthCheck() {
        try {
            // 检查应用程序状态
            await this.checkApplicationHealth();
            
            // 检查性能指标
            await this.checkPerformanceMetrics();
            
            // 检查UI状态
            await this.checkUIHealth();
            
            // 分析日志
            await this.analyzeRecentLogs();
            
        } catch (error) {
            console.error('健康检查失败:', error);
            this.emit('error_detected', {
                type: 'health_check_failure',
                message: error.message,
                severity: 'medium',
                timestamp: new Date().toISOString()
            });
        }
    }

    async checkApplicationHealth() {
        // 检查进程是否运行
        const isRunning = await this.isApplicationRunning();
        if (!isRunning) {
            this.emit('error_detected', {
                type: 'app_not_running',
                message: '应用程序进程未运行',
                severity: 'critical',
                category: 'startup',
                timestamp: new Date().toISOString()
            });
            return;
        }

        // 检查响应性
        const responseTime = await this.measureResponseTime();
        if (responseTime > this.config.thresholds.response_time_ms) {
            this.emit('error_detected', {
                type: 'slow_response',
                message: `响应时间 ${responseTime}ms 超过阈值`,
                severity: 'medium',
                category: 'performance',
                timestamp: new Date().toISOString(),
                metrics: { responseTime }
            });
        }
    }

    async checkPerformanceMetrics() {
        // 检查内存使用
        const memoryUsage = await this.getMemoryUsage();
        this.performanceMetrics.memory.push({
            value: memoryUsage,
            timestamp: Date.now()
        });

        if (memoryUsage > this.config.thresholds.memory_usage_mb) {
            this.emit('error_detected', {
                type: 'high_memory_usage',
                message: `内存使用 ${memoryUsage}MB 超过阈值`,
                severity: 'high',
                category: 'performance',
                timestamp: new Date().toISOString(),
                metrics: { memoryUsage }
            });
        }

        // 检查内存泄漏
        await this.checkMemoryLeak();

        // 检查CPU使用
        const cpuUsage = await this.getCPUUsage();
        this.performanceMetrics.cpu.push({
            value: cpuUsage,
            timestamp: Date.now()
        });

        if (cpuUsage > this.config.thresholds.cpu_usage_percent) {
            this.emit('error_detected', {
                type: 'high_cpu_usage',
                message: `CPU使用率 ${cpuUsage}% 超过阈值`,
                severity: 'medium',
                category: 'performance',
                timestamp: new Date().toISOString(),
                metrics: { cpuUsage }
            });
        }
    }

    async checkMemoryLeak() {
        const recentMemory = this.performanceMetrics.memory.slice(-10);
        if (recentMemory.length < 5) return;

        // 检查内存是否持续增长
        let increasingCount = 0;
        for (let i = 1; i < recentMemory.length; i++) {
            if (recentMemory[i].value > recentMemory[i-1].value) {
                increasingCount++;
            }
        }

        if (increasingCount >= recentMemory.length * 0.8) {
            this.emit('error_detected', {
                type: 'memory_leak',
                message: '检测到可能的内存泄漏',
                severity: 'high',
                category: 'performance',
                timestamp: new Date().toISOString(),
                metrics: { memoryTrend: recentMemory }
            });
        }
    }

    async checkUIHealth() {
        // 这里应该集成UI监控逻辑
        // 暂时使用模拟检查
        const uiResponsive = await this.isUIResponsive();
        if (!uiResponsive) {
            this.emit('error_detected', {
                type: 'ui_not_responsive',
                message: 'UI界面无响应',
                severity: 'high',
                category: 'ui',
                timestamp: new Date().toISOString()
            });
        }
    }

    async analyzeRecentLogs() {
        // 分析最近的日志条目
        for (const logEntry of this.logBuffer) {
            await this.analyzeLogEntry(logEntry);
        }
        
        // 清空已分析的日志
        this.logBuffer = [];
    }

    async analyzeLogEntry(logEntry) {
        const { message, level, timestamp } = logEntry;
        
        // 遍历所有错误模式
        for (const [category, patterns] of Object.entries(this.errorPatterns)) {
            for (const [patternName, pattern] of Object.entries(patterns)) {
                const regex = new RegExp(pattern.pattern, 'i');
                
                if (regex.test(message)) {
                    const error = {
                        type: patternName,
                        message: message,
                        severity: pattern.severity,
                        category: pattern.category,
                        description: pattern.description,
                        symptoms: pattern.symptoms,
                        auto_fix: pattern.auto_fix,
                        fix_strategy: pattern.fix_strategy,
                        timestamp: timestamp || new Date().toISOString(),
                        logLevel: level
                    };

                    // 检查是否是重复错误
                    if (!this.isDuplicateError(error)) {
                        this.errorHistory.push(error);
                        this.emit('error_detected', error);
                    }
                    
                    break;
                }
            }
        }
    }

    isDuplicateError(error) {
        const recentErrors = this.errorHistory.slice(-10);
        return recentErrors.some(existing => 
            existing.type === error.type && 
            Date.now() - new Date(existing.timestamp).getTime() < 60000 // 1分钟内
        );
    }

    addLogEntry(message, level = 'info', timestamp = null) {
        this.logBuffer.push({
            message,
            level,
            timestamp: timestamp || new Date().toISOString()
        });

        // 立即分析严重错误
        if (level === 'error' || level === 'fatal') {
            this.analyzeLogEntry({ message, level, timestamp });
        }
    }

    // 模拟方法 - 在实际实现中应该连接到真实的监控API
    async isApplicationRunning() {
        // 检查进程是否存在
        return new Promise((resolve) => {
            setTimeout(() => resolve(true), 100);
        });
    }

    async measureResponseTime() {
        // 测量UI响应时间
        return new Promise((resolve) => {
            const start = Date.now();
            setTimeout(() => {
                resolve(Date.now() - start + Math.random() * 500);
            }, Math.random() * 200);
        });
    }

    async getMemoryUsage() {
        // 获取内存使用情况
        return Math.floor(Math.random() * 200) + 100; // 模拟100-300MB
    }

    async getCPUUsage() {
        // 获取CPU使用率
        return Math.floor(Math.random() * 30) + 10; // 模拟10-40%
    }

    async isUIResponsive() {
        // 检查UI是否响应
        return Math.random() > 0.1; // 90%概率响应正常
    }

    startPerformanceMonitoring() {
        setInterval(() => {
            this.checkPerformanceMetrics();
        }, this.config.monitoring.interval);
    }

    getErrorStatistics() {
        const stats = {
            total: this.errorHistory.length,
            byCategory: {},
            bySeverity: {},
            recent: this.errorHistory.filter(e => 
                Date.now() - new Date(e.timestamp).getTime() < 3600000 // 1小时内
            ).length
        };

        this.errorHistory.forEach(error => {
            stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
        });

        return stats;
    }

    clearErrorHistory() {
        this.errorHistory = [];
        this.performanceMetrics = {
            memory: [],
            cpu: [],
            responseTime: []
        };
    }
}

module.exports = ErrorDetector;
