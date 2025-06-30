/**
 * MingLog 日志分析器
 * 负责分析应用程序日志并检测错误模式
 */

const EventEmitter = require('events');

class LogAnalyzer extends EventEmitter {
    constructor() {
        super();
        this.logBuffer = [];
        this.errorPatterns = null;
        this.analysisHistory = [];
        this.config = null;
    }

    async initialize(config, errorPatterns) {
        this.config = config;
        this.errorPatterns = errorPatterns;
        console.log('📊 日志分析器初始化完成');
    }

    analyzeLog(logMessage, level = 'info') {
        const logEntry = {
            message: logMessage.trim(),
            level,
            timestamp: new Date().toISOString(),
            analyzed: false
        };

        this.logBuffer.push(logEntry);

        // 立即分析严重错误
        if (level === 'error' || level === 'fatal') {
            this.analyzeLogEntry(logEntry);
        }

        // 保持缓冲区大小
        if (this.logBuffer.length > 1000) {
            this.logBuffer = this.logBuffer.slice(-500);
        }
    }

    async analyzeLogEntry(logEntry) {
        if (!this.errorPatterns) {
            return;
        }

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
                        timestamp: timestamp,
                        logLevel: level,
                        source: 'log_analysis'
                    };

                    this.analysisHistory.push({
                        logEntry,
                        detectedError: error,
                        timestamp: new Date().toISOString()
                    });

                    this.emit('error_detected', error);
                    logEntry.analyzed = true;
                    
                    break;
                }
            }
        }
    }

    async analyzeAllBufferedLogs() {
        console.log('📊 分析缓冲区中的所有日志...');
        
        const unanalyzedLogs = this.logBuffer.filter(log => !log.analyzed);
        
        for (const logEntry of unanalyzedLogs) {
            await this.analyzeLogEntry(logEntry);
        }
        
        console.log(`✅ 已分析 ${unanalyzedLogs.length} 条日志`);
    }

    getLogStatistics() {
        const stats = {
            totalLogs: this.logBuffer.length,
            byLevel: {},
            errorsDetected: this.analysisHistory.length,
            recentErrors: this.analysisHistory.filter(a => 
                Date.now() - new Date(a.timestamp).getTime() < 3600000 // 1小时内
            ).length
        };

        this.logBuffer.forEach(log => {
            stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
        });

        return stats;
    }

    getRecentLogs(count = 50) {
        return this.logBuffer.slice(-count);
    }

    searchLogs(query, options = {}) {
        const {
            level = null,
            startTime = null,
            endTime = null,
            caseSensitive = false
        } = options;

        let filteredLogs = this.logBuffer;

        // 按级别过滤
        if (level) {
            filteredLogs = filteredLogs.filter(log => log.level === level);
        }

        // 按时间范围过滤
        if (startTime) {
            filteredLogs = filteredLogs.filter(log => 
                new Date(log.timestamp) >= new Date(startTime)
            );
        }

        if (endTime) {
            filteredLogs = filteredLogs.filter(log => 
                new Date(log.timestamp) <= new Date(endTime)
            );
        }

        // 按查询字符串过滤
        if (query) {
            const searchRegex = new RegExp(
                query, 
                caseSensitive ? 'g' : 'gi'
            );
            
            filteredLogs = filteredLogs.filter(log => 
                searchRegex.test(log.message)
            );
        }

        return filteredLogs;
    }

    exportLogs(format = 'json') {
        const exportData = {
            metadata: {
                exportTime: new Date().toISOString(),
                totalLogs: this.logBuffer.length,
                analysisHistory: this.analysisHistory.length
            },
            logs: this.logBuffer,
            analysis: this.analysisHistory,
            statistics: this.getLogStatistics()
        };

        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(exportData, null, 2);
            case 'csv':
                return this.convertToCSV(this.logBuffer);
            case 'txt':
                return this.convertToText(this.logBuffer);
            default:
                throw new Error(`不支持的导出格式: ${format}`);
        }
    }

    convertToCSV(logs) {
        const headers = ['timestamp', 'level', 'message', 'analyzed'];
        const csvLines = [headers.join(',')];

        logs.forEach(log => {
            const row = [
                log.timestamp,
                log.level,
                `"${log.message.replace(/"/g, '""')}"`, // 转义CSV中的引号
                log.analyzed
            ];
            csvLines.push(row.join(','));
        });

        return csvLines.join('\n');
    }

    convertToText(logs) {
        return logs.map(log => 
            `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
        ).join('\n');
    }

    clearLogs() {
        this.logBuffer = [];
        this.analysisHistory = [];
        console.log('🧹 日志缓冲区已清空');
    }

    // 实时日志监控
    startRealtimeAnalysis() {
        console.log('🔍 开始实时日志分析...');
        
        this.realtimeInterval = setInterval(() => {
            this.analyzeAllBufferedLogs();
        }, 5000); // 每5秒分析一次
    }

    stopRealtimeAnalysis() {
        if (this.realtimeInterval) {
            clearInterval(this.realtimeInterval);
            this.realtimeInterval = null;
            console.log('🛑 停止实时日志分析');
        }
    }

    // 日志模式学习
    learnFromLogs() {
        console.log('🧠 从历史日志中学习模式...');
        
        const patterns = new Map();
        
        this.logBuffer.forEach(log => {
            if (log.level === 'error' || log.level === 'warn') {
                // 提取常见的错误模式
                const words = log.message.toLowerCase().split(/\s+/);
                const keyWords = words.filter(word => 
                    word.length > 3 && 
                    !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all'].includes(word)
                );
                
                keyWords.forEach(word => {
                    patterns.set(word, (patterns.get(word) || 0) + 1);
                });
            }
        });

        // 返回最常见的错误关键词
        const sortedPatterns = Array.from(patterns.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        console.log('📊 发现的常见错误模式:', sortedPatterns);
        return sortedPatterns;
    }

    // 生成日志报告
    generateLogReport() {
        const stats = this.getLogStatistics();
        const recentErrors = this.analysisHistory.slice(-10);
        const patterns = this.learnFromLogs();

        return {
            summary: stats,
            recentErrors,
            learnedPatterns: patterns,
            recommendations: this.generateRecommendations(stats, recentErrors)
        };
    }

    generateRecommendations(stats, recentErrors) {
        const recommendations = [];

        // 基于错误频率的建议
        if (stats.errorsDetected > 10) {
            recommendations.push({
                type: 'high_error_rate',
                message: '检测到大量错误，建议检查应用程序稳定性',
                priority: 'high'
            });
        }

        // 基于错误类型的建议
        const errorTypes = recentErrors.map(e => e.detectedError.category);
        const uniqueTypes = [...new Set(errorTypes)];
        
        if (uniqueTypes.includes('database')) {
            recommendations.push({
                type: 'database_issues',
                message: '检测到数据库相关错误，建议检查数据库连接和完整性',
                priority: 'medium'
            });
        }

        if (uniqueTypes.includes('ui')) {
            recommendations.push({
                type: 'ui_issues',
                message: '检测到UI相关错误，建议检查界面渲染和交互',
                priority: 'medium'
            });
        }

        return recommendations;
    }
}

module.exports = LogAnalyzer;
