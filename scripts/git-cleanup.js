#!/usr/bin/env node

/**
 * Git仓库清理和分支整理脚本
 * 强制覆盖GitHub仓库，以当前main分支为准
 */

import { spawn } from 'child_process';
import { writeFile } from 'fs/promises';

class GitCleanup {
  constructor() {
    this.results = {
      startTime: new Date().toISOString(),
      operations: [],
      summary: { total: 0, success: 0, failed: 0 }
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('zh-CN');
    const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };
    console.log(`[${timestamp}] ${icons[type]} ${message}`);
  }

  addResult(operation, success, details = '') {
    const result = {
      operation,
      success,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.results.operations.push(result);
    this.results.summary.total++;
    if (success) {
      this.results.summary.success++;
      this.log(`${operation} - 成功`, 'success');
    } else {
      this.results.summary.failed++;
      this.log(`${operation} - 失败: ${details}`, 'error');
    }
    
    if (details && success) {
      this.log(`  详情: ${details}`, 'info');
    }
  }

  async executeCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        cwd: options.cwd || process.cwd(),
        stdio: 'pipe',
        ...options
      });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });
    });
  }

  async getCurrentBranch() {
    try {
      const result = await this.executeCommand('git', ['branch', '--show-current']);
      return result.stdout.trim();
    } catch (error) {
      throw new Error(`获取当前分支失败: ${error.message}`);
    }
  }

  async getAllBranches() {
    try {
      const result = await this.executeCommand('git', ['branch', '-a']);
      const branches = result.stdout
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('*'))
        .map(line => line.replace(/^\*\s*/, '').replace(/^remotes\/origin\//, ''));
      
      return [...new Set(branches)]; // 去重
    } catch (error) {
      throw new Error(`获取分支列表失败: ${error.message}`);
    }
  }

  async deleteLocalBranch(branchName) {
    try {
      await this.executeCommand('git', ['branch', '-D', branchName]);
      this.addResult(`删除本地分支: ${branchName}`, true);
    } catch (error) {
      this.addResult(`删除本地分支: ${branchName}`, false, error.message);
    }
  }

  async deleteRemoteBranch(branchName) {
    try {
      await this.executeCommand('git', ['push', 'origin', '--delete', branchName]);
      this.addResult(`删除远程分支: ${branchName}`, true);
    } catch (error) {
      this.addResult(`删除远程分支: ${branchName}`, false, error.message);
    }
  }

  async forceUpdateMain() {
    try {
      // 确保在main分支
      await this.executeCommand('git', ['checkout', 'main']);
      this.addResult('切换到main分支', true);

      // 强制推送main分支
      await this.executeCommand('git', ['push', '--force-with-lease', 'origin', 'main']);
      this.addResult('强制推送main分支', true);

      // 设置main为默认分支
      await this.executeCommand('git', ['symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/main']);
      this.addResult('设置main为默认分支', true);

    } catch (error) {
      this.addResult('强制更新main分支', false, error.message);
    }
  }

  async createDevelopmentBranches() {
    const branches = [
      {
        name: 'develop',
        description: '开发分支 - 用于日常开发和功能集成'
      },
      {
        name: 'feature/performance-optimization',
        description: '性能优化功能分支'
      },
      {
        name: 'feature/advanced-features',
        description: '高级功能开发分支'
      },
      {
        name: 'release/v1.0.0',
        description: '版本发布分支'
      }
    ];

    for (const branch of branches) {
      try {
        // 创建并切换到新分支
        await this.executeCommand('git', ['checkout', '-b', branch.name]);
        
        // 推送到远程
        await this.executeCommand('git', ['push', '-u', 'origin', branch.name]);
        
        this.addResult(`创建分支: ${branch.name}`, true, branch.description);
        
        // 切换回main
        await this.executeCommand('git', ['checkout', 'main']);
        
      } catch (error) {
        this.addResult(`创建分支: ${branch.name}`, false, error.message);
      }
    }
  }

  async generateCleanupReport() {
    const reportContent = `# 🔧 Git仓库清理和分支整理报告

## 📊 操作总结

**执行时间**: ${this.results.startTime}  
**总操作数**: ${this.results.summary.total}  
**成功**: ${this.results.summary.success}  
**失败**: ${this.results.summary.failed}  
**成功率**: ${((this.results.summary.success / this.results.summary.total) * 100).toFixed(1)}%

## 🎯 清理目标

1. **强制覆盖远程仓库** - 以当前本地main分支为准
2. **清理旧分支** - 删除不需要的功能分支
3. **重新组织分支结构** - 创建标准的开发分支
4. **设置默认分支** - 确保main为默认分支

## 📋 执行的操作

${this.results.operations.map(op => 
  `### ${op.success ? '✅' : '❌'} ${op.operation}
- **状态**: ${op.success ? '成功' : '失败'}
- **时间**: ${new Date(op.timestamp).toLocaleTimeString('zh-CN')}
${op.details ? `- **详情**: ${op.details}` : ''}
`).join('\n')}

## 🌳 新的分支结构

### 主要分支
- **main** - 主分支，生产就绪代码
- **develop** - 开发分支，日常开发和功能集成

### 功能分支
- **feature/performance-optimization** - 性能优化
- **feature/advanced-features** - 高级功能开发

### 发布分支
- **release/v1.0.0** - 版本发布准备

## 🔄 分支工作流程

### 开发流程
1. 从 \`develop\` 创建功能分支
2. 在功能分支上开发
3. 完成后合并回 \`develop\`
4. 定期将 \`develop\` 合并到 \`main\`

### 发布流程
1. 从 \`develop\` 创建 \`release\` 分支
2. 在发布分支上进行最后的测试和修复
3. 合并到 \`main\` 并打标签
4. 合并回 \`develop\`

## 🚀 后续建议

### 立即行动
1. **验证分支状态** - 检查所有分支是否正确创建
2. **更新CI/CD配置** - 确保流水线适配新的分支结构
3. **团队通知** - 告知团队新的分支策略

### 分支保护规则
建议在GitHub上设置以下保护规则：
- \`main\` 分支：需要PR审核，禁止直接推送
- \`develop\` 分支：需要PR审核
- 自动删除已合并的功能分支

### 版本管理
- 使用语义化版本号 (Semantic Versioning)
- 在 \`main\` 分支上打标签
- 维护 CHANGELOG.md

---

*报告生成时间: ${new Date().toLocaleString('zh-CN')}*  
*执行者: Git清理脚本*
`;

    await writeFile('GIT_CLEANUP_REPORT.md', reportContent);
    this.log('清理报告已生成: GIT_CLEANUP_REPORT.md', 'success');
  }

  async cleanup() {
    this.log('🚀 开始Git仓库清理和分支整理...', 'info');
    
    try {
      // 1. 获取当前状态
      const currentBranch = await this.getCurrentBranch();
      this.log(`当前分支: ${currentBranch}`, 'info');
      
      // 2. 强制更新main分支
      await this.forceUpdateMain();
      
      // 3. 删除旧的功能分支（保留main和develop）
      const branchesToDelete = [
        'feature/plugin-system',
        'feature/tauri-desktop', 
        'feature/tauri-integration'
      ];
      
      for (const branch of branchesToDelete) {
        await this.deleteLocalBranch(branch);
        await this.deleteRemoteBranch(branch);
      }
      
      // 4. 创建新的开发分支结构
      await this.createDevelopmentBranches();
      
      // 5. 生成报告
      await this.generateCleanupReport();
      
      this.log('✨ Git仓库清理完成！', 'success');
      
    } catch (error) {
      this.log(`清理过程中发生错误: ${error.message}`, 'error');
    }
  }
}

// 运行清理
async function main() {
  const cleanup = new GitCleanup();
  await cleanup.cleanup();
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('清理失败:', error);
    process.exit(1);
  });
}

export { GitCleanup };
