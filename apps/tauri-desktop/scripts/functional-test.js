#!/usr/bin/env node

/**
 * MingLog 桌面应用功能验证测试脚本
 * 测试核心功能：笔记CRUD、搜索、界面响应、数据库完整性
 */

import { invoke } from '@tauri-apps/api/tauri';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

// 测试配置
const TEST_CONFIG = {
  timeout: 5000,
  retries: 3,
  testDataPath: './test-results.json'
};

// 测试结果收集器
class TestReporter {
  constructor() {
    this.results = {
      startTime: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      }
    };
  }

  addTest(name, status, duration, error = null, details = null) {
    const test = {
      name,
      status, // 'passed', 'failed', 'skipped'
      duration,
      error,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.results.tests.push(test);
    this.results.summary.total++;
    this.results.summary[status]++;
    
    // 控制台输出
    const statusIcon = {
      passed: '✅',
      failed: '❌', 
      skipped: '⏭️'
    }[status];
    
    console.log(`${statusIcon} ${name} (${duration}ms)`);
    if (error) {
      console.log(`   错误: ${error}`);
    }
    if (details) {
      console.log(`   详情: ${JSON.stringify(details, null, 2)}`);
    }
  }

  async generateReport() {
    this.results.endTime = new Date().toISOString();
    this.results.totalDuration = new Date(this.results.endTime) - new Date(this.results.startTime);
    
    // 保存详细报告
    await writeFile(TEST_CONFIG.testDataPath, JSON.stringify(this.results, null, 2));
    
    // 控制台总结
    console.log('\n📊 测试总结:');
    console.log(`总计: ${this.results.summary.total}`);
    console.log(`✅ 通过: ${this.results.summary.passed}`);
    console.log(`❌ 失败: ${this.results.summary.failed}`);
    console.log(`⏭️ 跳过: ${this.results.summary.skipped}`);
    console.log(`⏱️ 总耗时: ${this.results.totalDuration}ms`);
    
    return this.results;
  }
}

// 测试工具函数
async function testWithTimeout(testFn, timeout = TEST_CONFIG.timeout) {
  return Promise.race([
    testFn(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('测试超时')), timeout)
    )
  ]);
}

async function retryTest(testFn, retries = TEST_CONFIG.retries) {
  let lastError;
  for (let i = 0; i <= retries; i++) {
    try {
      return await testFn();
    } catch (error) {
      lastError = error;
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒重试
      }
    }
  }
  throw lastError;
}

// 核心功能测试类
class FunctionalTests {
  constructor(reporter) {
    this.reporter = reporter;
    this.testNotes = [];
  }

  // 1. 笔记CRUD操作测试
  async testNoteCRUD() {
    console.log('\n🔍 开始笔记CRUD操作测试...');
    
    // 测试创建笔记
    await this.testCreateNote();
    await this.testReadNote();
    await this.testUpdateNote();
    await this.testDeleteNote();
  }

  async testCreateNote() {
    const startTime = Date.now();
    try {
      const noteData = {
        title: '测试笔记标题',
        content: '这是一个测试笔记的内容，包含**Markdown**格式。\n\n- 列表项1\n- 列表项2\n\n```javascript\nconsole.log("代码块测试");\n```'
      };

      const result = await testWithTimeout(async () => {
        return await invoke('create_note', noteData);
      });

      this.testNotes.push(result);
      
      this.reporter.addTest(
        '创建笔记',
        'passed',
        Date.now() - startTime,
        null,
        { noteId: result.id, title: result.title }
      );
      
      return result;
    } catch (error) {
      this.reporter.addTest(
        '创建笔记',
        'failed',
        Date.now() - startTime,
        error.message
      );
      throw error;
    }
  }

  async testReadNote() {
    const startTime = Date.now();
    try {
      if (this.testNotes.length === 0) {
        throw new Error('没有可读取的测试笔记');
      }

      const noteId = this.testNotes[0].id;
      const result = await testWithTimeout(async () => {
        return await invoke('get_note', { id: noteId });
      });

      if (!result || result.id !== noteId) {
        throw new Error('读取的笔记数据不匹配');
      }

      this.reporter.addTest(
        '读取笔记',
        'passed',
        Date.now() - startTime,
        null,
        { noteId: result.id, title: result.title }
      );
      
      return result;
    } catch (error) {
      this.reporter.addTest(
        '读取笔记',
        'failed',
        Date.now() - startTime,
        error.message
      );
      throw error;
    }
  }

  async testUpdateNote() {
    const startTime = Date.now();
    try {
      if (this.testNotes.length === 0) {
        throw new Error('没有可更新的测试笔记');
      }

      const noteId = this.testNotes[0].id;
      const updateData = {
        id: noteId,
        title: '更新后的测试笔记标题',
        content: '这是更新后的内容，验证更新功能正常工作。'
      };

      const result = await testWithTimeout(async () => {
        return await invoke('update_note', updateData);
      });

      if (!result || result.title !== updateData.title) {
        throw new Error('笔记更新失败');
      }

      this.reporter.addTest(
        '更新笔记',
        'passed',
        Date.now() - startTime,
        null,
        { noteId: result.id, newTitle: result.title }
      );
      
      return result;
    } catch (error) {
      this.reporter.addTest(
        '更新笔记',
        'failed',
        Date.now() - startTime,
        error.message
      );
      throw error;
    }
  }

