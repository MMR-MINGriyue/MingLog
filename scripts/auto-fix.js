#!/usr/bin/env node

/**
 * 自动修复脚本
 * Auto Fix Script
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description, options = {}) {
  log(`\n🔧 ${description}...`, 'blue');
  try {
    const output = execSync(command, { 
      cwd: rootDir, 
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    log(`✅ ${description} completed`, 'green');
    return { success: true, output };
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    if (error.stdout && !options.silent) log(error.stdout, 'yellow');
    if (error.stderr && !options.silent) log(error.stderr, 'red');
    return { success: false, error };
  }
}

function fixESLintIssues() {
  log('\n🔍 Fixing ESLint issues...', 'cyan');
  
  const packages = [
    'packages/ui/src',
    'packages/editor/src',
    'packages/core/src',
    'packages/database/src',
    'packages/search/src',
    'apps/web/src',
    'apps/desktop/src',
  ];
  
  let totalFixed = 0;
  
  packages.forEach(pkg => {
    const pkgPath = join(rootDir, pkg);
    if (existsSync(pkgPath)) {
      log(`\n📁 Fixing ${pkg}...`, 'blue');
      
      const result = runCommand(
        `npx eslint "${pkg}/**/*.{ts,tsx}" --fix --ext .ts,.tsx`,
        `ESLint fix for ${pkg}`,
        { silent: true }
      );
      
      if (result.success) {
        // 计算修复的问题数量
        const fixedCount = (result.output.match(/✖/g) || []).length;
        totalFixed += fixedCount;
        
        if (fixedCount > 0) {
          log(`  ✅ Fixed ${fixedCount} issues`, 'green');
        } else {
          log(`  ✓ No issues found`, 'blue');
        }
      }
    }
  });
  
  log(`\n📊 Total ESLint issues fixed: ${totalFixed}`, 'magenta');
  return totalFixed;
}

function formatCode() {
  log('\n💅 Formatting code with Prettier...', 'cyan');
  
  const result = runCommand(
    'npx prettier --write "**/*.{ts,tsx,js,jsx,json,md,yml,yaml}" --ignore-path .gitignore',
    'Code formatting'
  );
  
  return result.success;
}

function fixImports() {
  log('\n📦 Organizing imports...', 'cyan');
  
  const sourceFiles = glob.sync('packages/*/src/**/*.{ts,tsx}', { cwd: rootDir });
  let fixedFiles = 0;
  
  sourceFiles.forEach(file => {
    const fullPath = join(rootDir, file);
    try {
      let content = readFileSync(fullPath, 'utf8');
      const originalContent = content;
      
      // 移除未使用的导入（简单版本）
      const lines = content.split('\n');
      const importLines = [];
      const otherLines = [];
      
      lines.forEach(line => {
        if (line.trim().startsWith('import ')) {
          importLines.push(line);
        } else {
          otherLines.push(line);
        }
      });
      
      // 检查每个导入是否在代码中使用
      const usedImports = [];
      const codeContent = otherLines.join('\n');
      
      importLines.forEach(importLine => {
        // 提取导入的标识符
        const match = importLine.match(/import\s+(?:{([^}]+)}|\*\s+as\s+(\w+)|(\w+))/);
        if (match) {
          const identifiers = match[1] 
            ? match[1].split(',').map(id => id.trim().split(' as ')[0].trim())
            : [match[2] || match[3]];
          
          // 检查是否在代码中使用
          const isUsed = identifiers.some(id => 
            codeContent.includes(id) || 
            codeContent.includes(`${id}.`) ||
            codeContent.includes(`${id}(`) ||
            codeContent.includes(`<${id}`)
          );
          
          if (isUsed) {
            usedImports.push(importLine);
          }
        } else {
          // 保留无法解析的导入
          usedImports.push(importLine);
        }
      });
      
      // 重新组织导入
      const organizedImports = [
        ...usedImports.filter(line => line.includes("'react'")),
        ...usedImports.filter(line => line.includes('@/')),
        ...usedImports.filter(line => line.includes('../')),
        ...usedImports.filter(line => line.includes('./')),
        ...usedImports.filter(line => 
          !line.includes("'react'") && 
          !line.includes('@/') && 
          !line.includes('../') && 
          !line.includes('./')
        ),
      ].filter(Boolean);
      
      content = [...organizedImports, '', ...otherLines].join('\n');
      
      if (content !== originalContent) {
        writeFileSync(fullPath, content);
        fixedFiles++;
      }
      
    } catch (error) {
      log(`⚠️  Error processing ${file}: ${error.message}`, 'yellow');
    }
  });
  
  log(`✅ Organized imports in ${fixedFiles} files`, 'green');
  return fixedFiles;
}

