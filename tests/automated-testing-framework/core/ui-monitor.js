/**
 * MingLog UI监控器
 * 负责监控用户界面的状态和交互
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class UIMonitor extends EventEmitter {
    constructor() {
        super();
        this.config = null;
        this.isMonitoring = false;
        this.screenshotCounter = 0;
        this.lastScreenshot = null;
        this.uiElements = new Map();
        this.interactionHistory = [];
        this.performanceMetrics = {
            renderTime: [],
            interactionDelay: [],
            animationFrameRate: []
        };
    }

    async initialize(config) {
        this.config = config;
        
        // 创建截图目录
        await this.createScreenshotDirectory();
        
        // 初始化UI元素映射
        this.initializeUIElements();
        
        console.log('🖥️ UI监控器初始化完成');
    }

    async createScreenshotDirectory() {
        const screenshotDir = path.join(this.config.reporting.output_directory, 'screenshots');
        try {
            await fs.mkdir(screenshotDir, { recursive: true });
        } catch (error) {
            console.warn('创建截图目录失败:', error.message);
        }
    }

    initializeUIElements() {
        // 定义关键UI元素的选择器
        this.uiElements.set('sidebar', {
            selector: '.sidebar, [data-testid="sidebar"]',
            description: '侧边栏',
            critical: true
        });
        
        this.uiElements.set('main_content', {
            selector: '.main-content, [data-testid="main-content"]',
            description: '主内容区',
            critical: true
        });
        
        this.uiElements.set('toolbar', {
            selector: '.toolbar, [data-testid="toolbar"]',
            description: '工具栏',
            critical: true
        });
        
        this.uiElements.set('search_box', {
            selector: 'input[type="search"], [data-testid="search-input"]',
            description: '搜索框',
            critical: false
        });
        
        this.uiElements.set('new_note_button', {
            selector: '.btn-primary, [data-testid="new-note-btn"]',
            description: '新建笔记按钮',
            critical: false
        });
    }

    async startMonitoring() {
        if (this.isMonitoring) {
            return;
        }

        this.isMonitoring = true;
        console.log('🖥️ 开始UI监控...');

        // 定期检查UI状态
        this.monitoringInterval = setInterval(() => {
            this.performUIHealthCheck();
        }, this.config.monitoring.interval);

        // 监控性能指标
        this.startPerformanceMonitoring();
    }

    stopMonitoring() {
        if (!this.isMonitoring) {
            return;
        }

        this.isMonitoring = false;
        console.log('🛑 停止UI监控');

        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }

    async performUIHealthCheck() {
        try {
            // 检查UI是否加载
            const uiLoaded = await this.checkUILoaded();
            if (!uiLoaded) {
                this.emit('ui_issue', {
                    type: 'ui_not_loaded',
                    description: 'UI界面未正确加载',
                    severity: 'high',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // 检查关键元素
            await this.checkCriticalElements();
            
            // 检查响应性
            await this.checkUIResponsiveness();
            
            // 检查视觉回归
            await this.checkVisualRegression();
            
        } catch (error) {
            console.error('UI健康检查失败:', error);
            this.emit('ui_issue', {
                type: 'ui_health_check_failure',
                description: `UI健康检查失败: ${error.message}`,
                severity: 'medium',
                timestamp: new Date().toISOString()
            });
        }
    }

    async checkUILoaded() {
        // 模拟检查UI是否加载完成
        // 在实际实现中，这里应该连接到WebView或使用自动化工具
        return new Promise((resolve) => {
            setTimeout(() => {
                // 90%概率UI正常加载
                resolve(Math.random() > 0.1);
            }, 100);
        });
    }

    async checkCriticalElements() {
        for (const [elementName, elementInfo] of this.uiElements) {
            if (elementInfo.critical) {
                const exists = await this.checkElementExists(elementName);
                if (!exists) {
                    this.emit('ui_issue', {
                        type: 'missing_critical_element',
                        description: `关键UI元素缺失: ${elementInfo.description}`,
                        severity: 'high',
                        element: elementName,
                        selector: elementInfo.selector,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        }
    }

    async checkElementExists(elementName) {
        // 模拟元素存在性检查
        // 在实际实现中，这里应该查询DOM或使用自动化工具
        return new Promise((resolve) => {
            setTimeout(() => {
                // 95%概率元素存在
                resolve(Math.random() > 0.05);
            }, 50);
        });
    }

    async checkUIResponsiveness() {
        const responseTime = await this.measureResponseTime();
        this.performanceMetrics.interactionDelay.push({
            value: responseTime,
            timestamp: Date.now()
        });

        if (responseTime > this.config.thresholds.ui_render_time) {
            this.emit('ui_issue', {
                type: 'slow_ui_response',
                description: `UI响应时间 ${responseTime}ms 超过阈值`,
                severity: 'medium',
                metrics: { responseTime },
                timestamp: new Date().toISOString()
            });
        }
    }

    async measureResponseTime() {
        // 模拟测量UI响应时间
        return new Promise((resolve) => {
            const start = Date.now();
            setTimeout(() => {
                resolve(Date.now() - start + Math.random() * 1000);
            }, Math.random() * 500);
        });
    }

    async checkVisualRegression() {
        if (!this.config.ui_testing.screenshot_comparison_threshold) {
            return;
        }

        try {
            const currentScreenshot = await this.takeScreenshot('visual_check');
            
            if (this.lastScreenshot) {
                const difference = await this.compareScreenshots(
                    this.lastScreenshot, 
                    currentScreenshot
                );
                
                if (difference > this.config.ui_testing.screenshot_comparison_threshold) {
                    this.emit('ui_issue', {
                        type: 'visual_regression',
                        description: `检测到视觉回归，差异度: ${difference}`,
                        severity: 'medium',
                        screenshots: {
                            previous: this.lastScreenshot,
                            current: currentScreenshot
                        },
                        timestamp: new Date().toISOString()
                    });
                }
            }
            
            this.lastScreenshot = currentScreenshot;
            
        } catch (error) {
            console.warn('视觉回归检查失败:', error.message);
        }
    }

    async takeScreenshot(name = null) {
        const timestamp = Date.now();
        const filename = name ? 
            `${name}_${timestamp}.png` : 
            `screenshot_${this.screenshotCounter++}_${timestamp}.png`;
        
        const filepath = path.join(
            this.config.reporting.output_directory, 
            'screenshots', 
            filename
        );

        try {
            // 在实际实现中，这里应该调用截图API
            // 这里使用模拟实现
            await this.simulateScreenshot(filepath);
            
            console.log(`📸 截图已保存: ${filename}`);
            return filepath;
            
        } catch (error) {
            console.error('截图失败:', error);
            throw error;
        }
    }

    async simulateScreenshot(filepath) {
        // 模拟截图 - 创建一个空文件
        await fs.writeFile(filepath, 'mock screenshot data');
    }

    async compareScreenshots(screenshot1, screenshot2) {
        // 模拟截图比较
        // 在实际实现中，这里应该使用图像比较库
        return new Promise((resolve) => {
            setTimeout(() => {
                // 返回0-1之间的差异度
                resolve(Math.random() * 0.2);
            }, 100);
        });
    }

    async simulateUserInteraction(action, target) {
        const startTime = Date.now();
        
        try {
            // 模拟用户交互
            await this.performAction(action, target);
            
            const duration = Date.now() - startTime;
            
            this.interactionHistory.push({
                action,
                target,
                duration,
                timestamp: new Date().toISOString(),
                success: true
            });
            
            return { success: true, duration };
            
        } catch (error) {
            this.interactionHistory.push({
                action,
                target,
                duration: Date.now() - startTime,
                timestamp: new Date().toISOString(),
                success: false,
                error: error.message
            });
            
            throw error;
        }
    }

    async performAction(action, target) {
        // 模拟执行用户操作
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // 95%概率操作成功
                if (Math.random() > 0.05) {
                    resolve();
                } else {
                    reject(new Error(`操作失败: ${action} on ${target}`));
                }
            }, Math.random() * 500);
        });
    }

    async testUserFlow(flow) {
        console.log(`🔄 测试用户流程: ${flow.name}`);
        
        const results = [];
        
        for (const step of flow.steps) {
            try {
                const result = await this.simulateUserInteraction(
                    step.action, 
                    step.target
                );
                
                results.push({
                    step: step.name,
                    success: true,
                    duration: result.duration
                });
                
                // 等待动画完成
                if (step.waitAfter) {
                    await this.wait(step.waitAfter);
                }
                
            } catch (error) {
                results.push({
                    step: step.name,
                    success: false,
                    error: error.message
                });
                
                // 如果是关键步骤失败，停止流程
                if (step.critical) {
                    break;
                }
            }
        }
        
        return {
            flow: flow.name,
            results,
            success: results.every(r => r.success),
            totalDuration: results.reduce((sum, r) => sum + (r.duration || 0), 0)
        };
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    startPerformanceMonitoring() {
        setInterval(() => {
            this.collectPerformanceMetrics();
        }, this.config.monitoring.interval);
    }

    async collectPerformanceMetrics() {
        // 收集渲染性能指标
        const renderTime = await this.measureRenderTime();
        this.performanceMetrics.renderTime.push({
            value: renderTime,
            timestamp: Date.now()
        });

        // 收集动画帧率
        const frameRate = await this.measureFrameRate();
        this.performanceMetrics.animationFrameRate.push({
            value: frameRate,
            timestamp: Date.now()
        });
    }

    async measureRenderTime() {
        // 模拟渲染时间测量
        return Math.random() * 100 + 50; // 50-150ms
    }

    async measureFrameRate() {
        // 模拟帧率测量
        return Math.random() * 20 + 40; // 40-60fps
    }

    getUIStatistics() {
        return {
            interactions: this.interactionHistory.length,
            screenshots: this.screenshotCounter,
            averageResponseTime: this.calculateAverageResponseTime(),
            successRate: this.calculateSuccessRate(),
            performanceMetrics: this.performanceMetrics
        };
    }

    calculateAverageResponseTime() {
        const delays = this.performanceMetrics.interactionDelay;
        if (delays.length === 0) return 0;
        
        const sum = delays.reduce((total, delay) => total + delay.value, 0);
        return sum / delays.length;
    }

    calculateSuccessRate() {
        if (this.interactionHistory.length === 0) return 100;
        
        const successful = this.interactionHistory.filter(i => i.success).length;
        return (successful / this.interactionHistory.length) * 100;
    }

    clearHistory() {
        this.interactionHistory = [];
        this.performanceMetrics = {
            renderTime: [],
            interactionDelay: [],
            animationFrameRate: []
        };
        this.screenshotCounter = 0;
    }
}

module.exports = UIMonitor;
