# MingLog 快捷键系统升级

## 📋 概述

基于对幕布、Logseq、Notion等优秀笔记软件的深入分析，我们为MingLog设计了全新的快捷键系统，旨在提供更流畅、更智能的笔记编辑体验。

## 🎯 设计目标

- **减少鼠标依赖**：通过完善的键盘快捷键实现全键盘操作流程
- **智能命令系统**：支持多种命令模式（/、@、[[、+）
- **流畅块操作**：类似Notion的块选择、导航、批量操作
- **学习成本低**：借鉴用户熟悉的快捷键设计模式

## 🚀 核心功能

### 1. 增强的命令系统

#### 斜杠命令 (/)
- **触发方式**：输入 `/`
- **功能**：快速创建各种块类型
- **特色**：
  - 智能搜索和分类
  - 支持拼音搜索（如输入"bt"匹配"标题"）
  - 显示使用频率和最近使用
  - 快捷键提示

```typescript
// 示例：创建标题
输入 "/" → 搜索 "标题" → 选择 "标题 1"
```

#### @命令系统
- **@人员**：提及团队成员
- **@页面**：快速链接到其他页面
- **@日期**：插入日期和提醒
- **@标签**：添加标签系统

#### [[双向链接命令
- **[[页面名]]**：创建双向链接
- 实时搜索和预览
- 支持创建新页面
- 显示反向链接

#### +快速创建命令
- **+子页面**：创建子页面
- **+模板**：应用预设模板
- **+数据库**：创建数据库视图

### 2. 全局命令面板

#### Ctrl+P / Ctrl+Shift+K
- **功能**：全局搜索和命令执行
- **特色**：
  - 搜索所有可用命令
  - 显示最近使用的命令
  - 智能建议和自动补全
  - 实时搜索结果

### 3. 块导航和选择

#### 块选择
- **Esc**：选择当前块
- **方向键**：在块之间导航
- **Shift+方向键**：多选块
- **Ctrl+A**：选择当前层级所有块

#### 块导航
- **Alt+↑/↓**：导航到上/下一个块
- **Ctrl+Home**：导航到第一个块
- **Ctrl+End**：导航到最后一个块

### 4. 块操作快捷键

#### 层级操作
- **Tab**：增加缩进
- **Shift+Tab**：减少缩进
- **Ctrl+Shift+↑**：向上移动块
- **Ctrl+Shift+↓**：向下移动块

#### 复制和编辑
- **Ctrl+D**：复制当前块
- **Ctrl+Shift+D**：复制当前块
- **Ctrl+Shift+X**：剪切块
- **Ctrl+Shift+V**：粘贴块
- **Ctrl+Shift+Delete**：删除块

## 🛠️ 技术实现

### 架构设计

```
CommandSystem (命令系统核心)
├── CommandTrigger (命令触发器)
├── CommandItem (命令项)
├── CommandSearchEngine (搜索引擎)
└── UsageTracker (使用统计)

BlockNavigation (块导航系统)
├── BlockSelection (块选择)
├── NavigationEngine (导航引擎)
└── OperationHandler (操作处理)

KeyboardShortcuts (快捷键管理)
├── ShortcutRegistry (快捷键注册)
├── EventHandler (事件处理)
└── ConflictResolver (冲突解决)
```

### 核心组件

#### 1. CommandSystem
```typescript
class CommandSystem {
  // 注册命令
  registerCommand(command: CommandItem): void
  
  // 搜索命令
  searchCommands(query: string, type?: CommandType): CommandSearchResult
  
  // 执行命令
  executeCommand(commandId: string, context: CommandContext): Promise<void>
}
```

#### 2. BlockNavigation
```typescript
class BlockNavigation {
  // 选择块
  selectBlock(path: Path, extend?: boolean): void
  
  // 导航到块
  navigateToBlock(direction: NavigationDirection): void
  
  // 执行块操作
  executeBlockOperation(operation: BlockOperation): void
}
```

#### 3. CommandPalette
```typescript
interface CommandPaletteProps {
  visible: boolean
  onClose: () => void
  commandSystem: CommandSystem
  editorContext?: CommandContext
}
```

## 📊 性能优化

### 搜索优化
- **防抖处理**：150ms防抖延迟，减少频繁搜索
- **智能缓存**：缓存搜索结果和使用统计
- **分页加载**：限制最大结果数量（默认20个）

### 内存管理
- **事件清理**：组件卸载时自动清理事件监听器
- **引用管理**：使用useRef避免不必要的重渲染
- **懒加载**：按需加载命令和组件

## 🎨 用户体验

### 渐进式学习
- **新手引导**：首次使用时显示快捷键提示
- **操作反馈**：实时显示命令执行状态
- **错误处理**：友好的错误提示和恢复建议

### 可访问性
- **键盘导航**：完整的键盘导航支持
- **屏幕阅读器**：兼容屏幕阅读器
- **高对比度**：支持高对比度模式

### 自定义设置
- **快捷键自定义**：允许用户自定义快捷键
- **命令优先级**：根据使用频率调整命令顺序
- **主题适配**：支持明暗主题切换

## 📈 使用统计

### 统计指标
- **命令使用频率**：记录每个命令的使用次数
- **最近使用记录**：保存最近使用的命令列表
- **搜索性能**：监控搜索响应时间
- **错误率统计**：跟踪命令执行错误率

### 数据分析
```typescript
interface UsageStats {
  totalCommands: number
  mostUsedCommands: string[]
  averageSearchTime: number
  errorRate: number
}
```

## 🔧 配置选项

### 命令系统配置
```typescript
interface CommandSystemConfig {
  enablePinyinSearch: boolean      // 启用拼音搜索
  enableFuzzySearch: boolean       // 启用模糊搜索
  maxResults: number               // 最大搜索结果数
  searchDebounce: number           // 搜索防抖延迟
  showShortcuts: boolean           // 显示快捷键提示
  trackUsage: boolean              // 记录使用统计
}
```

### 快捷键配置
```typescript
interface ShortcutConfig {
  key: string                      // 按键
  ctrl?: boolean                   // Ctrl键
  shift?: boolean                  // Shift键
  alt?: boolean                    // Alt键
  meta?: boolean                   // Meta键（Mac的Cmd）
  description: string              // 描述
  handler: () => void              // 处理函数
}
```

## 🚦 使用示例

### 基本使用
```typescript
import { BlockEditor } from '@minglog/editor';
import { EventBus } from '@minglog/core';

const MyEditor = () => {
  const eventBus = new EventBus();
  
  return (
    <BlockEditor
      eventBus={eventBus}
      enableKeyboardShortcuts={true}
      onSave={handleSave}
      onChange={handleChange}
    />
  );
};
```

### 自定义命令
```typescript
// 注册自定义命令
commandSystem.registerCommand({
  id: 'custom-command',
  title: '自定义命令',
  description: '这是一个自定义命令',
  group: '自定义',
  keywords: ['custom', '自定义'],
  handler: (context) => {
    console.log('执行自定义命令');
  }
});
```

## 🔮 未来规划

### 短期目标（1-2个月）
- [ ] 完善Slate.js集成
- [ ] 添加更多块类型支持
- [ ] 优化搜索算法
- [ ] 增加单元测试覆盖率

### 中期目标（3-6个月）
- [ ] 实现协作编辑支持
- [ ] 添加插件系统
- [ ] 支持自定义主题
- [ ] 移动端适配

### 长期目标（6个月以上）
- [ ] AI辅助命令建议
- [ ] 语音命令支持
- [ ] 手势操作集成
- [ ] 跨平台同步

## 📚 参考资料

- [Notion快捷键设计](https://www.notion.com/help/keyboard-shortcuts)
- [Logseq块编辑理念](https://docs.logseq.com/)
- [幕布层级操作](https://mubu.com/help)
- [Slate.js文档](https://docs.slatejs.org/)

---

*本文档将随着功能的完善持续更新。如有问题或建议，请提交Issue或PR。*
