/**
 * 数据验证工具函数
 */

import { z } from 'zod'
import {
  FieldType,
  FieldValue,
  Field,
  Database,
  CreateDatabaseParams,
  ValidationError
} from '../types'

/**
 * 数据库名称验证模式
 */
export const DatabaseNameSchema = z.string()
  .min(1, '数据库名称不能为空')
  .max(100, '数据库名称不能超过100个字符')
  .regex(/^[^<>:"/\\|?*]+$/, '数据库名称包含无效字符')

/**
 * 字段名称验证模式
 */
export const FieldNameSchema = z.string()
  .min(1, '字段名称不能为空')
  .max(50, '字段名称不能超过50个字符')
  .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, '字段名称只能包含字母、数字、下划线和中文')

/**
 * 创建数据库参数验证模式
 */
export const CreateDatabaseParamsSchema = z.object({
  name: DatabaseNameSchema,
  description: z.string().max(500, '描述不能超过500个字符').optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '颜色格式无效').optional(),
  fields: z.array(z.any()).optional(),
  config: z.any().optional(),
  permissions: z.array(z.any()).optional()
})

/**
 * 验证工具类
 */
export class ValidationUtils {
  /**
   * 验证数据库名称
   */
  static validateDatabaseName(name: string): void {
    try {
      DatabaseNameSchema.parse(name)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors[0].message, 'name')
      }
      throw new ValidationError('数据库名称验证失败', 'name')
    }
  }

  /**
   * 验证字段名称
   */
  static validateFieldName(name: string): void {
    try {
      FieldNameSchema.parse(name)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors[0].message, 'name')
      }
      throw new ValidationError('字段名称验证失败', 'name')
    }
  }

  /**
   * 验证创建数据库参数
   */
  static validateCreateDatabaseParams(params: CreateDatabaseParams): void {
    try {
      CreateDatabaseParamsSchema.parse(params)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0]
        throw new ValidationError(firstError.message, firstError.path.join('.'))
      }
      throw new ValidationError('参数验证失败')
    }
  }

  /**
   * 验证字段值
   */
  static validateFieldValue(field: Field, value: FieldValue): void {
    // 检查必填字段
    if (field.required && (value === null || value === undefined || value === '')) {
      throw new ValidationError(`字段 ${field.name} 是必填的`, field.id)
    }

    // 如果值为空且不是必填，则跳过验证
    if (value === null || value === undefined || value === '') {
      return
    }

    // 根据字段类型验证
    switch (field.type) {
      case FieldType.TEXT:
        this.validateTextValue(field, value)
        break
      case FieldType.NUMBER:
        this.validateNumberValue(field, value)
        break
      case FieldType.DATE:
      case FieldType.DATETIME:
        this.validateDateValue(field, value)
        break
      case FieldType.EMAIL:
        this.validateEmailValue(field, value)
        break
      case FieldType.URL:
        this.validateUrlValue(field, value)
        break
      case FieldType.PHONE:
        this.validatePhoneValue(field, value)
        break
      case FieldType.SELECT:
        this.validateSelectValue(field, value)
        break
      case FieldType.MULTI_SELECT:
        this.validateMultiSelectValue(field, value)
        break
      case FieldType.CHECKBOX:
        this.validateCheckboxValue(field, value)
        break
      default:
        // 其他类型的验证
        break
    }

    // 验证自定义验证规则
    if (field.validation) {
      this.validateCustomRules(field, value)
    }
  }

  /**
   * 验证文本值
   */
  private static validateTextValue(field: Field, value: FieldValue): void {
    if (typeof value !== 'string') {
      throw new ValidationError(`字段 ${field.name} 必须是文本类型`, field.id)
    }

    const config = field.config as any
    if (config?.maxLength && value.length > config.maxLength) {
      throw new ValidationError(`字段 ${field.name} 长度不能超过 ${config.maxLength} 个字符`, field.id)
    }

    if (config?.minLength && value.length < config.minLength) {
      throw new ValidationError(`字段 ${field.name} 长度不能少于 ${config.minLength} 个字符`, field.id)
    }
  }

  /**
   * 验证数字值
   */
  private static validateNumberValue(field: Field, value: FieldValue): void {
    const numValue = Number(value)
    if (isNaN(numValue)) {
      throw new ValidationError(`字段 ${field.name} 必须是数字类型`, field.id)
    }

    const config = field.config as any
    if (config?.min !== undefined && numValue < config.min) {
      throw new ValidationError(`字段 ${field.name} 不能小于 ${config.min}`, field.id)
    }

    if (config?.max !== undefined && numValue > config.max) {
      throw new ValidationError(`字段 ${field.name} 不能大于 ${config.max}`, field.id)
    }
  }

  /**
   * 验证日期值
   */
  private static validateDateValue(field: Field, value: FieldValue): void {
    const date = new Date(value as string)
    if (isNaN(date.getTime())) {
      throw new ValidationError(`字段 ${field.name} 必须是有效的日期`, field.id)
    }

    const config = field.config as any
    if (config?.minDate && date < new Date(config.minDate)) {
      throw new ValidationError(`字段 ${field.name} 不能早于 ${config.minDate}`, field.id)
    }

    if (config?.maxDate && date > new Date(config.maxDate)) {
      throw new ValidationError(`字段 ${field.name} 不能晚于 ${config.maxDate}`, field.id)
    }
  }

  /**
   * 验证邮箱值
   */
  private static validateEmailValue(field: Field, value: FieldValue): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value as string)) {
      throw new ValidationError(`字段 ${field.name} 必须是有效的邮箱地址`, field.id)
    }
  }

  /**
   * 验证URL值
   */
  private static validateUrlValue(field: Field, value: FieldValue): void {
    try {
      new URL(value as string)
    } catch {
      throw new ValidationError(`字段 ${field.name} 必须是有效的URL`, field.id)
    }
  }

  /**
   * 验证电话号码值
   */
  private static validatePhoneValue(field: Field, value: FieldValue): void {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/
    if (!phoneRegex.test(value as string)) {
      throw new ValidationError(`字段 ${field.name} 必须是有效的电话号码`, field.id)
    }
  }

  /**
   * 验证选择值
   */
  private static validateSelectValue(field: Field, value: FieldValue): void {
    const config = field.config as any
    const validOptions = config?.options?.map((opt: any) => opt.value) || []
    
    if (!validOptions.includes(value)) {
      throw new ValidationError(`字段 ${field.name} 的值不在有效选项中`, field.id)
    }
  }

  /**
   * 验证多选值
   */
  private static validateMultiSelectValue(field: Field, value: FieldValue): void {
    if (!Array.isArray(value)) {
      throw new ValidationError(`字段 ${field.name} 必须是数组类型`, field.id)
    }

    const config = field.config as any
    const validOptions = config?.options?.map((opt: any) => opt.value) || []
    
    for (const item of value) {
      if (!validOptions.includes(item)) {
        throw new ValidationError(`字段 ${field.name} 包含无效的选项: ${item}`, field.id)
      }
    }
  }

  /**
   * 验证复选框值
   */
  private static validateCheckboxValue(field: Field, value: FieldValue): void {
    if (typeof value !== 'boolean') {
      throw new ValidationError(`字段 ${field.name} 必须是布尔类型`, field.id)
    }
  }

  /**
   * 验证自定义规则
   */
  private static validateCustomRules(field: Field, value: FieldValue): void {
    const validation = field.validation
    if (!validation) return

    // 正则表达式验证
    if (validation.pattern) {
      const regex = new RegExp(validation.pattern)
      if (!regex.test(String(value))) {
        throw new ValidationError(
          validation.errorMessage || `字段 ${field.name} 格式不正确`,
          field.id
        )
      }
    }

    // 自定义验证函数
    if (validation.customValidator) {
      try {
        // 这里可以实现自定义验证函数的执行
        // 为了安全考虑，可能需要使用沙箱环境
        const isValid = eval(`(${validation.customValidator})`)(value)
        if (!isValid) {
          throw new ValidationError(
            validation.errorMessage || `字段 ${field.name} 验证失败`,
            field.id
          )
        }
      } catch (error) {
        throw new ValidationError(
          validation.errorMessage || `字段 ${field.name} 自定义验证失败`,
          field.id
        )
      }
    }
  }

  /**
   * 验证记录数据
   */
  static validateRecordData(database: Database, values: Record<string, FieldValue>): void {
    // 验证所有字段
    for (const field of database.fields) {
      const value = values[field.id]
      this.validateFieldValue(field, value)
    }

    // 检查唯一性约束
    this.validateUniqueConstraints(database, values)
  }

  /**
   * 验证唯一性约束
   */
  private static validateUniqueConstraints(database: Database, values: Record<string, FieldValue>): void {
    const uniqueFields = database.fields.filter(field => field.unique)
    
    for (const field of uniqueFields) {
      const value = values[field.id]
      if (value !== null && value !== undefined && value !== '') {
        // 这里需要检查数据库中是否已存在相同值
        // 具体实现需要访问数据存储层
      }
    }
  }
}
