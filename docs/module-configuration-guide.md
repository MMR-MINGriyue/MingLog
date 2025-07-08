# 模块配置系统使用指南

## 📋 概述

MingLog的模块配置系统提供了完整的设置管理功能，包括设置的定义、验证、存储和UI界面。本指南详细介绍如何使用这个系统。

## 🏗️ 系统架构

### 核心组件

1. **SettingsManager**: 设置管理器，负责设置的存储、验证和管理
2. **ModuleConfigModal**: 配置界面组件，提供用户友好的设置编辑界面
3. **设置模式**: 定义设置项的类型、验证规则和默认值

### 数据流

```
模块定义设置模式 → 注册到SettingsManager → UI界面展示 → 用户编辑 → 验证 → 保存到数据库
```

## 🔧 在模块中定义设置

### 1. 基本设置定义

在模块类中实现 `getSettings()` 方法：

```typescript
export class MyModule implements Module {
  getSettings(): SettingItem[] {
    return [
      {
        key: 'autoSave',
        label: '自动保存',
        type: 'boolean',
        defaultValue: true,
        description: '启用自动保存功能',
        category: '基本设置'
      },
      {
        key: 'saveInterval',
        label: '保存间隔（秒）',
        type: 'number',
        defaultValue: 30,
        description: '自动保存的时间间隔',
        category: '基本设置',
        validation: (value) => {
          if (value < 5) return '保存间隔不能少于5秒'
          if (value > 300) return '保存间隔不能超过300秒'
          return true
        }
      }
    ]
  }
}
```

### 2. 支持的设置类型

#### Boolean 类型
```typescript
{
  key: 'enableFeature',
  label: '启用功能',
  type: 'boolean',
  defaultValue: false,
  description: '是否启用此功能'
}
```

#### String 类型
```typescript
{
  key: 'apiUrl',
  label: 'API地址',
  type: 'string',
  defaultValue: 'https://api.example.com',
  description: '服务器API地址',
  validation: (value) => {
    if (!value.startsWith('https://')) {
      return '必须使用HTTPS协议'
    }
    return true
  }
}
```

#### Number 类型
```typescript
{
  key: 'maxItems',
  label: '最大项目数',
  type: 'number',
  defaultValue: 100,
  description: '允许的最大项目数量',
  validation: (value) => {
    if (value < 1 || value > 1000) {
      return '数量必须在1-1000之间'
    }
    return true
  }
}
```

#### Select 类型
```typescript
{
  key: 'theme',
  label: '主题',
  type: 'select',
  defaultValue: 'auto',
  options: [
    { label: '自动', value: 'auto' },
    { label: '浅色', value: 'light' },
    { label: '深色', value: 'dark' }
  ],
  description: '选择界面主题'
}
```

#### MultiSelect 类型
```typescript
{
  key: 'enabledFeatures',
  label: '启用的功能',
  type: 'multiselect',
  defaultValue: ['feature1', 'feature2'],
  options: [
    { label: '功能1', value: 'feature1' },
    { label: '功能2', value: 'feature2' },
    { label: '功能3', value: 'feature3' }
  ],
  description: '选择要启用的功能'
}
```

#### Color 类型
```typescript
{
  key: 'accentColor',
  label: '主题色',
  type: 'color',
  defaultValue: '#3B82F6',
  description: '界面主题色'
}
```

#### File 类型
```typescript
{
  key: 'configFile',
  label: '配置文件',
  type: 'file',
  defaultValue: '',
  description: '选择配置文件路径'
}
```

### 3. 设置分类

使用 `category` 属性对设置进行分组：

```typescript
[
  {
    key: 'autoSave',
    label: '自动保存',
    type: 'boolean',
    defaultValue: true,
    category: '编辑器'
  },
  {
    key: 'fontSize',
    label: '字体大小',
    type: 'number',
    defaultValue: 14,
    category: '外观'
  },
  {
    key: 'apiKey',
    label: 'API密钥',
    type: 'string',
    defaultValue: '',
    category: '高级'
  }
]
```

## 🎨 使用配置界面

### 1. 基本使用

```tsx
import { ModuleManagerPage, useModuleManager } from '@minglog/ui'
import { MingLogCore } from '@minglog/core'

function App() {
  const core = new MingLogCore(options)
  const moduleManager = useModuleManager({ core })

  return (
    <ModuleManagerPage
      modules={moduleManager.modules}
      moduleStatuses={moduleManager.moduleStatuses}
      moduleSettings={moduleManager.moduleSettings}
      moduleSchemas={moduleManager.moduleSchemas}
      onToggleModule={moduleManager.toggleModule}
      onUpdateModuleConfig={moduleManager.updateModuleConfig}
      onRefresh={moduleManager.refresh}
      loading={moduleManager.loading}
    />
  )
}
```

### 2. 直接使用配置模态框

