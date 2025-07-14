/**
 * 字段类型定义
 */

/**
 * 字段类型枚举
 */
export enum FieldType {
  // 基础类型
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  DATETIME = 'datetime',
  TIME = 'time',
  CHECKBOX = 'checkbox',
  
  // 选择类型
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  
  // 联系信息
  URL = 'url',
  EMAIL = 'email',
  PHONE = 'phone',
  
  // 富文本
  RICH_TEXT = 'rich_text',
  
  // 文件
  FILE = 'file',
  IMAGE = 'image',
  
  // 关联
  RELATION = 'relation',
  ROLLUP = 'rollup',
  
  // 公式
  FORMULA = 'formula',
  
  // 系统字段
  CREATED_TIME = 'created_time',
  LAST_EDITED_TIME = 'last_edited_time',
  CREATED_BY = 'created_by',
  LAST_EDITED_BY = 'last_edited_by',
  
  // 高级类型
  JSON = 'json',
  ARRAY = 'array',
  LOCATION = 'location',
  RATING = 'rating',
  PROGRESS = 'progress',
  CURRENCY = 'currency'
}

/**
 * 字段接口
 */
export interface Field {
  /** 字段唯一标识 */
  id: string
  /** 字段名称 */
  name: string
  /** 字段类型 */
  type: FieldType
  /** 字段配置 */
  config: FieldConfig
  /** 是否必填 */
  required: boolean
  /** 是否唯一 */
  unique: boolean
  /** 是否建立索引 */
  indexed: boolean
  /** 是否隐藏 */
  hidden: boolean
  /** 字段描述 */
  description?: string
  /** 默认值 */
  defaultValue?: FieldValue
  /** 验证规则 */
  validation?: FieldValidation
  /** 显示配置 */
  display: FieldDisplay
  /** 创建时间 */
  createdAt: Date
  /** 更新时间 */
  updatedAt: Date
}

/**
 * 字段配置（根据类型不同而不同）
 */
export type FieldConfig = 
  | TextFieldConfig
  | NumberFieldConfig
  | DateFieldConfig
  | SelectFieldConfig
  | RelationFieldConfig
  | FormulaFieldConfig
  | FileFieldConfig
  | RichTextFieldConfig
  | LocationFieldConfig
  | CurrencyFieldConfig
  | RatingFieldConfig
  | ProgressFieldConfig

/**
 * 文本字段配置
 */
export interface TextFieldConfig {
  /** 最大长度 */
  maxLength?: number
  /** 最小长度 */
  minLength?: number
  /** 是否多行 */
  multiline?: boolean
  /** 占位符 */
  placeholder?: string
  /** 格式化模式 */
  format?: 'plain' | 'markdown' | 'html'
}

/**
 * 数字字段配置
 */
export interface NumberFieldConfig {
  /** 最小值 */
  min?: number
  /** 最大值 */
  max?: number
  /** 小数位数 */
  precision?: number
  /** 数字格式 */
  format?: 'integer' | 'decimal' | 'percentage' | 'scientific'
  /** 单位 */
  unit?: string
  /** 千分位分隔符 */
  thousandsSeparator?: boolean
}

/**
 * 日期字段配置
 */
export interface DateFieldConfig {
  /** 日期格式 */
  format?: string
  /** 是否包含时间 */
  includeTime?: boolean
  /** 时区 */
  timezone?: string
  /** 日期范围限制 */
  minDate?: Date
  maxDate?: Date
}

/**
 * 选择字段配置
 */
export interface SelectFieldConfig {
  /** 选项列表 */
  options: SelectOption[]
  /** 是否允许添加新选项 */
  allowNewOptions?: boolean
  /** 选项颜色主题 */
  colorTheme?: string
}

/**
 * 选择选项
 */
export interface SelectOption {
  /** 选项ID */
  id: string
  /** 选项值 */
  value: string
  /** 选项标签 */
  label: string
  /** 选项颜色 */
  color?: string
  /** 选项图标 */
  icon?: string
  /** 是否已删除 */
  deleted?: boolean
}

/**
 * 关联字段配置
 */
