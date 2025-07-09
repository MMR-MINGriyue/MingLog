# MingLog 插件开发指南

## 概述

MingLog 插件系统提供了强大的扩展能力，允许开发者创建自定义功能来增强知识管理体验。本指南将详细介绍如何开发、测试和发布 MingLog 插件。

## 快速开始

### 插件基本结构

一个 MingLog 插件包含以下核心文件：

```
my-plugin/
├── manifest.json          # 插件清单
├── index.js               # 主入口文件
├── package.json           # NPM 包配置
├── README.md              # 说明文档
└── assets/                # 资源文件
    ├── icon.png
    └── styles.css
```

### 最小插件示例

**manifest.json**
```json
{
  "id": "my-first-plugin",
  "name": "我的第一个插件",
  "version": "1.0.0",
  "description": "一个简单的示例插件",
  "author": "Your Name",
  "main": "index.js",
  "permissions": ["ui:menu", "storage:read", "storage:write"],
  "minglogVersion": ">=1.0.0"
}
```

**index.js**
```javascript
export default {
  manifest: {
    id: 'my-first-plugin',
    name: '我的第一个插件',
    version: '1.0.0',
    description: '一个简单的示例插件',
    author: 'Your Name',
    main: 'index.js',
    permissions: ['ui:menu', 'storage:read', 'storage:write']
  },

  activate: async function(context) {
    const { api, logger, storage } = context;
    
    logger.info('插件激活成功');
    
    // 添加菜单项
    api.ui.addMenuItem({
      id: 'my-plugin-action',
      label: '我的插件功能',
      icon: '🔌',
      action: () => {
        api.ui.showNotification('Hello from my plugin!', 'info');
      }
    });
    
    // 读取配置
    const config = await storage.get('config') || {};
    logger.info('插件配置:', config);
  },

  deactivate: async function() {
    console.log('插件已停用');
  }
};
```

## 插件清单 (Manifest)

### 必需字段

```json
{
  "id": "unique-plugin-id",           // 唯一标识符
  "name": "插件显示名称",              // 用户可见的名称
  "version": "1.0.0",                 // 语义化版本号
  "description": "插件功能描述",       // 简短描述
  "author": "作者名称",               // 作者信息
  "main": "index.js"                  // 入口文件
}
```

### 可选字段

```json
{
  "homepage": "https://example.com",           // 插件主页
  "repository": "https://github.com/...",     // 代码仓库
  "license": "MIT",                           // 许可证
  "keywords": ["tag1", "tag2"],               // 关键词
  "dependencies": ["other-plugin-id"],        // 依赖的其他插件
  "minglogVersion": ">=1.0.0",               // 支持的 MingLog 版本
  "permissions": [                            // 所需权限
    "ui:menu",
    "ui:panel",
    "storage:read",
    "storage:write",
    "links:read",
    "links:write",
    "search:read",
    "fs:read"
  ],
  "configSchema": {                           // 配置模式
    "type": "object",
    "properties": {
      "theme": {
        "type": "string",
        "default": "light",
        "enum": ["light", "dark"]
      }
    }
  }
}
```

## 插件生命周期

### activate 函数

插件激活时调用，接收插件上下文：

```javascript
activate: async function(context) {
  const { id, config, logger, events, api, storage } = context;
  
  // 初始化插件
  logger.info(`插件 ${id} 正在激活`);
  
  // 设置事件监听
  events.on('page-created', (page) => {
    logger.info('新页面创建:', page.title);
  });
  
  // 注册UI组件
  api.ui.addPanel({
    id: 'my-panel',
    title: '我的面板',
    component: MyPanelComponent,
    position: 'right'
  });
}
```

### deactivate 函数

插件停用时调用，用于清理资源：

```javascript
deactivate: async function() {
  // 清理事件监听器
  this.eventListeners.forEach(listener => {
    listener.remove();
  });
  
  // 清理UI组件
  // (系统会自动清理注册的UI组件)
  
  // 保存状态
  await this.saveState();
  
  console.log('插件已清理完成');
}
```

## 插件 API

