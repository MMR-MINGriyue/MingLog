# 高级搜索语法参考

## 概述

MingLog 的高级搜索功能提供了强大而灵活的查询语法，让您能够精确地找到所需的信息。本指南详细介绍了所有支持的搜索语法和使用技巧。

## 基本搜索

### 简单词汇搜索

最基本的搜索方式，直接输入要查找的词汇：

```
机器学习
```

**匹配规则：**
- 不区分大小写
- 支持中文、英文和数字
- 自动处理词汇变形

### 多词汇搜索

输入多个词汇，默认使用 OR 逻辑：

```
机器学习 深度学习
```

等同于：
```
机器学习 OR 深度学习
```

## 精确匹配

### 短语搜索

使用双引号进行精确短语匹配：

```
"机器学习算法"
```

**特点：**
- 必须完全匹配引号内的内容
- 保持词汇顺序
- 区分标点符号

### 示例

```
"深度学习" → 匹配包含"深度学习"的内容
"machine learning" → 匹配包含"machine learning"的内容
"人工智能的发展" → 匹配完整短语
```

## 逻辑操作符

### AND 操作符

要求所有词汇都必须出现：

```
机器学习 AND 神经网络
机器学习 && 神经网络
```

**示例：**
```
Python AND 数据分析 → 同时包含"Python"和"数据分析"
"深度学习" AND TensorFlow → 包含"深度学习"短语和"TensorFlow"
```

### OR 操作符

任一词汇出现即可匹配：

```
机器学习 OR 深度学习
机器学习 || 深度学习
```

**示例：**
```
Python OR R → 包含"Python"或"R"
"机器学习" OR "人工智能" → 包含任一短语
```

### NOT 操作符

排除包含指定词汇的结果：

```
机器学习 NOT 深度学习
机器学习 -深度学习
```

**示例：**
```
编程 NOT Python → 包含"编程"但不包含"Python"
数据科学 -R → 包含"数据科学"但不包含"R"
```

### 操作符优先级

1. `NOT` (最高)
2. `AND`
3. `OR` (最低)

使用括号改变优先级：
```
(机器学习 OR 深度学习) AND Python
```

## 字段搜索

### 标题搜索

在文档标题中搜索：

```
title:机器学习
title:"深度学习基础"
```

**示例：**
```
title:Python → 标题包含"Python"的文档
title:"数据结构与算法" → 标题为"数据结构与算法"的文档
```

### 内容搜索

在文档内容中搜索：

```
content:神经网络
content:"卷积神经网络"
```

### 标签搜索

在文档标签中搜索：

```
tag:重要
tag:机器学习
```

**示例：**
```
tag:Python → 标记为"Python"的文档
tag:重要 AND tag:基础 → 同时标记为"重要"和"基础"的文档
```

### 类型搜索

按文档类型搜索：

```
type:page → 页面类型文档
type:block → 块类型文档
```

### 作者搜索

按作者搜索：

```
author:张三
author:"李四"
```

### 组合字段搜索

```
title:Python AND content:数据分析 AND tag:教程
```

## 通配符和模糊搜索

### 通配符

使用 `*` 进行通配符搜索：

```
机器* → 匹配"机器学习"、"机器人"等
*学习 → 匹配"机器学习"、"深度学习"等
*学* → 匹配包含"学"的词汇
```

**注意：**
- `*` 不能作为搜索词的开头（性能考虑）
- 最少需要2个字符 + 通配符

### 模糊搜索

使用 `~` 进行模糊搜索：

```
机器学习~ → 匹配相似的词汇
Python~2 → 允许2个字符的差异
```

**模糊度级别：**
- `~` 或 `~1`: 允许1个字符差异
- `~2`: 允许2个字符差异
- `~3`: 允许3个字符差异

## 范围搜索

### 数值范围

```
size:[100 TO 500] → 大小在100到500之间
rating:{3 TO 5} → 评分在3到5之间（不包含边界）
```

**语法说明：**
- `[a TO b]`: 包含边界值
- `{a TO b}`: 不包含边界值
- `[a TO *]`: 大于等于a
- `[* TO b]`: 小于等于b

### 日期范围

```
created:[2024-01-01 TO 2024-12-31]
updated:{2024-06-01 TO *}
```

**日期格式：**
- `YYYY-MM-DD`: 标准日期格式
- `YYYY-MM-DD HH:mm:ss`: 包含时间
- `now`: 当前时间
- `now-1d`: 一天前
- `now+1w`: 一周后

**时间单位：**
- `s`: 秒
- `m`: 分钟
- `h`: 小时
- `d`: 天
- `w`: 周
- `M`: 月
- `y`: 年

## 高级语法

### 权重提升

使用 `^` 提升某个词汇的权重：

```
机器学习^2 深度学习 → "机器学习"权重是"深度学习"的2倍
title:Python^3 content:编程 → 标题中的"Python"权重更高
```

### 邻近搜索

使用 `~` 指定词汇间的距离：

```
"机器 学习"~5 → "机器"和"学习"之间最多5个词
"Python 数据分析"~10 → 词汇间距离不超过10
```

### 正则表达式

使用 `/` 包围正则表达式：

```
/机器.*学习/ → 匹配"机器"开头、"学习"结尾的内容
/\d{4}-\d{2}-\d{2}/ → 匹配日期格式
```

**支持的正则语法：**
- `.`: 任意字符
- `*`: 零个或多个
- `+`: 一个或多个
- `?`: 零个或一个
- `[]`: 字符类
- `()`: 分组
- `|`: 或操作

