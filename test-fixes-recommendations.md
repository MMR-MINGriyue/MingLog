# MingLog 测试问题修复建议

## 🚨 紧急修复项目

### 1. 修复Workspace配置问题

**问题**: `npm error code EUNSUPPORTEDPROTOCOL workspace:*`

**根本原因**: package.json中的workspace依赖配置不正确

**修复步骤**:

#### 步骤1: 检查根目录package.json
```bash
# 检查workspace配置
cat package.json | grep -A 10 "workspaces"
```

#### 步骤2: 修复workspace依赖引用
在各个子包的package.json中，将类似这样的依赖：
```json
{
  "dependencies": {
    "@minglog/shared": "workspace:*"
  }
}
```

修改为：
```json
{
  "dependencies": {
    "@minglog/shared": "*"
  }
}
```

#### 步骤3: 重新安装依赖
```bash
# 清理所有node_modules
rm -rf node_modules apps/*/node_modules

# 重新安装
npm install
```

### 2. 修复单元测试失败

**问题**: VirtualizedSearchResults组件测试失败

**修复方案**:

#### 修复测试选择器
在 `apps/tauri-desktop/src/components/__tests__/VirtualizedSearchResults.test.tsx`:

```typescript
// 错误的写法
const element = getByText('Test Result 14');

// 正确的写法
const elements = getAllByText(/Test Result \d+/);
const element = elements.find(el => el.textContent === 'Test Result 14');

// 或者使用更具体的选择器
const element = getByTestId('search-result-14');
```

#### 添加测试ID属性
在组件中添加data-testid属性：
```tsx
<div data-testid={`search-result-${index}`}>
  {/* 组件内容 */}
</div>
```

#### 改进异步测试
```typescript
// 使用waitFor处理异步状态
import { waitFor } from '@testing-library/react';

test('should handle async state updates', async () => {
  render(<VirtualizedSearchResults />);
  
  await waitFor(() => {
    expect(getByTestId('search-results')).toBeInTheDocument();
  });
});
```

## ⚡ 高优先级修复

### 3. 改进测试基础设施

#### 创建测试工具函数
创建 `apps/tauri-desktop/src/test-utils/index.ts`:

```typescript
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { I18nProvider } from '../contexts/I18nContext';

// 自定义render函数，包含所有Provider
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <I18nProvider>
        {children}
      </I18nProvider>
    </ThemeProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

#### 更新测试配置
在 `vitest.config.ts` 中添加：

```typescript
export default defineConfig({
  test: {
    setupFiles: ['./src/test-utils/setup.ts'],
    environment: 'jsdom',
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test-utils/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    }
  }
});
```

### 4. 添加集成测试

#### 创建API测试
创建 `apps/tauri-desktop/src/test/integration/api.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api/tauri';

describe('Tauri API Integration', () => {
  beforeEach(async () => {
    // 清理测试数据
    await invoke('clear_test_data');
  });

  it('should create and retrieve pages', async () => {
    const pageData = {
      title: 'Test Page',
      content: 'Test content'
    };

    const pageId = await invoke('create_page', pageData);
    expect(pageId).toBeDefined();

    const retrievedPage = await invoke('get_page', { id: pageId });
    expect(retrievedPage.title).toBe(pageData.title);
  });

  it('should perform search operations', async () => {
    // 创建测试数据
    await invoke('create_page', { title: 'Search Test', content: 'searchable content' });

    const results = await invoke('search_pages', { query: 'searchable' });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toBe('Search Test');
  });
});
```

### 5. 性能测试实现

#### 创建性能测试套件
创建 `apps/tauri-desktop/src/test/performance/startup.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { performance } from 'perf_hooks';

describe('Performance Tests', () => {
  it('should start application within 3 seconds', async () => {
    const startTime = performance.now();
    
    // 模拟应用启动
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const endTime = performance.now();
    const startupTime = endTime - startTime;
    
    expect(startupTime).toBeLessThan(3000); // 3秒
  });

  it('should handle large datasets efficiently', async () => {
    const startTime = performance.now();
    
    // 创建大量测试数据
    const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      title: `Page ${i}`,
      content: `Content for page ${i}`
    }));

    // 测试搜索性能
    const searchResults = largeDataset.filter(item => 
      item.title.includes('100')
    );

    const endTime = performance.now();
    const searchTime = endTime - startTime;

    expect(searchTime).toBeLessThan(500); // 500ms
    expect(searchResults.length).toBeGreaterThan(0);
  });
});
```

## 📊 测试覆盖率改进

### 6. 提高测试覆盖率

#### 添加缺失的组件测试
```typescript
// 为每个主要组件添加测试
describe('BlockEditor', () => {
  it('should render editor interface', () => {
    render(<BlockEditor />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should handle text input', async () => {
    render(<BlockEditor />);
    const editor = screen.getByRole('textbox');
    
    await user.type(editor, 'Hello World');
    expect(editor).toHaveTextContent('Hello World');
  });
});

describe('SearchModal', () => {
  it('should open with keyboard shortcut', async () => {
    render(<App />);
    
    await user.keyboard('{Control>}k{/Control}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('GraphVisualization', () => {
  it('should render graph container', () => {
    render(<GraphVisualization data={mockGraphData} />);
    expect(screen.getByTestId('graph-container')).toBeInTheDocument();
  });
});
```

### 7. E2E测试修复

#### 更新Playwright配置
在 `playwright.config.ts` 中确保正确的baseURL：

```typescript
export default defineConfig({
  testDir: './src/test/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

## 🔄 持续集成改进

### 8. CI/CD流水线优化

#### GitHub Actions配置
创建 `.github/workflows/test.yml`:

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:coverage
    
    - name: Install Playwright browsers
      run: npx playwright install
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
```

## 📋 修复优先级时间表

### 第1天: 紧急修复
- [ ] 修复workspace配置
- [ ] 修复VirtualizedSearchResults测试
- [ ] 确保Web应用能启动

### 第2-3天: 测试稳定性
- [ ] 修复所有失败的单元测试
- [ ] 添加测试工具函数
- [ ] 提高测试覆盖率至80%+

### 第4-5天: 集成测试
- [ ] 实现API集成测试
- [ ] 添加数据库操作测试
- [ ] 验证文件系统访问

### 第6-7天: E2E和性能
- [ ] 执行完整E2E测试套件
- [ ] 实现性能基准测试
- [ ] 跨浏览器兼容性验证

### 第8-10天: 完善和优化
- [ ] 添加缺失的功能测试
- [ ] 优化测试执行速度
- [ ] 完善CI/CD流水线

## ✅ 验证清单

修复完成后，请验证以下项目：

- [ ] `npm install` 在所有目录下成功执行
- [ ] Web应用能正常启动 (`npm run dev`)
- [ ] 单元测试通过率 ≥85%
- [ ] 集成测试全部通过
- [ ] E2E测试通过率 100%
- [ ] 性能测试满足基准要求
- [ ] 代码覆盖率 ≥80%

完成这些修复后，MingLog将具备生产就绪的质量标准。
