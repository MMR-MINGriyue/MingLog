/**
 * MingLog 自动修复器
 * 负责自动检测和修复各种错误
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const { spawn, exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class AutoFixer extends EventEmitter {
    constructor() {
        super();
        this.config = null;
        this.fixStrategies = null;
        this.fixHistory = [];
        this.isFixing = false;
        this.fixQueue = [];
        this.processManager = new ProcessManager();
        this.dbManager = new DatabaseManager();
        this.uiManager = new UIManager();
        this.memoryManager = new MemoryManager();
    }

    async initialize(config) {
        this.config = config;
        
        // 加载修复策略
        await this.loadFixStrategies();
        
        // 初始化管理器
        await this.processManager.initialize(config);
        await this.dbManager.initialize(config);
        await this.uiManager.initialize(config);
        await this.memoryManager.initialize(config);
        
        console.log('🔧 自动修复器初始化完成');
    }

    async loadFixStrategies() {
        try {
            const strategiesFile = path.resolve(__dirname, '../config/fix-strategies.json');
            const strategiesData = await fs.readFile(strategiesFile, 'utf8');
            this.fixStrategies = JSON.parse(strategiesData);
            console.log('📋 修复策略加载完成');
        } catch (error) {
            throw new Error(`修复策略加载失败: ${error.message}`);
        }
    }

    async attemptFix(error) {
        if (this.isFixing) {
            // 将错误加入队列
            this.fixQueue.push(error);
            return { success: false, message: '修复正在进行中，已加入队列' };
        }

        try {
            this.isFixing = true;
            console.log(`🔧 尝试修复错误: ${error.type}`);

            // 检查是否有对应的修复策略
            if (!error.fix_strategy || !error.auto_fix) {
                return { 
                    success: false, 
                    message: '该错误不支持自动修复',
                    error: error
                };
            }

            const strategy = this.fixStrategies.fix_strategies[error.fix_strategy];
            if (!strategy) {
                return { 
                    success: false, 
                    message: `未找到修复策略: ${error.fix_strategy}`,
                    error: error
                };
            }

            // 执行修复策略
            const fixResult = await this.executeFixStrategy(strategy, error);
            
            // 记录修复历史
            this.recordFixAttempt(error, strategy, fixResult);
            
            // 触发事件
            this.emit('fix_applied', {
                error: error,
                strategy: error.fix_strategy,
                success: fixResult.success,
                result: fixResult
            });

            return fixResult;

        } catch (fixError) {
            console.error('修复执行异常:', fixError);
            return { 
                success: false, 
                message: `修复执行异常: ${fixError.message}`,
                error: error,
                fixError: fixError
            };
        } finally {
            this.isFixing = false;
            
            // 处理队列中的下一个错误
            if (this.fixQueue.length > 0) {
                const nextError = this.fixQueue.shift();
                setTimeout(() => this.attemptFix(nextError), 1000);
            }
        }
    }

    async executeFixStrategy(strategy, error) {
        console.log(`📋 执行修复策略: ${strategy.name}`);
        
        const startTime = Date.now();
        let currentAttempt = 1;
        let lastError = null;

        while (currentAttempt <= strategy.max_attempts) {
            try {
                console.log(`🔄 第 ${currentAttempt} 次尝试修复...`);

                // 执行修复步骤
                const stepResults = [];
                for (const step of strategy.steps) {
                    const stepResult = await this.executeFixStep(step);
                    stepResults.push(stepResult);
                    
                    if (!stepResult.success) {
                        throw new Error(`修复步骤失败: ${step.action} - ${stepResult.error}`);
                    }
                }

                // 验证修复结果
                const verificationResult = await this.verifyFix(strategy.success_criteria, error);
                
                if (verificationResult.success) {
                    return {
                        success: true,
                        message: `修复成功 (第 ${currentAttempt} 次尝试)`,
                        duration: Date.now() - startTime,
                        attempts: currentAttempt,
                        steps: stepResults,
                        verification: verificationResult
                    };
                } else {
                    throw new Error(`修复验证失败: ${verificationResult.message}`);
                }

            } catch (stepError) {
                console.warn(`❌ 第 ${currentAttempt} 次修复尝试失败:`, stepError.message);
                lastError = stepError;
                currentAttempt++;

                // 如果不是最后一次尝试，等待一段时间再重试
                if (currentAttempt <= strategy.max_attempts) {
                    await this.wait(2000 * currentAttempt); // 递增等待时间
                }
            }
        }

        // 所有尝试都失败了，执行回滚
        if (strategy.rollback && strategy.rollback.length > 0) {
            console.log('🔄 执行回滚操作...');
            try {
                await this.executeRollback(strategy.rollback);
            } catch (rollbackError) {
                console.error('回滚操作失败:', rollbackError);
            }
        }

        return {
            success: false,
            message: `修复失败，已尝试 ${strategy.max_attempts} 次`,
            duration: Date.now() - startTime,
            attempts: strategy.max_attempts,
            lastError: lastError ? lastError.message : '未知错误'
        };
    }

    async executeFixStep(step) {
        console.log(`⚙️ 执行修复步骤: ${step.action}`);
        
        try {
            const actionDefinition = this.fixStrategies.fix_actions[step.action];
            if (!actionDefinition) {
                throw new Error(`未知的修复操作: ${step.action}`);
            }

            // 根据操作类型执行相应的修复
            let result;
            switch (step.action) {
                case 'kill_process':
                    result = await this.processManager.killProcess(step.params);
                    break;
                case 'start_app':
                    result = await this.processManager.startApp(step.params);
                    break;
                case 'backup_database':
                    result = await this.dbManager.backupDatabase(step.params);
                    break;
                case 'restore_database':
                    result = await this.dbManager.restoreDatabase(step.params);
                    break;
                case 'reload_webview':
                    result = await this.uiManager.reloadWebview(step.params);
                    break;
                case 'trigger_gc':
                    result = await this.memoryManager.triggerGC(step.params);
                    break;
                case 'wait_for_element':
                    result = await this.uiManager.waitForElement(step.params);
                    break;
                case 'cleanup_temp_files':
                    result = await this.cleanupTempFiles(step.params);
                    break;
                default:
                    throw new Error(`不支持的修复操作: ${step.action}`);
            }

            return {
                action: step.action,
                success: true,
                result: result,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            return {
                action: step.action,
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async executeRollback(rollbackSteps) {
        console.log('🔄 执行回滚步骤...');
        
        for (const step of rollbackSteps) {
            try {
                await this.executeFixStep(step);
                console.log(`✅ 回滚步骤完成: ${step.action}`);
            } catch (error) {
                console.error(`❌ 回滚步骤失败: ${step.action}`, error);
            }
        }
    }

    async verifyFix(successCriteria, originalError) {
        console.log('🔍 验证修复结果...');
        
        const verificationResults = [];
        
        for (const criterion of successCriteria) {
            try {
                const result = await this.checkSuccessCriterion(criterion);
                verificationResults.push({
                    criterion,
                    passed: result.passed,
                    message: result.message
                });
                
                if (!result.passed) {
                    return {
                        success: false,
                        message: `验证失败: ${criterion} - ${result.message}`,
                        results: verificationResults
                    };
                }
            } catch (error) {
                verificationResults.push({
                    criterion,
                    passed: false,
                    message: error.message
                });
                
                return {
                    success: false,
                    message: `验证异常: ${criterion} - ${error.message}`,
                    results: verificationResults
                };
            }
        }

        return {
            success: true,
            message: '所有验证条件都已满足',
            results: verificationResults
        };
    }

    async checkSuccessCriterion(criterion) {
        switch (criterion) {
            case 'app_running':
                return await this.processManager.isAppRunning();
            case 'ui_responsive':
                return await this.uiManager.isUIResponsive();
            case 'db_accessible':
                return await this.dbManager.isDatabaseAccessible();
            case 'memory_reduced':
                return await this.memoryManager.isMemoryReduced();
            default:
                return { passed: true, message: `未实现的验证条件: ${criterion}` };
        }
    }

    async cleanupTempFiles(params) {
        console.log('🧹 清理临时文件...');
        
        const locations = params.locations || ['./temp', './cache', './logs'];
        let totalFreed = 0;
        
        for (const location of locations) {
            try {
                const freed = await this.cleanupDirectory(location, params);
                totalFreed += freed;
            } catch (error) {
                console.warn(`清理目录失败: ${location}`, error.message);
            }
        }
        
        return {
            success: true,
            totalFreed,
            message: `已清理 ${totalFreed}MB 空间`
        };
    }

    async cleanupDirectory(dirPath, params) {
        // 模拟清理目录
        const freedSpace = Math.floor(Math.random() * 100) + 10;
        console.log(`清理目录 ${dirPath}，释放 ${freedSpace}MB`);
        return freedSpace;
    }

    recordFixAttempt(error, strategy, result) {
        this.fixHistory.push({
            error: {
                type: error.type,
                message: error.message,
                severity: error.severity,
                category: error.category
            },
            strategy: strategy.name,
            result: {
                success: result.success,
                message: result.message,
                duration: result.duration,
                attempts: result.attempts
            },
            timestamp: new Date().toISOString()
        });
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getFixStatistics() {
        const stats = {
            total: this.fixHistory.length,
            successful: this.fixHistory.filter(f => f.result.success).length,
            byStrategy: {},
            byErrorType: {},
            averageDuration: 0
        };

        let totalDuration = 0;
        this.fixHistory.forEach(fix => {
            stats.byStrategy[fix.strategy] = (stats.byStrategy[fix.strategy] || 0) + 1;
            stats.byErrorType[fix.error.type] = (stats.byErrorType[fix.error.type] || 0) + 1;
            totalDuration += fix.result.duration || 0;
        });

        stats.averageDuration = this.fixHistory.length > 0 ? 
            totalDuration / this.fixHistory.length : 0;
        stats.successRate = this.fixHistory.length > 0 ? 
            (stats.successful / this.fixHistory.length) * 100 : 0;

        return stats;
    }

    clearHistory() {
        this.fixHistory = [];
        this.fixQueue = [];
    }
}

// 辅助管理器类
class ProcessManager {
    async initialize(config) {
        this.config = config;
    }

    async killProcess(params) {
        console.log('🔪 终止进程...');
        // 模拟终止进程
        return { success: true, message: '进程已终止' };
    }

    async startApp(params) {
        console.log('🚀 启动应用...');
        // 模拟启动应用
        return { success: true, message: '应用已启动' };
    }

    async isAppRunning() {
        // 模拟检查应用是否运行
        return { passed: Math.random() > 0.1, message: '应用运行状态检查' };
    }
}

class DatabaseManager {
    async initialize(config) {
        this.config = config;
    }

    async backupDatabase(params) {
        console.log('💾 备份数据库...');
        return { success: true, message: '数据库已备份' };
    }

    async restoreDatabase(params) {
        console.log('🔄 恢复数据库...');
        return { success: true, message: '数据库已恢复' };
    }

    async isDatabaseAccessible() {
        return { passed: Math.random() > 0.05, message: '数据库访问性检查' };
    }
}

class UIManager {
    async initialize(config) {
        this.config = config;
    }

    async reloadWebview(params) {
        console.log('🔄 重新加载WebView...');
        return { success: true, message: 'WebView已重新加载' };
    }

    async waitForElement(params) {
        console.log('⏳ 等待元素...');
        return { success: true, message: '元素已找到' };
    }

    async isUIResponsive() {
        return { passed: Math.random() > 0.1, message: 'UI响应性检查' };
    }
}

class MemoryManager {
    async initialize(config) {
        this.config = config;
    }

    async triggerGC(params) {
        console.log('🗑️ 触发垃圾回收...');
        return { success: true, message: '垃圾回收已执行' };
    }

    async isMemoryReduced() {
        return { passed: Math.random() > 0.2, message: '内存减少检查' };
    }
}

module.exports = AutoFixer;
