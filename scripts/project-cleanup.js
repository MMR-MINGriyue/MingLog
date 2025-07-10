#!/usr/bin/env node

/**
 * MingLog项目文件整理和清理脚本
 * 自动整理项目文件结构，清理重复和临时文件
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class ProjectCleanup {
  constructor() {
    this.results = {
      startTime: new Date().toISOString(),
      operations: [],
      summary: { 
        moved: 0, 
        deleted: 0, 
        created: 0, 
        errors: 0 
      }
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('zh-CN');
    const icons = { 
      info: 'ℹ️', 
      success: '✅', 
      error: '❌', 
      warning: '⚠️',
      move: '📁',
      delete: '🗑️',
      create: '📄'
    };
    console.log(`[${timestamp}] ${icons[type]} ${message}`);
  }

  addResult(operation, type, success, details = '') {
    const result = {
      operation,
      type,
      success,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.results.operations.push(result);
    if (success) {
      this.results.summary[type]++;
      this.log(`${operation} - 成功`, 'success');
    } else {
      this.results.summary.errors++;
      this.log(`${operation} - 失败: ${details}`, 'error');
    }
  }

  async ensureDirectory(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
      this.addResult(`创建目录: ${dirPath}`, 'created', true);
    }
  }

  async moveFile(source, destination) {
    try {
      const destDir = path.dirname(destination);
      await this.ensureDirectory(destDir);
      await fs.rename(source, destination);
      this.addResult(`移动文件: ${path.basename(source)} -> ${path.relative(projectRoot, destination)}`, 'moved', true);
    } catch (error) {
      this.addResult(`移动文件: ${source}`, 'moved', false, error.message);
    }
  }

  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      this.addResult(`删除文件: ${path.basename(filePath)}`, 'deleted', true);
    } catch (error) {
      this.addResult(`删除文件: ${filePath}`, 'deleted', false, error.message);
    }
  }

  async organizeReports() {
    this.log('🗂️ 整理项目报告文件...', 'info');
    
    const reportsDir = path.join(projectRoot, 'docs', 'reports');
    await this.ensureDirectory(reportsDir);

    const reportFiles = [
      'CLEANUP_REPORT.md',
      'FUNCTION_TEST_GUIDE.md', 
      'LOADING_ISSUE_FIX_REPORT.md',
      'TECHNICAL_IMPROVEMENT_PLAN.md',
      'GIT_CLEANUP_REPORT.md',
      'PROJECT_STATUS_AND_DEVELOPMENT_PLAN.md'
    ];

    for (const file of reportFiles) {
      const sourcePath = path.join(projectRoot, file);
      const destPath = path.join(reportsDir, file);
      
      try {
        await fs.access(sourcePath);
        await this.moveFile(sourcePath, destPath);
      } catch {
        // 文件不存在，跳过
      }
    }

    // 整理桌面应用的报告文件
    const desktopReportsDir = path.join(projectRoot, 'apps', 'tauri-desktop', 'docs', 'reports');
    await this.ensureDirectory(desktopReportsDir);

    const desktopReports = [
      'ERROR_FIX_REPORT.md',
      'FUNCTIONAL_TEST_REPORT.md',
      'CODE_CLEANUP_REPORT.md',
      'TRAY_ICON_FIX.md'
    ];

    const desktopPath = path.join(projectRoot, 'apps', 'tauri-desktop');
    for (const file of desktopReports) {
      const sourcePath = path.join(desktopPath, file);
      const destPath = path.join(desktopReportsDir, file);
      
      try {
        await fs.access(sourcePath);
        await this.moveFile(sourcePath, destPath);
      } catch {
        // 文件不存在，跳过
      }
    }
  }

  async organizeScripts() {
    this.log('📜 整理脚本文件...', 'info');
    
    const scriptsDir = path.join(projectRoot, 'scripts');
    const categories = {
      'build': ['build-production.ps1', 'build-production.sh', 'build-release.ps1', 'build-release.sh'],
      'test': ['test-cross-platform.js', 'validate-build.ps1', 'verify-setup.ps1'],
      'maintenance': ['code-maintenance.js', 'performance-optimization.js', 'quality-check.js'],
      'release': ['release.js', 'release-beta.ps1', 'monitor-release.js']
    };

    for (const [category, files] of Object.entries(categories)) {
      const categoryDir = path.join(scriptsDir, category);
      await this.ensureDirectory(categoryDir);

      for (const file of files) {
        const sourcePath = path.join(scriptsDir, file);
        const destPath = path.join(categoryDir, file);
        
        try {
          await fs.access(sourcePath);
          await this.moveFile(sourcePath, destPath);
        } catch {
          // 文件不存在，跳过
        }
      }
    }
  }

  async cleanupTempFiles() {
    this.log('🧹 清理临时文件...', 'info');
    
    const tempPatterns = [
      '**/*.tmp',
      '**/*.temp',
      '**/node_modules/.cache',
      '**/dist/temp',
      '**/.DS_Store',
      '**/Thumbs.db'
    ];

    // 这里可以添加具体的临时文件清理逻辑
    // 为了安全起见，暂时只记录而不实际删除
    this.log('临时文件清理功能已准备就绪（需要手动确认）', 'warning');
  }

  async createDirectoryStructure() {
    this.log('📁 创建标准目录结构...', 'info');
    
    const directories = [
      'docs/api',
      'docs/user-guide', 
      'docs/development',
      'docs/reports',
      'scripts/build',
      'scripts/test',
      'scripts/maintenance',
      'scripts/release',
      'tools/development',
      'tools/deployment',
      'temp/backup',
      'temp/logs'
    ];

    for (const dir of directories) {
      const dirPath = path.join(projectRoot, dir);
      await this.ensureDirectory(dirPath);
    }
  }

  async generateCleanupReport() {
    const reportContent = `# 🧹 项目文件整理报告

## 📊 整理总结

**执行时间**: ${this.results.startTime}  
**移动文件**: ${this.results.summary.moved}  
**删除文件**: ${this.results.summary.deleted}  
**创建目录**: ${this.results.summary.created}  
**错误数量**: ${this.results.summary.errors}

## 📋 执行的操作

${this.results.operations.map(op => 
  `### ${op.success ? '✅' : '❌'} ${op.operation}
- **类型**: ${op.type}
- **状态**: ${op.success ? '成功' : '失败'}
- **时间**: ${new Date(op.timestamp).toLocaleTimeString('zh-CN')}
${op.details ? `- **详情**: ${op.details}` : ''}
`).join('\n')}

## 🗂️ 新的文件结构

### 📁 文档组织
- \`docs/reports/\` - 所有项目报告
- \`docs/api/\` - API文档
- \`docs/user-guide/\` - 用户指南
- \`docs/development/\` - 开发文档

### 📜 脚本组织
- \`scripts/build/\` - 构建脚本
- \`scripts/test/\` - 测试脚本
- \`scripts/maintenance/\` - 维护脚本
- \`scripts/release/\` - 发布脚本

### 🛠️ 工具目录
- \`tools/development/\` - 开发工具
- \`tools/deployment/\` - 部署工具

### 📦 临时目录
- \`temp/backup/\` - 备份文件
- \`temp/logs/\` - 日志文件

## 🎯 后续建议

### 立即行动
1. **验证文件移动** - 确认所有文件都在正确位置
2. **更新引用路径** - 修改代码中的文件路径引用
3. **清理空目录** - 删除不再需要的空目录

### 维护建议
1. **定期整理** - 每月执行一次文件整理
2. **路径标准化** - 建立文件命名和路径规范
3. **自动化清理** - 集成到CI/CD流程中

---

*报告生成时间: ${new Date().toLocaleString('zh-CN')}*  
*执行者: 项目清理脚本*
`;

    await fs.writeFile(path.join(projectRoot, 'docs', 'reports', 'PROJECT_CLEANUP_REPORT.md'), reportContent);
    this.log('清理报告已生成', 'success');
  }

  async cleanup() {
    this.log('🚀 开始项目文件整理...', 'info');
    
    try {
      // 1. 创建标准目录结构
      await this.createDirectoryStructure();
      
      // 2. 整理报告文件
      await this.organizeReports();
      
      // 3. 整理脚本文件
      await this.organizeScripts();
      
      // 4. 清理临时文件
      await this.cleanupTempFiles();
      
      // 5. 生成报告
      await this.generateCleanupReport();
      
      this.log('✨ 项目文件整理完成！', 'success');
      
    } catch (error) {
      this.log(`整理过程中发生错误: ${error.message}`, 'error');
    }
  }
}

// 运行清理
async function main() {
  const cleanup = new ProjectCleanup();
  await cleanup.cleanup();
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('清理失败:', error);
    process.exit(1);
  });
}

export { ProjectCleanup };