### UI API

#### 添加菜单项

```javascript
api.ui.addMenuItem({
  id: 'my-menu-item',
  label: '菜单项',
  icon: '📝',
  action: () => {
    // 菜单项点击处理
  },
  submenu: [
    {
      id: 'submenu-1',
      label: '子菜单1',
      action: () => {}
    }
  ]
});
```

#### 添加面板

```javascript
api.ui.addPanel({
  id: 'my-panel',
  title: '自定义面板',
  icon: '🔧',
  component: MyReactComponent,
  position: 'left' // 'left', 'right', 'bottom'
});
```

#### 显示通知

```javascript
// 信息通知
api.ui.showNotification('操作成功', 'info');

// 警告通知
api.ui.showNotification('请注意', 'warning');

// 错误通知
api.ui.showNotification('操作失败', 'error');
```

#### 打开模态框

```javascript
api.ui.openModal({
  title: '确认操作',
  content: '确定要执行此操作吗？',
  buttons: [
    {
      text: '取消',
      action: () => {}
    },
    {
      text: '确定',
      primary: true,
      action: () => {
        // 确认操作
      }
    }
  ]
});
```

### 链接 API

#### 创建链接

```javascript
await api.links.create({
  type: 'page-reference',
  pageName: 'Target Page',
  alias: 'Link Text',
  position: 0,
  context: 'source-page'
});
```

#### 查询链接

```javascript
// 查找所有链接
const allLinks = await api.links.find({});

// 按条件查询
const pageLinks = await api.links.find({
  type: 'page-reference',
  context: 'specific-page'
});
```

#### 更新链接

```javascript
await api.links.update('link-id', {
  alias: 'New Link Text'
});
```

#### 删除链接

```javascript
await api.links.delete('link-id');
```

### 搜索 API

#### 索引文档

```javascript
await api.search.index([
  {
    id: 'doc-1',
    title: '文档标题',
    content: '文档内容',
    type: 'page',
    tags: ['标签1', '标签2']
  }
]);
```

#### 执行搜索

```javascript
const results = await api.search.query('搜索词', {
  limit: 10,
  highlight: true,
  filters: {
    tags: ['重要']
  }
});
```

### 文件系统 API

#### 读取文件

```javascript
const content = await api.fs.read('/path/to/file.txt');
```

#### 写入文件

```javascript
await api.fs.write('/path/to/file.txt', 'File content');
```

#### 检查文件存在

```javascript
const exists = await api.fs.exists('/path/to/file.txt');
```

#### 列出目录

```javascript
const files = await api.fs.list('/path/to/directory');
```

### 存储 API

#### 保存数据

```javascript
await storage.set('my-key', { data: 'value' });
```

#### 读取数据

```javascript
const data = await storage.get('my-key');
```

#### 删除数据

```javascript
await storage.delete('my-key');
```

#### 清空存储

```javascript
await storage.clear();
```

## 事件系统

### 监听事件

```javascript
// 页面事件
events.on('page-created', (page) => {
  logger.info('新页面:', page.title);
});

events.on('page-updated', (page) => {
  logger.info('页面更新:', page.title);
});

events.on('page-deleted', (pageId) => {
  logger.info('页面删除:', pageId);
});

// 链接事件
events.on('link-created', (link) => {
  logger.info('新链接:', link);
});

// 搜索事件
events.on('search-performed', (query, results) => {
  logger.info('搜索:', query, '结果数:', results.length);
});
```

### 发送事件

```javascript
// 发送自定义事件
events.emit('my-custom-event', { data: 'value' });

// 其他插件可以监听
events.on('my-custom-event', (data) => {
  console.log('收到自定义事件:', data);
});
```

## 配置管理

### 定义配置模式

```json
{
  "configSchema": {
    "type": "object",
    "properties": {
      "theme": {
        "type": "string",
        "title": "主题",
        "description": "选择插件主题",
        "default": "light",
        "enum": ["light", "dark", "auto"]
      },
      "autoSave": {
        "type": "boolean",
        "title": "自动保存",
        "description": "是否启用自动保存功能",
        "default": true
      },
      "saveInterval": {
        "type": "number",
        "title": "保存间隔",
        "description": "自动保存间隔（秒）",
        "default": 30,
        "minimum": 10,
        "maximum": 300
      }
    }
  }
}
```