export interface RelationFieldConfig {
  /** 目标数据库ID */
  targetDatabaseId: string
  /** 关联类型 */
  relationType: 'one_to_one' | 'one_to_many' | 'many_to_many'
  /** 反向关联字段ID */
  reverseFieldId?: string
  /** 显示字段 */
  displayField?: string
  /** 是否级联删除 */
  cascadeDelete?: boolean
}

/**
 * 公式字段配置
 */
export interface FormulaFieldConfig {
  /** 公式表达式 */
  expression: string
  /** 返回类型 */
  returnType: FieldType
  /** 依赖字段 */
  dependencies: string[]
  /** 是否自动更新 */
  autoUpdate?: boolean
}

/**
 * 文件字段配置
 */
export interface FileFieldConfig {
  /** 允许的文件类型 */
  allowedTypes?: string[]
  /** 最大文件大小（字节） */
  maxSize?: number
  /** 最大文件数量 */
  maxCount?: number
  /** 是否允许多个文件 */
  multiple?: boolean
}

/**
 * 富文本字段配置
 */
export interface RichTextFieldConfig {
  /** 允许的格式 */
  allowedFormats?: string[]
  /** 最大长度 */
  maxLength?: number
  /** 是否允许嵌入 */
  allowEmbeds?: boolean
}

/**
 * 位置字段配置
 */
export interface LocationFieldConfig {
  /** 默认缩放级别 */
  defaultZoom?: number
  /** 是否显示地图 */
  showMap?: boolean
  /** 地图提供商 */
  mapProvider?: 'google' | 'openstreetmap' | 'baidu'
}

/**
 * 货币字段配置
 */
export interface CurrencyFieldConfig {
  /** 货币代码 */
  currency: string
  /** 小数位数 */
  precision?: number
  /** 货币符号位置 */
  symbolPosition?: 'before' | 'after'
}

/**
 * 评分字段配置
 */
export interface RatingFieldConfig {
  /** 最大评分 */
  maxRating: number
  /** 评分图标 */
  icon?: 'star' | 'heart' | 'thumb' | 'number'
  /** 是否允许半分 */
  allowHalf?: boolean
}

/**
 * 进度字段配置
 */
export interface ProgressFieldConfig {
  /** 最大值 */
  maxValue: number
  /** 显示格式 */
  format?: 'percentage' | 'fraction' | 'bar'
  /** 进度条颜色 */
  color?: string
}

/**
 * 字段值类型
 */
export type FieldValue = 
  | string
  | number
  | boolean
  | Date
  | string[]
  | number[]
  | FileValue
  | LocationValue
  | RelationValue
  | null
  | undefined

/**
 * 文件值
 */
export interface FileValue {
  id: string
  name: string
  url: string
  size: number
  type: string
  thumbnail?: string
}

/**
 * 位置值
 */
export interface LocationValue {
  latitude: number
  longitude: number
  address?: string
  city?: string
  country?: string
}

/**
 * 关联值
 */
export interface RelationValue {
  id: string
  displayValue: string
  recordId: string
}

/**
 * 字段验证规则
 */
export interface FieldValidation {
  /** 正则表达式 */
  pattern?: string
  /** 自定义验证函数 */
  customValidator?: string
  /** 错误消息 */
  errorMessage?: string
}

/**
 * 字段显示配置
 */
export interface FieldDisplay {
  /** 显示宽度 */
  width?: number
  /** 是否换行 */
  wrap?: boolean
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right'
  /** 字体大小 */
  fontSize?: 'small' | 'medium' | 'large'
  /** 字体颜色 */
  color?: string
  /** 背景颜色 */
  backgroundColor?: string
  /** 是否加粗 */
  bold?: boolean
  /** 是否斜体 */
  italic?: boolean
}

/**
 * 字段创建参数
 */
export interface CreateFieldParams {
  name: string
  type: FieldType
  config?: Partial<FieldConfig>
  required?: boolean
  unique?: boolean
  indexed?: boolean
  description?: string
  defaultValue?: FieldValue
  validation?: FieldValidation
  display?: Partial<FieldDisplay>
}

/**
 * 字段更新参数
 */
export interface UpdateFieldParams {
  name?: string
  config?: Partial<FieldConfig>
  required?: boolean
  unique?: boolean
  indexed?: boolean
  hidden?: boolean
  description?: string
  defaultValue?: FieldValue
  validation?: FieldValidation
  display?: Partial<FieldDisplay>
}