  async testDeleteNote() {
    const startTime = Date.now();
    try {
      if (this.testNotes.length === 0) {
        throw new Error('没有可删除的测试笔记');
      }

      const noteId = this.testNotes[0].id;
      
      await testWithTimeout(async () => {
        return await invoke('delete_note', { id: noteId });
      });

      // 验证笔记已被删除
      try {
        await invoke('get_note', { id: noteId });
        throw new Error('笔记删除后仍然可以读取');
      } catch (error) {
        if (!error.message.includes('not found') && !error.message.includes('找不到')) {
          throw error;
        }
      }

      this.reporter.addTest(
        '删除笔记',
        'passed',
        Date.now() - startTime,
        null,
        { deletedNoteId: noteId }
      );
      
    } catch (error) {
      this.reporter.addTest(
        '删除笔记',
        'failed',
        Date.now() - startTime,
        error.message
      );
      throw error;
    }
  }

  // 2. 搜索功能测试
  async testSearchFunctionality() {
    console.log('\n🔍 开始搜索功能测试...');
    
    // 先创建一些测试数据
    await this.createTestData();
    await this.testFullTextSearch();
    await this.testTitleSearch();
    await this.testEmptySearch();
  }

  async createTestData() {
    const testNotes = [
      {
        title: 'JavaScript学习笔记',
        content: '学习JavaScript的基础知识，包括变量、函数、对象等概念。'
      },
      {
        title: 'React开发指南',
        content: 'React是一个用于构建用户界面的JavaScript库。'
      },
      {
        title: '数据库设计原则',
        content: '关系型数据库的设计原则和最佳实践。'
      }
    ];

    for (const noteData of testNotes) {
      try {
        const note = await invoke('create_note', noteData);
        this.testNotes.push(note);
      } catch (error) {
        console.warn(`创建测试数据失败: ${error.message}`);
      }
    }
  }

  async testFullTextSearch() {
    const startTime = Date.now();
    try {
      const searchQuery = 'JavaScript';
      const results = await testWithTimeout(async () => {
        return await invoke('search_notes', { query: searchQuery });
      });

      if (!Array.isArray(results)) {
        throw new Error('搜索结果不是数组格式');
      }

      // 验证搜索结果包含相关内容
      const relevantResults = results.filter(note => 
        note.title.includes(searchQuery) || note.content.includes(searchQuery)
      );

      if (relevantResults.length === 0) {
        throw new Error('搜索结果中没有相关内容');
      }

      this.reporter.addTest(
        '全文搜索',
        'passed',
        Date.now() - startTime,
        null,
        { query: searchQuery, resultCount: results.length, relevantCount: relevantResults.length }
      );
      
    } catch (error) {
      this.reporter.addTest(
        '全文搜索',
        'failed',
        Date.now() - startTime,
        error.message
      );
    }
  }

  async testTitleSearch() {
    const startTime = Date.now();
    try {
      const searchQuery = 'React';
      const results = await testWithTimeout(async () => {
        return await invoke('search_notes', { query: searchQuery });
      });

      const titleMatches = results.filter(note => note.title.includes(searchQuery));
      
      if (titleMatches.length === 0) {
        throw new Error('标题搜索没有找到匹配结果');
      }

      this.reporter.addTest(
        '标题搜索',
        'passed',
        Date.now() - startTime,
        null,
        { query: searchQuery, titleMatches: titleMatches.length }
      );
      
    } catch (error) {
      this.reporter.addTest(
        '标题搜索',
        'failed',
        Date.now() - startTime,
        error.message
      );
    }
  }

  async testEmptySearch() {
    const startTime = Date.now();
    try {
      const results = await testWithTimeout(async () => {
        return await invoke('search_notes', { query: '' });
      });

      // 空搜索应该返回所有笔记
      if (!Array.isArray(results) || results.length === 0) {
        throw new Error('空搜索应该返回所有笔记');
      }

      this.reporter.addTest(
        '空搜索测试',
        'passed',
        Date.now() - startTime,
        null,
        { totalNotes: results.length }
      );
      
    } catch (error) {
      this.reporter.addTest(
        '空搜索测试',
        'failed',
        Date.now() - startTime,
        error.message
      );
    }
  }

  // 清理测试数据
  async cleanup() {
    console.log('\n🧹 清理测试数据...');
    for (const note of this.testNotes) {
      try {
        await invoke('delete_note', { id: note.id });
      } catch (error) {
        console.warn(`清理笔记失败 ${note.id}: ${error.message}`);
      }
    }
    this.testNotes = [];
  }
}

// 主测试函数
async function runFunctionalTests() {
  console.log('🚀 开始MingLog功能验证测试...\n');
  
  const reporter = new TestReporter();
  const tests = new FunctionalTests(reporter);
  
  try {
    // 运行核心功能测试
    await tests.testNoteCRUD();
    await tests.testSearchFunctionality();
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  } finally {
    // 清理测试数据
    await tests.cleanup();
    
    // 生成测试报告
    const results = await reporter.generateReport();
    
    console.log(`\n📄 详细报告已保存到: ${TEST_CONFIG.testDataPath}`);
    
    // 返回测试结果
    return results;
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  runFunctionalTests()
    .then(results => {
      const success = results.summary.failed === 0;
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('测试运行失败:', error);
      process.exit(1);
    });
}

export { runFunctionalTests, FunctionalTests, TestReporter };
