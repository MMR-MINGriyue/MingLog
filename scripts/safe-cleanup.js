/**
 * MingLog项目安全清理脚本
 * 清理构建产物和缓存文件，释放磁盘空间
 * 
 * 执行: node scripts/safe-cleanup.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SafeCleanup {
  constructor() {
    this.projectRoot = process.cwd();
    this.cleanupStats = {
      deletedFiles: 0,
      deletedDirs: 0,
      freedSpace: 0,
      errors: []
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',    // cyan
      success: '\x1b[32m', // green
      warning: '\x1b[33m', // yellow
      error: '\x1b[31m',   // red
      reset: '\x1b[0m'
    };
    
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async getDirectorySize(dirPath) {
    try {
      if (!fs.existsSync(dirPath)) return 0;
      
      let totalSize = 0;
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          totalSize += await this.getDirectorySize(itemPath);
        } else {
          totalSize += stats.size;
        }
      }
      
      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async safeDelete(targetPath, description) {
    try {
      if (!fs.existsSync(targetPath)) {
        this.log(`跳过 ${description} (不存在): ${targetPath}`, 'warning');
        return false;
      }

      const stats = fs.statSync(targetPath);
      const size = stats.isDirectory() ? await this.getDirectorySize(targetPath) : stats.size;
      
      this.log(`删除 ${description}: ${targetPath} (${this.formatBytes(size)})`, 'info');
      
      if (stats.isDirectory()) {
        fs.rmSync(targetPath, { recursive: true, force: true });
        this.cleanupStats.deletedDirs++;
      } else {
        fs.unlinkSync(targetPath);
        this.cleanupStats.deletedFiles++;
      }
      
      this.cleanupStats.freedSpace += size;
      this.log(`✅ 已删除 ${description}`, 'success');
      return true;
      
    } catch (error) {
      this.log(`❌ 删除失败 ${description}: ${error.message}`, 'error');
      this.cleanupStats.errors.push({ path: targetPath, error: error.message });
      return false;
    }
  }

  async cleanRustBuildArtifacts() {
    this.log('🦀 清理Rust构建产物...', 'info');
    
    const rustTargets = [
      'apps/tauri-desktop/src-tauri/target/debug',
      'apps/tauri-desktop/src-tauri/target/release',
      'apps/tauri-desktop/src-tauri/target/deps',
      'apps/tauri-desktop/src-tauri/target/.rustc_info.json'
    ];

    for (const target of rustTargets) {
      const fullPath = path.join(this.projectRoot, target);
      await this.safeDelete(fullPath, `Rust构建产物 (${target})`);
    }
  }

  async cleanFrontendBuildArtifacts() {
    this.log('⚛️ 清理前端构建产物...', 'info');
    
    const frontendTargets = [
      'apps/tauri-desktop/dist',
      'packages/core/dist',
      'packages/ui/dist',
      'packages/mindmap/dist',
      'packages/graph/dist'
    ];

    // 查找所有packages下的dist目录
    const packagesDir = path.join(this.projectRoot, 'packages');
    if (fs.existsSync(packagesDir)) {
      const packages = fs.readdirSync(packagesDir);
      for (const pkg of packages) {
        const distPath = path.join(packagesDir, pkg, 'dist');
        if (fs.existsSync(distPath)) {
          frontendTargets.push(`packages/${pkg}/dist`);
        }
      }
    }

    for (const target of frontendTargets) {
      const fullPath = path.join(this.projectRoot, target);
      await this.safeDelete(fullPath, `前端构建产物 (${target})`);
    }
  }

  async cleanTestAndCoverageFiles() {
    this.log('🧪 清理测试和覆盖率文件...', 'info');
    
    const testTargets = [
      'coverage',
      '.nyc_output',
      'test-results',
      'playwright-report',
      'playwright/.cache'
    ];

    for (const target of testTargets) {
      const fullPath = path.join(this.projectRoot, target);
      await this.safeDelete(fullPath, `测试覆盖率文件 (${target})`);
    }

    // 清理临时测试文件
    const tempTestFiles = [
      'apps/tauri-desktop/test-simple.html',
      'apps/tauri-desktop/comprehensive-test-suite.html'
    ];

    for (const file of tempTestFiles) {
      const fullPath = path.join(this.projectRoot, file);
      await this.safeDelete(fullPath, `临时测试文件 (${file})`);
    }
  }

  async cleanCacheAndTempFiles() {
    this.log('🗂️ 清理缓存和临时文件...', 'info');
    
    const cacheTargets = [
      '.vite',
      '.cache',
      '.parcel-cache',
      'node_modules/.cache',
      '.eslintcache',
      '.stylelintcache'
    ];

    for (const target of cacheTargets) {
      const fullPath = path.join(this.projectRoot, target);
      await this.safeDelete(fullPath, `缓存文件 (${target})`);
    }

    // 清理TypeScript构建信息
    try {
      const tsBuildInfoFiles = execSync('find . -name "*.tsbuildinfo" -type f', { encoding: 'utf8' }).trim().split('\n');
      for (const file of tsBuildInfoFiles) {
        if (file) {
          const fullPath = path.join(this.projectRoot, file);
          await this.safeDelete(fullPath, `TypeScript构建信息 (${file})`);
        }
      }
    } catch (error) {
      // find命令可能在Windows上不可用，忽略错误
    }
  }

  async cleanNodeModules() {
    this.log('📦 清理Node.js依赖 (可选)...', 'warning');
    this.log('⚠️  注意: 清理后需要运行 pnpm install 重新安装依赖', 'warning');
    
    // 询问用户是否要清理node_modules
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('是否清理node_modules目录? (y/N): ', (answer) => {
        rl.close();
        
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          this.performNodeModulesCleanup().then(resolve);
        } else {
          this.log('跳过node_modules清理', 'info');
          resolve();
        }
      });
    });
  }

  async performNodeModulesCleanup() {
    const nodeModulesTargets = [
      'node_modules',
      'apps/tauri-desktop/node_modules'
    ];

    // 查找所有packages下的node_modules
    const packagesDir = path.join(this.projectRoot, 'packages');
    if (fs.existsSync(packagesDir)) {
      const packages = fs.readdirSync(packagesDir);
      for (const pkg of packages) {
        const nodeModulesPath = path.join(packagesDir, pkg, 'node_modules');
        if (fs.existsSync(nodeModulesPath)) {
          nodeModulesTargets.push(`packages/${pkg}/node_modules`);
        }
      }
    }

    for (const target of nodeModulesTargets) {
      const fullPath = path.join(this.projectRoot, target);
      await this.safeDelete(fullPath, `Node.js依赖 (${target})`);
    }
  }

  generateCleanupReport() {
    this.log('\n📊 清理报告', 'info');
    this.log('='.repeat(50), 'info');
    this.log(`删除的文件数: ${this.cleanupStats.deletedFiles}`, 'info');
    this.log(`删除的目录数: ${this.cleanupStats.deletedDirs}`, 'info');
    this.log(`释放的磁盘空间: ${this.formatBytes(this.cleanupStats.freedSpace)}`, 'success');
    
    if (this.cleanupStats.errors.length > 0) {
      this.log(`\n❌ 错误数量: ${this.cleanupStats.errors.length}`, 'error');
      this.cleanupStats.errors.forEach(error => {
        this.log(`  - ${error.path}: ${error.error}`, 'error');
      });
    }
    
    this.log('='.repeat(50), 'info');
    
    // 保存报告到文件
    const reportPath = path.join(this.projectRoot, 'cleanup-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      stats: this.cleanupStats
    }, null, 2));
    
    this.log(`清理报告已保存到: ${reportPath}`, 'info');
  }

  async cleanup() {
    this.log('🚀 开始MingLog项目安全清理...', 'info');
    this.log(`项目根目录: ${this.projectRoot}`, 'info');
    
    try {
      // 阶段1: 清理Rust构建产物
      await this.cleanRustBuildArtifacts();
      
      // 阶段2: 清理前端构建产物
      await this.cleanFrontendBuildArtifacts();
      
      // 阶段3: 清理测试和覆盖率文件
      await this.cleanTestAndCoverageFiles();
      
      // 阶段4: 清理缓存和临时文件
      await this.cleanCacheAndTempFiles();
      
      // 阶段5: 可选清理Node.js依赖
      await this.cleanNodeModules();
      
      // 生成报告
      this.generateCleanupReport();
      
      this.log('\n🎉 清理完成！', 'success');
      
    } catch (error) {
      this.log(`清理过程中发生错误: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// 运行清理
async function main() {
  const cleanup = new SafeCleanup();
  await cleanup.cleanup();
}

if (require.main === module) {
  main();
}

module.exports = SafeCleanup;
