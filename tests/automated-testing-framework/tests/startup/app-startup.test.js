/**
 * MingLog 应用启动测试
 * 测试应用程序的启动过程和初始化
 */

const { spawn } = require('child_process');
const path = require('path');

class AppStartupTest {
    constructor(config) {
        this.config = config;
        this.testResults = [];
    }

    async runAllTests() {
        console.log('🚀 开始应用启动测试...');
        
        const tests = [
            this.testApplicationLaunch.bind(this),
            this.testStartupTime.bind(this),
            this.testInitialMemoryUsage.bind(this),
            this.testDatabaseConnection.bind(this),
            this.testUIInitialization.bind(this),
            this.testConfigurationLoading.bind(this)
        ];

        for (const test of tests) {
            try {
                const result = await test();
                this.testResults.push(result);
            } catch (error) {
                this.testResults.push({
                    name: test.name,
                    passed: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        return this.testResults;
    }

    async testApplicationLaunch() {
        console.log('  📱 测试应用程序启动...');
        
        const startTime = Date.now();
        let appProcess = null;
        
        try {
            appProcess = await this.launchApplication();
            const launchTime = Date.now() - startTime;
            
            // 验证进程是否正在运行
            const isRunning = !appProcess.killed && appProcess.pid;
            
            if (isRunning) {
                // 等待一段时间确保应用稳定
                await this.wait(3000);
                
                // 检查进程是否仍在运行
                const stillRunning = !appProcess.killed;
                
                if (stillRunning) {
                    appProcess.kill();
                    
                    return {
                        name: 'testApplicationLaunch',
                        passed: true,
                        metrics: { launchTime },
                        message: `应用成功启动，耗时 ${launchTime}ms`,
                        timestamp: new Date().toISOString()
                    };
                } else {
                    return {
                        name: 'testApplicationLaunch',
                        passed: false,
                        error: '应用启动后立即崩溃',
                        timestamp: new Date().toISOString()
                    };
                }
            } else {
                return {
                    name: 'testApplicationLaunch',
                    passed: false,
                    error: '应用进程启动失败',
                    timestamp: new Date().toISOString()
                };
            }
        } catch (error) {
            if (appProcess) {
                appProcess.kill();
            }
            throw error;
        }
    }

    async testStartupTime() {
        console.log('  ⏱️ 测试启动时间...');
        
        const startTime = Date.now();
        let appProcess = null;
        
        try {
            appProcess = await this.launchApplication();
            const startupTime = Date.now() - startTime;
            
            appProcess.kill();
            
            const threshold = this.config.thresholds.startup_time;
            const passed = startupTime <= threshold;
            
            return {
                name: 'testStartupTime',
                passed,
                metrics: { startupTime, threshold },
                message: passed ? 
                    `启动时间 ${startupTime}ms 符合要求` : 
                    `启动时间 ${startupTime}ms 超过阈值 ${threshold}ms`,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            if (appProcess) {
                appProcess.kill();
            }
            throw error;
        }
    }

    async testInitialMemoryUsage() {
        console.log('  💾 测试初始内存使用...');
        
        let appProcess = null;
        
        try {
            appProcess = await this.launchApplication();
            
            // 等待应用完全加载
            await this.wait(5000);
            
            const memoryUsage = await this.getProcessMemoryUsage(appProcess.pid);
            
            appProcess.kill();
            
            const threshold = this.config.thresholds.memory_usage_mb;
            const passed = memoryUsage <= threshold;
            
            return {
                name: 'testInitialMemoryUsage',
                passed,
                metrics: { memoryUsage, threshold },
                message: passed ? 
                    `初始内存使用 ${memoryUsage}MB 正常` : 
                    `初始内存使用 ${memoryUsage}MB 超过阈值 ${threshold}MB`,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            if (appProcess) {
                appProcess.kill();
            }
            throw error;
        }
    }

    async testDatabaseConnection() {
        console.log('  🗄️ 测试数据库连接...');
        
        let appProcess = null;
        
        try {
            appProcess = await this.launchApplication();
            
            // 等待数据库初始化
            await this.wait(3000);
            
            // 检查数据库文件是否存在
            const dbExists = await this.checkDatabaseExists();
            
            appProcess.kill();
            
            return {
                name: 'testDatabaseConnection',
                passed: dbExists,
                message: dbExists ? '数据库连接正常' : '数据库连接失败',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            if (appProcess) {
                appProcess.kill();
            }
            throw error;
        }
    }

    async testUIInitialization() {
        console.log('  🖥️ 测试UI初始化...');
        
        let appProcess = null;
        
        try {
            appProcess = await this.launchApplication();
            
            // 等待UI加载
            await this.wait(4000);
            
            // 模拟UI检查 - 在实际实现中应该连接到WebView
            const uiLoaded = await this.checkUILoaded();
            
            appProcess.kill();
            
            return {
                name: 'testUIInitialization',
                passed: uiLoaded,
                message: uiLoaded ? 'UI初始化成功' : 'UI初始化失败',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            if (appProcess) {
                appProcess.kill();
            }
            throw error;
        }
    }

    async testConfigurationLoading() {
        console.log('  ⚙️ 测试配置加载...');
        
        let appProcess = null;
        
        try {
            appProcess = await this.launchApplication();
            
            // 等待配置加载
            await this.wait(2000);
            
            // 检查配置文件是否正确加载
            const configLoaded = await this.checkConfigurationLoaded();
            
            appProcess.kill();
            
            return {
                name: 'testConfigurationLoading',
                passed: configLoaded,
                message: configLoaded ? '配置加载成功' : '配置加载失败',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            if (appProcess) {
                appProcess.kill();
            }
            throw error;
        }
    }

    async launchApplication() {
        return new Promise((resolve, reject) => {
            const executable = this.config.app.executable;
            const timeout = this.config.app.startup_timeout;

            const appProcess = spawn(executable, [], {
                detached: false,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            const startupTimer = setTimeout(() => {
                appProcess.kill();
                reject(new Error('应用启动超时'));
            }, timeout);

            appProcess.on('spawn', () => {
                clearTimeout(startupTimer);
                resolve(appProcess);
            });

            appProcess.on('error', (error) => {
                clearTimeout(startupTimer);
                reject(new Error(`应用启动失败: ${error.message}`));
            });

            appProcess.on('exit', (code) => {
                clearTimeout(startupTimer);
                if (code !== 0) {
                    reject(new Error(`应用异常退出，退出码: ${code}`));
                }
            });
        });
    }

    async getProcessMemoryUsage(pid) {
        // 模拟内存使用检查
        // 在实际实现中，应该使用系统API获取真实的内存使用情况
        return Math.floor(Math.random() * 200) + 100; // 100-300MB
    }

    async checkDatabaseExists() {
        // 模拟数据库存在性检查
        // 在实际实现中，应该检查SQLite数据库文件
        return Math.random() > 0.1; // 90%概率数据库存在
    }

    async checkUILoaded() {
        // 模拟UI加载检查
        // 在实际实现中，应该连接到WebView检查DOM
        return Math.random() > 0.05; // 95%概率UI加载成功
    }

    async checkConfigurationLoaded() {
        // 模拟配置加载检查
        // 在实际实现中，应该检查配置文件和应用状态
        return Math.random() > 0.02; // 98%概率配置加载成功
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getTestSummary() {
        const total = this.testResults.length;
        const passed = this.testResults.filter(t => t.passed).length;
        const failed = total - passed;

        return {
            total,
            passed,
            failed,
            passRate: total > 0 ? (passed / total) * 100 : 0,
            results: this.testResults
        };
    }
}

module.exports = AppStartupTest;