### 使用配置

```javascript
activate: async function(context) {
  const { config } = context;
  
  // 读取配置
  const theme = config.theme || 'light';
  const autoSave = config.autoSave !== false;
  const saveInterval = config.saveInterval || 30;
  
  // 应用配置
  this.applyTheme(theme);
  
  if (autoSave) {
    this.startAutoSave(saveInterval * 1000);
  }
}
```

## React 组件开发

### 基本组件

```jsx
import React, { useState, useEffect } from 'react';

function MyPluginComponent({ context }) {
  const [data, setData] = useState(null);
  const { api, storage, logger } = context;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedData = await storage.get('plugin-data');
      setData(savedData || { items: [] });
    } catch (error) {
      logger.error('加载数据失败:', error);
    }
  };

  const saveData = async (newData) => {
    try {
      await storage.set('plugin-data', newData);
      setData(newData);
      api.ui.showNotification('数据已保存', 'info');
    } catch (error) {
      logger.error('保存数据失败:', error);
      api.ui.showNotification('保存失败', 'error');
    }
  };

  return (
    <div className="my-plugin-component">
      <h3>我的插件</h3>
      {data && (
        <div>
          <p>项目数量: {data.items.length}</p>
          <button onClick={() => saveData({ items: [...data.items, Date.now()] })}>
            添加项目
          </button>
        </div>
      )}
    </div>
  );
}

export default MyPluginComponent;
```

### 使用 MingLog UI 组件

```jsx
import { Button, Input, Modal, Notification } from '@minglog/ui';

function AdvancedComponent({ context }) {
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState('');

  return (
    <div>
      <Input
        value={inputValue}
        onChange={setInputValue}
        placeholder="输入内容..."
      />
      
      <Button
        onClick={() => setShowModal(true)}
        variant="primary"
      >
        打开模态框
      </Button>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="插件模态框"
      >
        <p>这是插件的模态框内容</p>
      </Modal>
    </div>
  );
}
```

## 插件测试

### 单元测试

```javascript
// tests/plugin.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import MyPlugin from '../index.js';

describe('MyPlugin', () => {
  let plugin;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      id: 'test-plugin',
      config: {},
      logger: {
        info: vi.fn(),
        error: vi.fn()
      },
      api: {
        ui: {
          addMenuItem: vi.fn(),
          showNotification: vi.fn()
        }
      },
      storage: {
        get: vi.fn(),
        set: vi.fn()
      },
      events: {
        on: vi.fn(),
        emit: vi.fn()
      }
    };

    plugin = MyPlugin;
  });

  it('should activate successfully', async () => {
    await plugin.activate(mockContext);
    
    expect(mockContext.logger.info).toHaveBeenCalledWith('插件激活成功');
    expect(mockContext.api.ui.addMenuItem).toHaveBeenCalled();
  });

  it('should handle configuration', async () => {
    mockContext.config = { theme: 'dark' };
    
    await plugin.activate(mockContext);
    
    // 验证配置被正确处理
  });
});
```

### 集成测试

```javascript
// tests/integration.test.js
import { describe, it, expect } from 'vitest';
import { PluginSystem } from '@minglog/core';
import MyPlugin from '../index.js';

describe('Plugin Integration', () => {
  it('should integrate with plugin system', async () => {
    const pluginSystem = new PluginSystem(mockAPI);
    
    await pluginSystem.registerPlugin(MyPlugin);
    await pluginSystem.activatePlugin('my-first-plugin');
    
    expect(pluginSystem.isPluginActive('my-first-plugin')).toBe(true);
  });
});
```

## 插件发布

### 准备发布

1. **更新版本号**
```bash
npm version patch  # 或 minor, major
```

2. **构建插件**
```bash
npm run build
```

3. **测试插件**
```bash
npm test
```

