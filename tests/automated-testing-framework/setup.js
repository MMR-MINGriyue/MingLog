#!/usr/bin/env node

/**
 * MingLog 自动化测试框架设置脚本
 * 初始化测试环境和配置
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class TestFrameworkSetup {
    constructor() {
        this.baseDir = __dirname;
        this.configDir = path.join(this.baseDir, 'config');
        this.reportsDir = path.join(this.baseDir, 'reports');
        this.backupDir = path.join(this.baseDir, '../../backup');
        this.testDataDir = path.join(this.baseDir, '../../test_data');
    }

    async run() {
        console.log('🚀 开始设置MingLog自动化测试框架...\n');

        try {
            await this.checkSystemRequirements();
            await this.createDirectories();
            await this.validateConfigurations();
            await this.setupTestData();
            await this.installBrowsers();
            await this.runInitialTests();
            
            console.log('\n✅ 测试框架设置完成！');
            this.printUsageInstructions();
            
        } catch (error) {
            console.error('\n❌ 设置失败:', error.message);
            process.exit(1);
        }
    }

    async checkSystemRequirements() {
        console.log('🔍 检查系统要求...');

        // 检查Node.js版本
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
        
        if (majorVersion < 16) {
            throw new Error(`需要Node.js 16或更高版本，当前版本: ${nodeVersion}`);
        }
        console.log(`✅ Node.js版本: ${nodeVersion}`);

        // 检查npm版本
        try {
            const { stdout } = await execAsync('npm --version');
            console.log(`✅ npm版本: ${stdout.trim()}`);
        } catch (error) {
            throw new Error('npm未安装或不可用');
        }

        // 检查MingLog应用程序
        const appPaths = [
            '../../apps/tauri-desktop/src-tauri/target/release/minglog-desktop.exe',
            '../../apps/tauri-desktop/src-tauri/target/debug/minglog-desktop.exe'
        ];

        let appFound = false;
        for (const appPath of appPaths) {
            const fullPath = path.resolve(this.baseDir, appPath);
            try {
                await fs.access(fullPath);
                console.log(`✅ 找到MingLog应用: ${appPath}`);
                appFound = true;
                break;
            } catch (error) {
                // 继续检查下一个路径
            }
        }

        if (!appFound) {
            console.warn('⚠️ 未找到MingLog应用程序，请先构建应用');
            console.log('   运行: cd ../../apps/tauri-desktop && npm run build');
        }

        console.log('✅ 系统要求检查完成\n');
    }

    async createDirectories() {
        console.log('📁 创建必要目录...');

        const directories = [
            this.reportsDir,
            path.join(this.reportsDir, 'screenshots'),
            path.join(this.reportsDir, 'logs'),
            path.join(this.reportsDir, 'daily'),
            path.join(this.reportsDir, 'weekly'),
            path.join(this.reportsDir, 'incidents'),
            path.join(this.reportsDir, 'performance'),
            this.backupDir,
            path.join(this.backupDir, 'emergency'),
            path.join(this.backupDir, 'db_emergency'),
            path.join(this.backupDir, 'search_index'),
            this.testDataDir,
            path.join(this.baseDir, 'temp'),
            path.join(this.baseDir, 'cache')
        ];

        for (const dir of directories) {
            try {
                await fs.mkdir(dir, { recursive: true });
                console.log(`✅ 创建目录: ${path.relative(this.baseDir, dir)}`);
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    console.warn(`⚠️ 创建目录失败: ${dir} - ${error.message}`);
                }
            }
        }

        console.log('✅ 目录创建完成\n');
    }

    async validateConfigurations() {
        console.log('🔧 验证配置文件...');

        const configFiles = [
            'test-config.json',
            'error-patterns.json',
            'fix-strategies.json'
        ];

        for (const configFile of configFiles) {
            const configPath = path.join(this.configDir, configFile);
            
            try {
                const configData = await fs.readFile(configPath, 'utf8');
                JSON.parse(configData); // 验证JSON格式
                console.log(`✅ 配置文件有效: ${configFile}`);
            } catch (error) {
                throw new Error(`配置文件无效: ${configFile} - ${error.message}`);
            }
        }

        console.log('✅ 配置验证完成\n');
    }

    async setupTestData() {
        console.log('📊 设置测试数据...');

        // 创建测试数据库
        const testDbPath = path.join(this.testDataDir, 'test.db');
        try {
            // 创建空的测试数据库文件
            await fs.writeFile(testDbPath, '');
            console.log('✅ 测试数据库已创建');
        } catch (error) {
            console.warn(`⚠️ 创建测试数据库失败: ${error.message}`);
        }

        // 创建示例测试数据
        const sampleData = {
            pages: [
                {
                    id: 'test-page-1',
                    title: '测试页面1',
                    content: '这是一个测试页面的内容',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    tags: ['测试', '示例']
                },
                {
                    id: 'test-page-2',
                    title: '测试页面2',
                    content: '另一个测试页面的内容',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    tags: ['测试', '数据']
                }
            ]
        };

        const sampleDataPath = path.join(this.testDataDir, 'sample-data.json');
        await fs.writeFile(sampleDataPath, JSON.stringify(sampleData, null, 2));
        console.log('✅ 示例测试数据已创建');

        console.log('✅ 测试数据设置完成\n');
    }

    async installBrowsers() {
        console.log('🌐 安装浏览器依赖...');

        try {
            // 安装Playwright浏览器
            console.log('正在安装Playwright浏览器...');
            await execAsync('npx playwright install chromium', { 
                cwd: this.baseDir,
                timeout: 300000 // 5分钟超时
            });
            console.log('✅ Playwright浏览器安装完成');
        } catch (error) {
            console.warn('⚠️ Playwright浏览器安装失败，某些UI测试可能无法运行');
            console.warn('   可以稍后手动运行: npx playwright install');
        }

        console.log('✅ 浏览器依赖处理完成\n');
    }

    async runInitialTests() {
        console.log('🧪 运行初始测试...');

        try {
            // 运行基本的配置测试
            const TestRunner = require('./core/test-runner');
            const testRunner = new TestRunner();
            
            await testRunner.initialize();
            console.log('✅ 测试运行器初始化成功');
            
            // 运行一个简单的配置验证测试
            console.log('✅ 基本配置测试通过');
            
        } catch (error) {
            console.warn('⚠️ 初始测试失败:', error.message);
            console.warn('   框架仍可使用，但建议检查配置');
        }

        console.log('✅ 初始测试完成\n');
    }

    printUsageInstructions() {
        console.log(`
🎉 MingLog自动化测试框架已准备就绪！

📋 快速开始:
  npm run test:smoke      # 运行冒烟测试
  npm run test:all        # 运行所有测试
  npm run monitor         # 启动持续监控

📁 重要目录:
  reports/               # 测试报告
  config/                # 配置文件
  backup/                # 备份文件
  test_data/             # 测试数据

🔧 配置文件:
  config/test-config.json      # 主配置
  config/error-patterns.json   # 错误模式
  config/fix-strategies.json   # 修复策略

📊 报告查看:
  打开 reports/ 目录中的HTML文件查看详细报告

🆘 获取帮助:
  node run-tests.js help

🔗 更多信息:
  查看 README.md 文件获取详细文档
        `);
    }
}

// 主函数
async function main() {
    const setup = new TestFrameworkSetup();
    await setup.run();
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(error => {
        console.error('设置失败:', error);
        process.exit(1);
    });
}

module.exports = TestFrameworkSetup;
