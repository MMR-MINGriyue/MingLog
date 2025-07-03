#!/usr/bin/env node

/**
 * MingLog 后端功能测试脚本
 * 通过直接调用Rust后端来测试核心功能
 */

import { spawn } from 'child_process';
import { writeFile } from 'fs/promises';
import path from 'path';

class BackendTester {
  constructor() {
    this.results = {
      startTime: new Date().toISOString(),
      tests: [],
      summary: { total: 0, passed: 0, failed: 0 }
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('zh-CN');
    const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };
    console.log(`[${timestamp}] ${icons[type]} ${message}`);
  }

  addResult(testName, passed, details = '', duration = 0) {
    const result = {
      name: testName,
      passed,
      details,
      duration,
      timestamp: new Date().toISOString()
    };
    
    this.results.tests.push(result);
    this.results.summary.total++;
    if (passed) {
      this.results.summary.passed++;
      this.log(`${testName} - 通过 (${duration}ms)`, 'success');
    } else {
      this.results.summary.failed++;
      this.log(`${testName} - 失败: ${details}`, 'error');
    }
    
    if (details && passed) {
      this.log(`  详情: ${details}`, 'info');
    }
  }

  async testCompilation() {
    this.log('测试Rust后端编译状态...', 'info');
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const cargoCheck = spawn('cargo', ['check'], {
        cwd: path.join(process.cwd(), 'src-tauri'),
        stdio: 'pipe'
      });
      
      let output = '';
      let errorOutput = '';
      
      cargoCheck.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      cargoCheck.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      cargoCheck.on('close', (code) => {
        const duration = Date.now() - startTime;
        const passed = code === 0;
        
        if (passed) {
          this.addResult('Rust编译检查', true, '编译无错误', duration);
        } else {
          this.addResult('Rust编译检查', false, `编译失败: ${errorOutput}`, duration);
        }
        
        resolve(passed);
      });
    });
  }

  async testDatabaseSchema() {
    this.log('测试数据库模式...', 'info');
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const cargoTest = spawn('cargo', ['test', 'database', '--', '--nocapture'], {
        cwd: path.join(process.cwd(), 'src-tauri'),
        stdio: 'pipe'
      });
      
      let output = '';
      let errorOutput = '';
      
      cargoTest.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      cargoTest.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      cargoTest.on('close', (code) => {
        const duration = Date.now() - startTime;
        const passed = code === 0;
        
        if (passed) {
          this.addResult('数据库模式测试', true, '数据库测试通过', duration);
        } else {
          this.addResult('数据库模式测试', false, `数据库测试失败: ${errorOutput}`, duration);
        }
        
        resolve(passed);
      });
    });
  }

  async testTauriCommands() {
    this.log('测试Tauri命令定义...', 'info');
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const cargoTest = spawn('cargo', ['test', 'commands', '--', '--nocapture'], {
        cwd: path.join(process.cwd(), 'src-tauri'),
        stdio: 'pipe'
      });
      
      let output = '';
      let errorOutput = '';
      
      cargoTest.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      cargoTest.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      cargoTest.on('close', (code) => {
        const duration = Date.now() - startTime;
        const passed = code === 0;
        
        if (passed) {
          this.addResult('Tauri命令测试', true, '命令定义正确', duration);
        } else {
          this.addResult('Tauri命令测试', false, `命令测试失败: ${errorOutput}`, duration);
        }
        
        resolve(passed);
      });
    });
  }

  async testApplicationBuild() {
    this.log('测试应用构建...', 'info');
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const tauriBuild = spawn('npm', ['run', 'tauri:build', '--', '--debug'], {
        cwd: process.cwd(),
        stdio: 'pipe'
      });
      
      let output = '';
      let errorOutput = '';
      
      tauriBuild.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      tauriBuild.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      tauriBuild.on('close', (code) => {
        const duration = Date.now() - startTime;
        const passed = code === 0;
        
        if (passed) {
          this.addResult('应用构建测试', true, '构建成功', duration);
        } else {
          this.addResult('应用构建测试', false, `构建失败: ${errorOutput}`, duration);
        }
        
        resolve(passed);
      });
    });
  }

  async checkDependencies() {
    this.log('检查依赖项...', 'info');
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const cargoTree = spawn('cargo', ['tree'], {
        cwd: path.join(process.cwd(), 'src-tauri'),
        stdio: 'pipe'
      });
      
      let output = '';
      let errorOutput = '';
      
      cargoTree.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      cargoTree.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      cargoTree.on('close', (code) => {
        const duration = Date.now() - startTime;
        const passed = code === 0;
        
        if (passed) {
          const lines = output.split('\n').length;
          this.addResult('依赖项检查', true, `发现 ${lines} 个依赖项`, duration);
        } else {
          this.addResult('依赖项检查', false, `依赖检查失败: ${errorOutput}`, duration);
        }
        
        resolve(passed);
      });
    });
  }

  async generateReport() {
    this.results.endTime = new Date().toISOString();
    this.results.duration = new Date(this.results.endTime) - new Date(this.results.startTime);
    
    const reportPath = path.join(process.cwd(), 'backend-test-report.json');
    await writeFile(reportPath, JSON.stringify(this.results, null, 2));
    
    this.log('\n📊 测试总结:', 'info');
    this.log(`总计: ${this.results.summary.total}`, 'info');
    this.log(`✅ 通过: ${this.results.summary.passed}`, 'success');
    this.log(`❌ 失败: ${this.results.summary.failed}`, 'error');
    this.log(`⏱️ 总耗时: ${this.results.duration}ms`, 'info');
    this.log(`📄 报告已保存: ${reportPath}`, 'info');
    
    return this.results;
  }

  async runAllTests() {
    this.log('🚀 开始后端功能测试...', 'info');
    
    try {
      // 1. 检查编译状态
      await this.testCompilation();
      
      // 2. 检查依赖项
      await this.checkDependencies();
      
      // 3. 测试数据库模式（如果有测试）
      // await this.testDatabaseSchema();
      
      // 4. 测试Tauri命令（如果有测试）
      // await this.testTauriCommands();
      
      // 5. 测试应用构建（可选，耗时较长）
      // await this.testApplicationBuild();
      
    } catch (error) {
      this.log(`测试过程中发生错误: ${error.message}`, 'error');
    }
    
    return await this.generateReport();
  }
}

// 运行测试
async function main() {
  const tester = new BackendTester();
  const results = await tester.runAllTests();
  
  // 根据测试结果设置退出码
  const success = results.summary.failed === 0;
  process.exit(success ? 0 : 1);
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('测试运行失败:', error);
    process.exit(1);
  });
}

export { BackendTester };
