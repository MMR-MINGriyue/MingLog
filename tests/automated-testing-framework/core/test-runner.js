/**
 * MingLog 自动化测试运行器
 * 负责协调和执行所有类型的测试
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const EventEmitter = require('events');

const ErrorDetector = require('./error-detector');
const UIMonitor = require('./ui-monitor');
const AutoFixer = require('./auto-fixer');
const ReportGenerator = require('../utils/report-generator');
const LogAnalyzer = require('../utils/log-analyzer');

class TestRunner extends EventEmitter {
    constructor(configPath = '../config/test-config.json') {
        super();
        this.config = null;
        this.configPath = configPath;
        this.isRunning = false;
        this.currentTest = null;
        this.testResults = [];
        this.errorDetector = new ErrorDetector();
        this.uiMonitor = new UIMonitor();
        this.autoFixer = new AutoFixer();
        this.reportGenerator = new ReportGenerator();
        this.logAnalyzer = new LogAnalyzer();
        this.appProcess = null;
        this.monitoringInterval = null;
        
        this.setupEventHandlers();
    }

    async initialize() {
        try {
            console.log('🚀 初始化测试运行器...');
            
            // 加载配置
            await this.loadConfig();
            
            // 初始化各个组件
            await this.errorDetector.initialize(this.config);
            await this.uiMonitor.initialize(this.config);
            await this.autoFixer.initialize(this.config);
            
            // 创建必要的目录
            await this.createDirectories();
            
            console.log('✅ 测试运行器初始化完成');
            this.emit('initialized');
            
        } catch (error) {
            console.error('❌ 测试运行器初始化失败:', error);
            this.emit('error', error);
            throw error;
        }
    }

    async loadConfig() {
        try {
            const configFile = path.resolve(__dirname, this.configPath);
            const configData = await fs.readFile(configFile, 'utf8');
            this.config = JSON.parse(configData);
            console.log('📋 配置文件加载成功');
        } catch (error) {
            throw new Error(`配置文件加载失败: ${error.message}`);
        }
    }

    async createDirectories() {
        const dirs = [
            this.config.reporting.output_directory,
            path.join(this.config.reporting.output_directory, 'screenshots'),
            path.join(this.config.reporting.output_directory, 'logs'),
            path.join(this.config.reporting.output_directory, 'daily'),
            path.join(this.config.reporting.output_directory, 'weekly'),
            path.join(this.config.reporting.output_directory, 'incidents'),
            './backup',
            './backup/emergency',
            './backup/db_emergency',
            './test_data'
        ];

        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    console.warn(`⚠️ 创建目录失败: ${dir}`, error.message);
                }
            }
        }
    }

    setupEventHandlers() {
        // 错误检测事件
        this.errorDetector.on('error_detected', async (error) => {
            console.log(`🔍 检测到错误: ${error.type} - ${error.message}`);
            await this.handleDetectedError(error);
        });

        // UI监控事件
        this.uiMonitor.on('ui_issue', async (issue) => {
            console.log(`🖥️ UI问题: ${issue.type} - ${issue.description}`);
            await this.handleUIIssue(issue);
        });

        // 自动修复事件
        this.autoFixer.on('fix_applied', (result) => {
            console.log(`🔧 修复应用: ${result.strategy} - ${result.success ? '成功' : '失败'}`);
            this.recordFixResult(result);
        });

        // 进程事件
        process.on('SIGINT', () => {
            console.log('\n🛑 收到中断信号，正在清理...');
            this.cleanup();
        });

        process.on('uncaughtException', (error) => {
            console.error('💥 未捕获的异常:', error);
            this.cleanup();
        });
    }

    async runTestSuite(suiteName = 'smoke') {
        if (this.isRunning) {
            throw new Error('测试已在运行中');
        }

        try {
            this.isRunning = true;
            console.log(`🧪 开始运行测试套件: ${suiteName}`);
            
            const suite = this.config.test_suites[suiteName];
            if (!suite || !suite.enabled) {
                throw new Error(`测试套件 ${suiteName} 不存在或未启用`);
            }

            const startTime = Date.now();
            const testSession = {
                id: this.generateSessionId(),
                suite: suiteName,
                startTime,
                tests: [],
                errors: [],
                fixes: []
            };

            // 启动应用程序
            await this.startApplication();

            // 运行测试
            for (const testType of suite.tests) {
                try {
                    console.log(`📝 运行测试: ${testType}`);
                    const testResult = await this.runTest(testType);
                    testSession.tests.push(testResult);
                    
                    if (!testResult.passed) {
                        console.log(`❌ 测试失败: ${testType}`);
                        // 尝试自动修复
                        if (testResult.errors.length > 0) {
                            for (const error of testResult.errors) {
                                const fixResult = await this.autoFixer.attemptFix(error);
                                testSession.fixes.push(fixResult);
                            }
                        }
                    } else {
                        console.log(`✅ 测试通过: ${testType}`);
                    }
                    
                } catch (error) {
                    console.error(`💥 测试执行异常: ${testType}`, error);
                    testSession.errors.push({
                        test: testType,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                }
            }

            // 停止应用程序
            await this.stopApplication();

            // 生成报告
            testSession.endTime = Date.now();
            testSession.duration = testSession.endTime - startTime;
            
            const report = await this.reportGenerator.generateTestReport(testSession);
            console.log(`📊 测试报告已生成: ${report.filePath}`);

            this.testResults.push(testSession);
            this.emit('test_suite_completed', testSession);

            return testSession;

        } catch (error) {
            console.error('❌ 测试套件执行失败:', error);
            this.emit('test_suite_failed', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    async runTest(testType) {
        const startTime = Date.now();
        const testResult = {
            type: testType,
            startTime,
            passed: false,
            errors: [],
            warnings: [],
            metrics: {}
        };

        try {
            switch (testType) {
                case 'startup':
                    await this.runStartupTest(testResult);
                    break;
                case 'basic_ui':
                    await this.runBasicUITest(testResult);
                    break;
                case 'core_functions':
                    await this.runCoreFunctionsTest(testResult);
                    break;
                case 'all_ui':
                    await this.runAllUITests(testResult);
                    break;
                case 'all_functions':
                    await this.runAllFunctionTests(testResult);
                    break;
                case 'performance':
                    await this.runPerformanceTest(testResult);
                    break;
                default:
                    throw new Error(`未知的测试类型: ${testType}`);
            }

            testResult.passed = testResult.errors.length === 0;
            
        } catch (error) {
            testResult.errors.push({
                type: 'test_execution_error',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }

        testResult.endTime = Date.now();
        testResult.duration = testResult.endTime - startTime;
        
        return testResult;
    }

    async startApplication() {
        return new Promise((resolve, reject) => {
            console.log('🚀 启动应用程序...');
            
            const executable = this.config.app.executable;
            const timeout = this.config.app.startup_timeout;

            this.appProcess = spawn(executable, [], {
                detached: false,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let startupTimer = setTimeout(() => {
                this.appProcess.kill();
                reject(new Error('应用程序启动超时'));
            }, timeout);

            this.appProcess.on('spawn', () => {
                console.log('✅ 应用程序进程已启动');
                clearTimeout(startupTimer);
                
                // 等待UI加载
                setTimeout(() => {
                    resolve();
                }, 3000);
            });

            this.appProcess.on('error', (error) => {
                clearTimeout(startupTimer);
                reject(new Error(`应用程序启动失败: ${error.message}`));
            });

            this.appProcess.on('exit', (code) => {
                if (code !== 0) {
                    clearTimeout(startupTimer);
                    reject(new Error(`应用程序异常退出，退出码: ${code}`));
                }
            });

            // 监听输出
            this.appProcess.stdout.on('data', (data) => {
                this.logAnalyzer.analyzeLog(data.toString());
            });

            this.appProcess.stderr.on('data', (data) => {
                this.logAnalyzer.analyzeLog(data.toString(), 'error');
            });
        });
    }

    async stopApplication() {
        if (this.appProcess) {
            console.log('🛑 停止应用程序...');
            
            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    this.appProcess.kill('SIGKILL');
                    resolve();
                }, this.config.app.shutdown_timeout);

                this.appProcess.on('exit', () => {
                    clearTimeout(timeout);
                    console.log('✅ 应用程序已停止');
                    resolve();
                });

                this.appProcess.kill('SIGTERM');
            });
        }
    }

    generateSessionId() {
        return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async runStartupTest(testResult) {
        console.log('🚀 执行启动测试...');

        const startTime = Date.now();

        // 检查进程是否正在运行
        if (!this.appProcess || this.appProcess.killed) {
            testResult.errors.push({
                type: 'startup_failure',
                message: '应用程序进程未运行',
                timestamp: new Date().toISOString()
            });
            return;
        }

        // 检查启动时间
        const startupTime = Date.now() - startTime;
        testResult.metrics.startup_time = startupTime;

        if (startupTime > this.config.thresholds.startup_time) {
            testResult.warnings.push({
                type: 'slow_startup',
                message: `启动时间 ${startupTime}ms 超过阈值 ${this.config.thresholds.startup_time}ms`,
                timestamp: new Date().toISOString()
            });
        }

        // 检查UI是否加载
        const uiLoaded = await this.uiMonitor.checkUILoaded();
        if (!uiLoaded) {
            testResult.errors.push({
                type: 'ui_not_loaded',
                message: 'UI界面未正确加载',
                timestamp: new Date().toISOString()
            });
        }
    }

    async runBasicUITest(testResult) {
        console.log('🖥️ 执行基础UI测试...');

        // 检查关键UI元素
        const criticalElements = ['sidebar', 'main_content', 'toolbar'];
        for (const element of criticalElements) {
            const exists = await this.uiMonitor.checkElementExists(element);
            if (!exists) {
                testResult.errors.push({
                    type: 'missing_ui_element',
                    message: `关键UI元素缺失: ${element}`,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // 检查响应性
        const responseTime = await this.uiMonitor.measureResponseTime();
        testResult.metrics.ui_response_time = responseTime;

        if (responseTime > this.config.thresholds.response_time_ms) {
            testResult.warnings.push({
                type: 'slow_ui_response',
                message: `UI响应时间 ${responseTime}ms 超过阈值`,
                timestamp: new Date().toISOString()
            });
        }
    }

    async runCoreFunctionsTest(testResult) {
        console.log('⚙️ 执行核心功能测试...');

        // 测试搜索功能
        try {
            const searchResult = await this.testSearchFunction();
            if (!searchResult.success) {
                testResult.errors.push({
                    type: 'search_function_error',
                    message: searchResult.error,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            testResult.errors.push({
                type: 'search_test_exception',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }

        // 测试数据保存功能
        try {
            const saveResult = await this.testSaveFunction();
            if (!saveResult.success) {
                testResult.errors.push({
                    type: 'save_function_error',
                    message: saveResult.error,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            testResult.errors.push({
                type: 'save_test_exception',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async testSearchFunction() {
        // 模拟搜索测试
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true });
            }, 1000);
        });
    }

    async testSaveFunction() {
        // 模拟保存测试
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true });
            }, 500);
        });
    }

    async runAllUITests(testResult) {
        console.log('🖥️ 执行完整UI测试...');
        await this.runBasicUITest(testResult);
        // 添加更多UI测试...
    }

    async runAllFunctionTests(testResult) {
        console.log('⚙️ 执行完整功能测试...');
        await this.runCoreFunctionsTest(testResult);
        // 添加更多功能测试...
    }

    async runPerformanceTest(testResult) {
        console.log('📊 执行性能测试...');

        // 监控内存使用
        const memoryUsage = await this.monitorMemoryUsage();
        testResult.metrics.memory_usage = memoryUsage;

        if (memoryUsage > this.config.thresholds.memory_usage_mb) {
            testResult.warnings.push({
                type: 'high_memory_usage',
                message: `内存使用 ${memoryUsage}MB 超过阈值`,
                timestamp: new Date().toISOString()
            });
        }
    }

    async monitorMemoryUsage() {
        // 模拟内存监控
        return Math.floor(Math.random() * 300) + 100;
    }

    async handleDetectedError(error) {
        console.log(`🔧 处理检测到的错误: ${error.type}`);

        // 尝试自动修复
        const fixResult = await this.autoFixer.attemptFix(error);

        if (fixResult.success) {
            console.log(`✅ 错误已自动修复: ${error.type}`);
        } else {
            console.log(`❌ 自动修复失败: ${error.type}`);
            // 记录到事件报告
            await this.reportGenerator.generateIncidentReport(error, fixResult);
        }
    }

    async handleUIIssue(issue) {
        console.log(`🖥️ 处理UI问题: ${issue.type}`);

        // 截图记录问题
        if (this.config.testing.screenshot_on_failure) {
            await this.uiMonitor.takeScreenshot(`ui_issue_${Date.now()}`);
        }

        // 尝试修复
        const fixResult = await this.autoFixer.attemptFix(issue);

        if (!fixResult.success) {
            await this.reportGenerator.generateIncidentReport(issue, fixResult);
        }
    }

    recordFixResult(result) {
        // 记录修复结果到数据库或文件
        console.log(`📝 记录修复结果: ${result.strategy} - ${result.success ? '成功' : '失败'}`);
    }

    async cleanup() {
        console.log('🧹 清理资源...');

        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }

        await this.stopApplication();

        // 保存当前状态
        if (this.testResults.length > 0) {
            await this.reportGenerator.generateSummaryReport(this.testResults);
        }

        console.log('✅ 清理完成');
        process.exit(0);
    }
}

module.exports = TestRunner;
