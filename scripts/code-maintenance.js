// 统一的代码维护脚本，集成自动修复、性能优化和质量检查功能
import { execSync } from 'child_process';
import { existsSync } from 'fs';

function run(cmd, desc) {
  try {
    console.log(`\n[运行] ${desc} ...`);
    execSync(cmd, { stdio: 'inherit' });
    console.log(`[完成] ${desc}`);
  } catch (e) {
    console.error(`[失败] ${desc}`);
    process.exit(1);
  }
}

// 代码自动修复
if (existsSync('node_modules/.bin/eslint')) {
  run('npx eslint . --fix', '自动修复 ESLint 问题');
}

// 代码质量检查
if (existsSync('node_modules/.bin/eslint')) {
  run('npx eslint .', '代码质量检查');
}

// 性能优化（示例：可扩展更多优化命令）
run('npx prettier --write .', '格式化所有代码');

console.log('\n✅ 代码维护全部完成');