```tsx
import { ModuleConfigModal } from '@minglog/ui'

function MyComponent() {
  const [showConfig, setShowConfig] = useState(false)
  
  const handleSave = async (settings: Record<string, any>) => {
    await core.getSettingsManager().setModuleSettings('my-module', settings)
    setShowConfig(false)
  }

  return (
    <>
      <button onClick={() => setShowConfig(true)}>
        配置模块
      </button>
      
      {showConfig && (
        <ModuleConfigModal
          moduleId="my-module"
          module={moduleConfig}
          settings={moduleSettings}
          currentValues={currentSettings}
          onSave={handleSave}
          onClose={() => setShowConfig(false)}
        />
      )}
    </>
  )
}
```

## 💾 设置管理API

### 1. 获取设置

```typescript
// 获取模块的所有设置
const settings = await core.getSettingsManager().getModuleSettings('my-module')

// 获取单个设置值
const autoSave = await core.getSettingsManager().getModuleSetting('my-module', 'autoSave')
```

### 2. 设置值

```typescript
// 设置多个值
await core.getSettingsManager().setModuleSettings('my-module', {
  autoSave: true,
  saveInterval: 60
})

// 设置单个值
await core.getSettingsManager().setModuleSetting('my-module', 'autoSave', false)
```

### 3. 重置设置

```typescript
// 重置为默认值
await core.getSettingsManager().resetModuleSettings('my-module')
```

### 4. 导入导出

```typescript
// 导出设置
const exportData = await core.getSettingsManager().exportModuleSettings('my-module')

// 导入设置
await core.getSettingsManager().importModuleSettings('my-module', exportData)
```

## ✅ 设置验证

### 1. 内置验证

系统会自动验证设置类型：

- `boolean`: 必须是布尔值
- `string`: 必须是字符串
- `number`: 必须是有效数字
- `select`: 值必须在选项列表中
- `multiselect`: 必须是数组，且所有值都在选项列表中
- `color`: 必须是有效的十六进制颜色值
- `file`: 必须是字符串路径

### 2. 自定义验证

```typescript
{
  key: 'email',
  label: '邮箱地址',
  type: 'string',
  defaultValue: '',
  validation: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return '请输入有效的邮箱地址'
    }
    return true
  }
}
```

### 3. 验证结果

```typescript
const validation = core.getSettingsManager().validateSettings(settings, schema)

if (!validation.valid) {
  console.log('验证错误:', validation.errors)
}

if (validation.warnings.length > 0) {
  console.log('验证警告:', validation.warnings)
}
```

## 🎯 最佳实践

### 1. 设置命名

- 使用驼峰命名法：`autoSave`, `maxRetries`
- 使用描述性名称：`enableNotifications` 而不是 `notify`
- 避免缩写：`maximumItems` 而不是 `maxItems`

### 2. 默认值

- 总是提供合理的默认值
- 默认值应该是最常用的选项
- 考虑新用户的体验

### 3. 描述文本

- 提供清晰的设置描述
- 说明设置的作用和影响
- 包含单位信息（如秒、像素等）

### 4. 分类组织

- 按功能相关性分组
- 使用直观的分类名称
- 避免过多的分类层级

### 5. 验证规则

- 提供有意义的错误消息
- 验证边界条件
- 考虑性能影响

## 🔧 高级功能

### 1. 动态设置

```typescript
// 根据其他设置动态调整选项
getSettings(): SettingItem[] {
  const baseSettings = [
    {
      key: 'mode',
      label: '模式',
      type: 'select',
      defaultValue: 'basic',
      options: [
        { label: '基础', value: 'basic' },
        { label: '高级', value: 'advanced' }
      ]
    }
  ]
  
  // 根据模式添加额外设置
  if (this.currentMode === 'advanced') {
    baseSettings.push({
      key: 'advancedOption',
      label: '高级选项',
      type: 'string',
      defaultValue: ''
    })
  }
  
  return baseSettings
}
```

### 2. 设置监听

```typescript
// 监听设置变化
core.getEventBus().on('settings:changed', (event) => {
  const { moduleId, settings, changedKeys } = event.data
  
  if (moduleId === 'my-module' && changedKeys.includes('theme')) {
    // 主题设置发生变化，更新界面
    this.updateTheme(settings.theme)
  }
})
```

### 3. 条件验证

```typescript
{
  key: 'maxConnections',
  label: '最大连接数',
  type: 'number',
  defaultValue: 10,
  validation: (value, allSettings) => {
    if (allSettings.enablePooling && value > 100) {
      return '启用连接池时，最大连接数不能超过100'
    }
    return true
  }
}
```

## 🐛 故障排除

### 常见问题

1. **设置不显示**: 检查模块是否正确实现了 `getSettings()` 方法
2. **验证失败**: 检查验证函数的返回值格式
3. **设置不保存**: 检查数据库权限和连接状态
4. **界面异常**: 检查设置类型和选项配置

### 调试技巧

```typescript
// 启用调试模式
const core = new MingLogCore({
  database: connection,
  debugMode: true
})

// 查看设置概览
const overview = await core.getSettingsManager().getSettingsOverview()
console.log('设置概览:', overview)

// 清除设置缓存
core.getSettingsManager().clearCache('my-module')
```

---

这个配置系统为MingLog提供了强大而灵活的设置管理能力，让用户可以根据自己的需求定制每个模块的行为。