## 搜索过滤器

### 使用过滤器API

```typescript
const searchOptions = {
  filters: {
    // 文件类型过滤
    fileTypes: ['page', 'block'],
    
    // 标签过滤
    tags: ['重要', '基础'],
    
    // 日期范围过滤
    dateRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-12-31')
    },
    
    // 大小过滤
    sizeRange: {
      min: 100,
      max: 10000
    },
    
    // 作者过滤
    authors: ['张三', '李四']
  }
};

const results = searchEngine.search('机器学习', searchOptions);
```

### 组合过滤器和查询

```typescript
// 在特定标签的页面中搜索
const results = searchEngine.search('Python', {
  filters: {
    fileTypes: ['page'],
    tags: ['编程', '教程']
  }
});

// 在最近一个月的文档中搜索
const results = searchEngine.search('数据分析', {
  filters: {
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    }
  }
});
```

## 搜索结果排序

### 相关性排序（默认）

```typescript
const results = searchEngine.search('机器学习', {
  sortBy: 'score',
  sortOrder: 'desc'
});
```

### 时间排序

```typescript
// 按创建时间排序
const results = searchEngine.search('Python', {
  sortBy: 'createdAt',
  sortOrder: 'desc'
});

// 按更新时间排序
const results = searchEngine.search('数据分析', {
  sortBy: 'updatedAt',
  sortOrder: 'desc'
});
```

### 自定义排序

```typescript
const results = searchEngine.search('机器学习', {
  sortBy: 'custom',
  sortFunction: (a, b) => {
    // 自定义排序逻辑
    return b.score * b.document.tags.length - a.score * a.document.tags.length;
  }
});
```

## 搜索建议和自动补全

### 获取搜索建议

```typescript
const suggestions = searchEngine.getSuggestions('机器');
// 返回: ['机器学习', '机器人', '机器视觉']
```

### 查询历史

```typescript
const history = searchEngine.getSearchHistory();
// 返回最近的搜索查询
```

### 热门搜索

```typescript
const popular = searchEngine.getPopularQueries();
// 返回热门搜索词
```

## 实用搜索示例

### 查找特定主题的所有相关内容

```
(机器学习 OR "machine learning" OR ML) AND (Python OR TensorFlow OR PyTorch)
```

### 查找最近更新的重要文档

```
tag:重要 AND updated:[now-7d TO *]
```

### 查找包含代码示例的教程

```
title:教程 AND content:代码 AND (content:Python OR content:JavaScript)
```

### 查找特定作者的技术文章

```
author:张三 AND (tag:技术 OR tag:编程) AND type:page
```

### 排除草稿和临时文件

```
机器学习 NOT tag:草稿 NOT title:临时*
```

## 性能优化建议

### 1. 查询优化

- **使用具体词汇**: 避免过于宽泛的搜索词
- **合理使用通配符**: 通配符会影响性能
- **限制结果数量**: 使用 `limit` 参数

```typescript
const results = searchEngine.search('机器学习', {
  limit: 20,
  offset: 0
});
```

### 2. 索引优化

- **定期清理**: 删除无用的文档
- **批量更新**: 避免频繁的单个文档更新
- **合理分片**: 大型数据集考虑分片

### 3. 缓存策略

```typescript
// 缓存常用查询
const cache = new Map();

function cachedSearch(query, options) {
  const key = JSON.stringify({ query, options });
  
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const results = searchEngine.search(query, options);
  cache.set(key, results);
  
  return results;
}
```

## 故障排除

### 常见问题

**Q: 搜索结果不准确**
A: 检查查询语法，使用精确匹配或字段搜索

**Q: 搜索速度慢**
A: 优化查询，避免复杂的正则表达式和通配符

**Q: 找不到预期结果**
A: 检查过滤器设置，尝试更宽泛的查询

### 调试技巧

```typescript
// 启用搜索调试
const results = searchEngine.search('机器学习', {
  debug: true,
  explain: true
});

console.log('查询解析:', results.queryParsed);
console.log('执行时间:', results.executionTime);
console.log('匹配统计:', results.matchStats);
```

## 最佳实践

### 1. 查询构建

- **从简单开始**: 先用基本查询，再逐步添加条件
- **使用括号**: 明确操作符优先级
- **测试查询**: 验证查询结果是否符合预期

### 2. 用户体验

- **提供建议**: 实时显示搜索建议
- **保存历史**: 记录用户搜索历史
- **错误提示**: 友好的错误信息和建议

### 3. 性能考虑

- **分页加载**: 大量结果分页显示
- **异步搜索**: 避免阻塞用户界面
- **缓存结果**: 缓存常用查询结果

```typescript
// 完整的搜索组件示例
function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (searchQuery) => {
    setLoading(true);
    try {
      const searchResults = await searchEngine.search(searchQuery, {
        highlight: true,
        limit: 20
      });
      setResults(searchResults);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value) => {
    setQuery(value);
    if (value.length > 2) {
      const newSuggestions = searchEngine.getSuggestions(value);
      setSuggestions(newSuggestions);
    }
  };

  return (
    <div className="search-component">
      <SearchInput
        value={query}
        onChange={handleInputChange}
        onSearch={handleSearch}
        suggestions={suggestions}
        placeholder="输入搜索查询..."
      />
      
      {loading && <LoadingSpinner />}
      
      <SearchResults
        results={results}
        query={query}
        onResultClick={handleResultClick}
      />
    </div>
  );
}
```