### 发布到 NPM

```bash
npm publish
```

### 发布到 MingLog 插件市场

```bash
minglog-cli publish
```

## 最佳实践

### 1. 代码组织

```
src/
├── components/          # React 组件
├── services/           # 业务逻辑
├── utils/              # 工具函数
├── styles/             # 样式文件
├── types/              # TypeScript 类型
└── index.js            # 入口文件
```

### 2. 错误处理

```javascript
activate: async function(context) {
  try {
    // 插件初始化逻辑
    await this.initialize(context);
  } catch (error) {
    context.logger.error('插件激活失败:', error);
    context.api.ui.showNotification('插件加载失败', 'error');
    throw error;
  }
}
```

### 3. 性能优化

```javascript
// 懒加载组件
const LazyComponent = React.lazy(() => import('./HeavyComponent'));

// 防抖处理
const debouncedSave = debounce(async (data) => {
  await storage.set('data', data);
}, 1000);

// 缓存计算结果
const memoizedCalculation = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);
```

### 4. 国际化支持

```javascript
// i18n/zh-CN.json
{
  "menu.myAction": "我的操作",
  "notification.success": "操作成功",
  "error.loadFailed": "加载失败"
}

// 使用翻译
const t = context.i18n.t;
api.ui.showNotification(t('notification.success'), 'info');
```

## 调试技巧

### 1. 开发模式

```javascript
// 检查是否为开发模式
if (context.isDevelopment) {
  // 启用详细日志
  logger.setLevel('debug');
  
  // 添加调试工具
  window.myPluginDebug = {
    context,
    api,
    storage
  };
}
```

### 2. 日志记录

```javascript
// 结构化日志
logger.info('用户操作', {
  action: 'create-link',
  userId: user.id,
  timestamp: Date.now()
});

// 性能监控
const start = performance.now();
await heavyOperation();
const duration = performance.now() - start;
logger.debug('操作耗时', { duration });
```

### 3. 错误监控

```javascript
// 全局错误处理
window.addEventListener('error', (event) => {
  logger.error('未捕获的错误:', event.error);
});

// Promise 错误处理
window.addEventListener('unhandledrejection', (event) => {
  logger.error('未处理的 Promise 拒绝:', event.reason);
});
```

## 示例插件

### 主题切换插件

完整的主题切换插件示例，展示了配置管理、UI 集成和状态持久化：

```javascript
export default {
  manifest: {
    id: 'theme-switcher',
    name: '主题切换器',
    version: '1.0.0',
    description: '快速切换应用主题',
    author: 'MingLog Team',
    permissions: ['ui:menu', 'storage:read', 'storage:write']
  },

  activate: async function(context) {
    const { api, storage, logger } = context;
    
    // 加载当前主题
    const currentTheme = await storage.get('theme') || 'light';
    
    // 应用主题
    this.applyTheme(currentTheme);
    
    // 添加主题切换菜单
    api.ui.addMenuItem({
      id: 'theme-switcher',
      label: '切换主题',
      icon: '🎨',
      submenu: [
        {
          id: 'light-theme',
          label: '浅色主题',
          action: () => this.switchTheme('light')
        },
        {
          id: 'dark-theme',
          label: '深色主题',
          action: () => this.switchTheme('dark')
        },
        {
          id: 'auto-theme',
          label: '跟随系统',
          action: () => this.switchTheme('auto')
        }
      ]
    });
    
    logger.info('主题切换插件已激活');
  },

  switchTheme: async function(theme) {
    const { api, storage } = this.context;
    
    await storage.set('theme', theme);
    this.applyTheme(theme);
    
    api.ui.showNotification(`已切换到${theme}主题`, 'info');
  },

  applyTheme: function(theme) {
    document.body.className = document.body.className
      .replace(/theme-\w+/g, '')
      .trim();
    document.body.classList.add(`theme-${theme}`);
  }
};
```

这个完整的插件开发指南涵盖了从基础概念到高级技巧的所有内容，帮助开发者创建功能丰富、性能优良的 MingLog 插件。
