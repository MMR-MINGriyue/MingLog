#!/usr/bin/env node

/**
 * MingLog 自动化测试启动脚本
 * 提供命令行界面来运行各种测试和监控任务
 */

const TestRunner = require('./core/test-runner');
const ErrorDetector = require('./core/error-detector');
const UIMonitor = require('./core/ui-monitor');
const AutoFixer = require('./core/auto-fixer');
const ReportGenerator = require('./utils/report-generator');

class TestLauncher {
    constructor() {
        this.testRunner = new TestRunner();
        this.errorDetector = new ErrorDetector();
        this.uiMonitor = new UIMonitor();
        this.autoFixer = new AutoFixer();
        this.reportGenerator = new ReportGenerator();
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('🚀 初始化MingLog自动化测试系统...');
            
            await this.testRunner.initialize();
            await this.reportGenerator.initialize(this.testRunner.config);
            
            this.isInitialized = true;
            console.log('✅ 测试系统初始化完成');
            
        } catch (error) {
            console.error('❌ 测试系统初始化失败:', error);
            process.exit(1);
        }
    }

    async runSmokeTests() {
        console.log('🧪 运行冒烟测试...');
        
        try {
            const result = await this.testRunner.runTestSuite('smoke');
            this.printTestResult(result);
            return result;
        } catch (error) {
            console.error('❌ 冒烟测试失败:', error);
            throw error;
        }
    }

    async runRegressionTests() {
        console.log('🧪 运行回归测试...');
        
        try {
            const result = await this.testRunner.runTestSuite('regression');
            this.printTestResult(result);
            return result;
        } catch (error) {
            console.error('❌ 回归测试失败:', error);
            throw error;
        }
    }

    async runStressTests() {
        console.log('🧪 运行压力测试...');
        
        try {
            const result = await this.testRunner.runTestSuite('stress');
            this.printTestResult(result);
            return result;
        } catch (error) {
            console.error('❌ 压力测试失败:', error);
            throw error;
        }
    }

    async runSecurityTests() {
        console.log('🧪 运行安全测试...');
        
        try {
            const result = await this.testRunner.runTestSuite('security');
            this.printTestResult(result);
            return result;
        } catch (error) {
            console.error('❌ 安全测试失败:', error);
            throw error;
        }
    }

    async runAllTests() {
        console.log('🧪 运行完整测试套件...');
        
        const results = [];
        const suites = ['smoke', 'regression', 'security'];
        
        for (const suite of suites) {
            try {
                console.log(`\n📋 开始 ${suite} 测试套件...`);
                const result = await this.testRunner.runTestSuite(suite);
                results.push(result);
                this.printTestResult(result);
            } catch (error) {
                console.error(`❌ ${suite} 测试套件失败:`, error);
                results.push({
                    suite,
                    success: false,
                    error: error.message
                });
            }
        }

        // 生成汇总报告
        await this.reportGenerator.generateSummaryReport(results);
        
        return results;
    }

    async startContinuousMonitoring() {
        console.log('🔍 启动持续监控模式...');
        
        try {
            // 启动错误检测
            await this.errorDetector.initialize(this.testRunner.config);
            this.errorDetector.startMonitoring();
            
            // 启动UI监控
            await this.uiMonitor.initialize(this.testRunner.config);
            this.uiMonitor.startMonitoring();
            
            // 启动自动修复
            await this.autoFixer.initialize(this.testRunner.config);
            
            console.log('✅ 持续监控已启动');
            console.log('按 Ctrl+C 停止监控');
            
            // 设置定期报告
            this.setupPeriodicReporting();
            
            // 保持进程运行
            process.on('SIGINT', () => {
                console.log('\n🛑 停止持续监控...');
                this.stopMonitoring();
            });
            
        } catch (error) {
            console.error('❌ 启动持续监控失败:', error);
            throw error;
        }
    }

    setupPeriodicReporting() {
        // 每小时生成一次监控报告
        setInterval(async () => {
            try {
                await this.generateMonitoringReport();
            } catch (error) {
                console.error('生成监控报告失败:', error);
            }
        }, 3600000); // 1小时
    }

    async generateMonitoringReport() {
        console.log('📊 生成监控报告...');
        
        const report = {
            metadata: {
                type: 'monitoring',
                timestamp: new Date().toISOString(),
                duration: 3600000 // 1小时
            },
            errorStats: this.errorDetector.getErrorStatistics(),
            uiStats: this.uiMonitor.getUIStatistics(),
            fixStats: this.autoFixer.getFixStatistics()
        };

        await this.reportGenerator.generateHTMLReport(report, 'monitoring');
        await this.reportGenerator.generateJSONReport(report, 'monitoring');
    }

    stopMonitoring() {
        this.errorDetector.stopMonitoring();
        this.uiMonitor.stopMonitoring();
        
        // 生成最终报告
        this.generateMonitoringReport().then(() => {
            console.log('✅ 监控已停止，最终报告已生成');
            process.exit(0);
        });
    }

    printTestResult(result) {
        console.log('\n📊 测试结果:');
        console.log(`套件: ${result.suite}`);
        console.log(`持续时间: ${result.duration}ms`);
        console.log(`测试数量: ${result.tests.length}`);
        
        const passed = result.tests.filter(t => t.passed).length;
        const failed = result.tests.length - passed;
        
        console.log(`✅ 通过: ${passed}`);
        console.log(`❌ 失败: ${failed}`);
        console.log(`🔧 修复尝试: ${result.fixes.length}`);
        
        if (result.errors.length > 0) {
            console.log(`⚠️ 错误: ${result.errors.length}`);
        }
        
        const status = failed === 0 ? '✅ 通过' : '❌ 失败';
        console.log(`状态: ${status}`);
    }

    printUsage() {
        console.log(`
🧪 MingLog 自动化测试系统

用法: node run-tests.js [命令]

命令:
  smoke           运行冒烟测试 (快速验证基本功能)
  regression      运行回归测试 (完整功能验证)
  stress          运行压力测试 (性能和稳定性)
  security        运行安全测试 (安全漏洞检测)
  all             运行所有测试套件
  monitor         启动持续监控模式
  help            显示此帮助信息

示例:
  node run-tests.js smoke      # 运行冒烟测试
  node run-tests.js all        # 运行所有测试
  node run-tests.js monitor    # 启动监控模式

报告位置: ./reports/
        `);
    }
}

// 主函数
async function main() {
    const launcher = new TestLauncher();
    const command = process.argv[2];

    try {
        await launcher.initialize();

        switch (command) {
            case 'smoke':
                await launcher.runSmokeTests();
                break;
            case 'regression':
                await launcher.runRegressionTests();
                break;
            case 'stress':
                await launcher.runStressTests();
                break;
            case 'security':
                await launcher.runSecurityTests();
                break;
            case 'all':
                await launcher.runAllTests();
                break;
            case 'monitor':
                await launcher.startContinuousMonitoring();
                break;
            case 'help':
            case '--help':
            case '-h':
                launcher.printUsage();
                break;
            default:
                if (command) {
                    console.error(`❌ 未知命令: ${command}`);
                }
                launcher.printUsage();
                process.exit(1);
        }
    } catch (error) {
        console.error('❌ 执行失败:', error);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = TestLauncher;