function fixPackageJsonFiles() {
  log('\n📝 Fixing package.json files...', 'cyan');
  
  const packageFiles = glob.sync('**/package.json', { 
    cwd: rootDir,
    ignore: ['node_modules/**']
  });
  
  let fixedFiles = 0;
  
  packageFiles.forEach(file => {
    const fullPath = join(rootDir, file);
    try {
      const packageJson = JSON.parse(readFileSync(fullPath, 'utf8'));
      let modified = false;
      
      // 排序 scripts
      if (packageJson.scripts) {
        const sortedScripts = {};
        Object.keys(packageJson.scripts).sort().forEach(key => {
          sortedScripts[key] = packageJson.scripts[key];
        });
        packageJson.scripts = sortedScripts;
        modified = true;
      }
      
      // 排序 dependencies
      if (packageJson.dependencies) {
        const sortedDeps = {};
        Object.keys(packageJson.dependencies).sort().forEach(key => {
          sortedDeps[key] = packageJson.dependencies[key];
        });
        packageJson.dependencies = sortedDeps;
        modified = true;
      }
      
      // 排序 devDependencies
      if (packageJson.devDependencies) {
        const sortedDevDeps = {};
        Object.keys(packageJson.devDependencies).sort().forEach(key => {
          sortedDevDeps[key] = packageJson.devDependencies[key];
        });
        packageJson.devDependencies = sortedDevDeps;
        modified = true;
      }
      
      // 确保有正确的字段顺序
      const orderedPackageJson = {
        name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
        type: packageJson.type,
        main: packageJson.main,
        module: packageJson.module,
        types: packageJson.types,
        exports: packageJson.exports,
        files: packageJson.files,
        scripts: packageJson.scripts,
        dependencies: packageJson.dependencies,
        devDependencies: packageJson.devDependencies,
        peerDependencies: packageJson.peerDependencies,
        ...Object.fromEntries(
          Object.entries(packageJson).filter(([key]) => 
            !['name', 'version', 'description', 'type', 'main', 'module', 'types', 'exports', 'files', 'scripts', 'dependencies', 'devDependencies', 'peerDependencies'].includes(key)
          )
        )
      };
      
      // 移除 undefined 字段
      Object.keys(orderedPackageJson).forEach(key => {
        if (orderedPackageJson[key] === undefined) {
          delete orderedPackageJson[key];
        }
      });
      
      if (modified) {
        writeFileSync(fullPath, JSON.stringify(orderedPackageJson, null, 2) + '\n');
        fixedFiles++;
        log(`  ✅ Fixed ${file}`, 'green');
      }
      
    } catch (error) {
      log(`❌ Error fixing ${file}: ${error.message}`, 'red');
    }
  });
  
  log(`📊 Fixed ${fixedFiles} package.json files`, 'magenta');
  return fixedFiles;
}

function fixTypeScriptIssues() {
  log('\n🔧 Fixing TypeScript issues...', 'cyan');
  
  // 运行类型检查
  const typeCheckResult = runCommand(
    'pnpm type-check',
    'TypeScript type checking',
    { silent: true }
  );
  
  if (typeCheckResult.success) {
    log('✅ No TypeScript errors found', 'green');
    return true;
  } else {
    log('⚠️  TypeScript errors found, manual fixing may be required', 'yellow');
    return false;
  }
}

function generateFixReport(results) {
  log('\n📊 Auto Fix Report', 'magenta');
  log('==================', 'magenta');
  
  log(`\n🔍 ESLint Issues Fixed: ${results.eslintFixed}`, 'cyan');
  log(`📦 Import Files Organized: ${results.importsFixed}`, 'cyan');
  log(`📝 Package.json Files Fixed: ${results.packageJsonFixed}`, 'cyan');
  log(`💅 Code Formatting: ${results.codeFormatted ? 'Completed' : 'Failed'}`, 'cyan');
  log(`🔧 TypeScript Issues: ${results.typeScriptFixed ? 'No errors' : 'Errors found'}`, 'cyan');
  
  const totalIssuesFixed = results.eslintFixed + results.importsFixed + results.packageJsonFixed;
  
  if (totalIssuesFixed > 0) {
    log(`\n🎉 Total issues automatically fixed: ${totalIssuesFixed}`, 'green');
  } else {
    log(`\n✨ No issues found to fix!`, 'green');
  }
  
  if (!results.typeScriptFixed) {
    log(`\n⚠️  Manual attention required for TypeScript errors`, 'yellow');
  }
}

async function main() {
  log('🚀 Starting auto fix process...', 'cyan');
  
  const results = {
    eslintFixed: fixESLintIssues(),
    codeFormatted: formatCode(),
    importsFixed: fixImports(),
    packageJsonFixed: fixPackageJsonFiles(),
    typeScriptFixed: fixTypeScriptIssues(),
  };
  
  generateFixReport(results);
  
  log('\n✨ Auto fix process completed!', 'green');
  log('\n💡 Tip: Run "git diff" to review the changes before committing', 'blue');
}

main().catch(error => {
  log(`\n💥 Auto fix failed: ${error.message}`, 'red');
  process.exit(1);
});
