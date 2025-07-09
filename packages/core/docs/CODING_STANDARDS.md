# MingLog 编码标准

## 概述

本文档定义了 MingLog 项目的编码标准和最佳实践，确保代码质量、可维护性和团队协作效率。

## 目录

- [TypeScript 标准](#typescript-标准)
- [React 组件标准](#react-组件标准)
- [文件和目录结构](#文件和目录结构)
- [命名约定](#命名约定)
- [代码格式化](#代码格式化)
- [注释和文档](#注释和文档)
- [测试标准](#测试标准)
- [性能最佳实践](#性能最佳实践)
- [错误处理](#错误处理)
- [Git 提交规范](#git-提交规范)

## TypeScript 标准

### 类型定义

```typescript
// ✅ 推荐：使用 interface 定义对象类型
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// ✅ 推荐：使用 type 定义联合类型和复杂类型
type Status = 'pending' | 'approved' | 'rejected';
type EventHandler<T> = (event: T) => void;

// ❌ 避免：使用 any 类型
const data: any = fetchData(); // 不推荐

// ✅ 推荐：使用具体类型或泛型
const data: User[] = fetchData<User[]>();
```

### 函数定义

```typescript
// ✅ 推荐：明确的参数和返回类型
function createUser(userData: CreateUserData): Promise<User> {
  return userService.create(userData);
}

// ✅ 推荐：使用箭头函数处理简单逻辑
const formatDate = (date: Date): string => date.toISOString();

// ✅ 推荐：使用可选参数和默认值
function searchUsers(
  query: string,
  options: SearchOptions = {}
): Promise<User[]> {
  // 实现
}
```

### 泛型使用

```typescript
// ✅ 推荐：有意义的泛型约束
interface Repository<T extends { id: string }> {
  findById(id: string): Promise<T | null>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
}

// ✅ 推荐：泛型默认值
interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  message: string;
}
```

## React 组件标准

### 组件定义

```typescript
// ✅ 推荐：函数组件 + TypeScript
interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  className?: string;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  className = ''
}) => {
  const handleEdit = useCallback(() => {
    onEdit?.(user);
  }, [user, onEdit]);

  return (
    <div className={`user-card ${className}`}>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      {onEdit && (
        <button onClick={handleEdit}>编辑</button>
      )}
    </div>
  );
};
```

### Hooks 使用

```typescript
// ✅ 推荐：自定义 Hook
function useUserData(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await userService.getById(userId);
        
        if (!cancelled) {
          setUser(userData);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { user, loading, error };
}
```

### 状态管理

```typescript
// ✅ 推荐：使用 useReducer 管理复杂状态
interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
}

type AppAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'TOGGLE_THEME' }
  | { type: 'TOGGLE_SIDEBAR' };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'TOGGLE_THEME':
      return { 
        ...state, 
        theme: state.theme === 'light' ? 'dark' : 'light' 
      };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    default:
      return state;
  }
}
```

## 文件和目录结构

```
src/
├── components/           # React 组件
│   ├── common/          # 通用组件
│   ├── layout/          # 布局组件
│   └── features/        # 功能特定组件
├── hooks/               # 自定义 Hooks
├── services/            # 业务逻辑服务
├── utils/               # 工具函数
├── types/               # TypeScript 类型定义
├── constants/           # 常量定义
├── styles/              # 样式文件
└── test/                # 测试文件
    ├── unit/           # 单元测试
    ├── integration/    # 集成测试
    └── e2e/            # 端到端测试
```

### 文件命名

```
// ✅ 推荐的文件命名
UserCard.tsx              # React 组件 (PascalCase)
userService.ts            # 服务类 (camelCase)
api-client.ts             # 工具模块 (kebab-case)
USER_ROLES.ts             # 常量 (UPPER_SNAKE_CASE)
UserCard.test.tsx         # 测试文件
UserCard.stories.tsx      # Storybook 文件
```

## 命名约定

### 变量和函数

```typescript
// ✅ 推荐：描述性命名
const userAccountBalance = 1000;
const isUserLoggedIn = true;
const getUserById = (id: string) => { /* ... */ };

// ❌ 避免：缩写和不清晰的命名
const bal = 1000;
const flag = true;
const get = (id: string) => { /* ... */ };
```

### 常量

```typescript
// ✅ 推荐：大写下划线分隔
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.minglog.com';
const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest'
} as const;
```

### 类和接口

```typescript
// ✅ 推荐：PascalCase
class UserService {
  // 实现
}

interface UserRepository {
  // 定义
}

type UserStatus = 'active' | 'inactive';
```

## 代码格式化

### Prettier 配置

项目使用 Prettier 进行代码格式化，配置如下：

```javascript
// .prettierrc.js
module.exports = {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  trailingComma: 'none',
  bracketSpacing: true,
  arrowParens: 'avoid'
};
```

### ESLint 规则

关键的 ESLint 规则：

- `@typescript-eslint/no-unused-vars`: 禁止未使用的变量
- `@typescript-eslint/explicit-function-return-type`: 要求明确的函数返回类型
- `react-hooks/exhaustive-deps`: 检查 Hook 依赖
- `jsx-a11y/*`: 无障碍访问规则

## 注释和文档

### JSDoc 注释

```typescript
/**
 * 创建新用户
 * @param userData - 用户数据
 * @param options - 创建选项
 * @returns Promise 包含创建的用户
 * @throws {ValidationError} 当用户数据无效时
 * @example
 * ```typescript
 * const user = await createUser({
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * });
 * ```
 */
async function createUser(
  userData: CreateUserData,
  options: CreateUserOptions = {}
): Promise<User> {
  // 实现
}
```

### 代码注释

```typescript
// ✅ 推荐：解释为什么，而不是做什么
// 使用防抖避免频繁的 API 调用
const debouncedSearch = useMemo(
  () => debounce(searchUsers, 300),
  []
);

// ✅ 推荐：复杂逻辑的解释
// 计算用户权限：管理员可以访问所有功能，
// 普通用户只能访问自己的数据
const userPermissions = useMemo(() => {
  if (user.role === 'admin') {
    return ALL_PERMISSIONS;
  }
  return getUserPermissions(user.id);
}, [user]);
```

## 测试标准

### 单元测试

```typescript
// UserService.test.ts
describe('UserService', () => {
  let userService: UserService;
  let mockRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    userService = new UserService(mockRepository);
  });

  describe('createUser', () => {
    it('应该创建新用户并返回用户数据', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
      };
      const expectedUser = { id: '1', ...userData };
      mockRepository.create.mockResolvedValue(expectedUser);

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockRepository.create).toHaveBeenCalledWith(userData);
    });

    it('应该在邮箱已存在时抛出错误', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'existing@example.com'
      };
      mockRepository.create.mockRejectedValue(
        new Error('Email already exists')
      );

      // Act & Assert
      await expect(userService.createUser(userData))
        .rejects.toThrow('Email already exists');
    });
  });
});
```

### 组件测试

```typescript
// UserCard.test.tsx
describe('UserCard', () => {
  const mockUser: User = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date()
  };

  it('应该显示用户信息', () => {
    render(<UserCard user={mockUser} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('应该在点击编辑按钮时调用 onEdit', async () => {
    const mockOnEdit = jest.fn();
    render(<UserCard user={mockUser} onEdit={mockOnEdit} />);
    
    const editButton = screen.getByRole('button', { name: /编辑/i });
    await user.click(editButton);
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockUser);
  });
});
```

## 性能最佳实践

### React 性能优化

```typescript
// ✅ 推荐：使用 memo 优化组件
export const UserCard = React.memo<UserCardProps>(({ user, onEdit }) => {
  // 组件实现
});

// ✅ 推荐：使用 useMemo 缓存计算结果
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// ✅ 推荐：使用 useCallback 缓存函数
const handleClick = useCallback((id: string) => {
  onItemClick(id);
}, [onItemClick]);
```

### 代码分割

```typescript
// ✅ 推荐：懒加载组件
const LazyUserProfile = React.lazy(() => import('./UserProfile'));

// ✅ 推荐：使用 Suspense
<Suspense fallback={<LoadingSpinner />}>
  <LazyUserProfile userId={userId} />
</Suspense>
```

## 错误处理

### 错误边界

```typescript
// ✅ 推荐：使用错误边界
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // 发送错误报告
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
```

### 异步错误处理

```typescript
// ✅ 推荐：统一的错误处理
async function fetchUserData(userId: string): Promise<User> {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw new UserNotFoundError(`User ${userId} not found`);
    }
    throw new UnexpectedError('Failed to fetch user data');
  }
}
```

## Git 提交规范

### 提交消息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型说明

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式化
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 示例

```
feat(search): 添加高级搜索功能

- 支持多字段搜索
- 添加搜索历史
- 优化搜索性能

Closes #123
```

## 代码审查清单

在提交代码前，请确保：

- [ ] 代码通过所有测试
- [ ] 代码符合 ESLint 规范
- [ ] 代码已格式化（Prettier）
- [ ] TypeScript 类型检查通过
- [ ] 添加了必要的测试
- [ ] 更新了相关文档
- [ ] 提交消息符合规范
- [ ] 没有调试代码（console.log 等）
- [ ] 性能影响已考虑
- [ ] 无障碍访问已考虑

## 工具和脚本

### 质量检查

```bash
# 运行完整的质量检查
npm run quality-check

# 单独运行各项检查
npm run lint
npm run format:check
npm run type-check
npm run test:coverage
```

### Git Hooks

项目配置了以下 Git hooks：

- `pre-commit`: 运行 lint、格式检查和类型检查
- `pre-push`: 运行完整的质量检查

## 持续改进

编码标准是一个持续改进的过程。如果你有建议或发现问题，请：

1. 创建 Issue 讨论
2. 提交 Pull Request
3. 在团队会议中提出

让我们一起维护高质量的代码库！
