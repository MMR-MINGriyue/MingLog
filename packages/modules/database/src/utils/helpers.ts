/**
 * 数据库模块辅助工具函数
 */

import {
  Database,
  Field,
  View,
  FieldType,
  ViewType,
  Filter,
  Sort,
  Group,
  FilterOperator
} from '../types'

/**
 * 辅助工具类
 */
export class DatabaseHelpers {
  /**
   * 创建默认字段
   */
  static createDefaultFields(): Field[] {
    return [
      {
        id: 'title',
        name: '标题',
        type: FieldType.TEXT,
        config: {
          maxLength: 200,
          placeholder: '请输入标题'
        },
        required: true,
        unique: false,
        indexed: true,
        hidden: false,
        display: {
          width: 200,
          align: 'left'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  }

  /**
   * 创建默认视图
   */
  static createDefaultView(databaseId: string): View {
    return {
      id: `view_${Date.now()}`,
      name: '所有记录',
      type: ViewType.TABLE,
      databaseId,
      config: {
        rowHeight: 'medium',
        showRowNumbers: true,
        showCheckboxes: true,
        enableRowSelection: true,
        enableColumnResize: true,
        enableColumnSort: true,
        frozenColumns: 0,
        pagination: {
          enabled: true,
          pageSize: 50,
          showPageNumbers: true,
          showTotal: true
        }
      },
      filters: [],
      sorts: [],
      groups: [],
      visibleFields: [],
      hiddenFields: [],
      fieldOrder: [],
      isDefault: true,
      isPublic: false,
      permissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system'
    }
  }

  /**
   * 获取字段类型的默认配置
   */
  static getDefaultFieldConfig(fieldType: FieldType): any {
    switch (fieldType) {
      case FieldType.TEXT:
        return {
          maxLength: 500,
          multiline: false,
          placeholder: '请输入文本'
        }

      case FieldType.NUMBER:
        return {
          precision: 2,
          format: 'decimal',
          thousandsSeparator: true
        }

      case FieldType.DATE:
        return {
          format: 'yyyy-MM-dd',
          includeTime: false
        }

      case FieldType.DATETIME:
        return {
          format: 'yyyy-MM-dd HH:mm:ss',
          includeTime: true
        }

      case FieldType.SELECT:
        return {
          options: [],
          allowNewOptions: false
        }

      case FieldType.MULTI_SELECT:
        return {
          options: [],
          allowNewOptions: false
        }

      case FieldType.CURRENCY:
        return {
          currency: 'CNY',
          precision: 2,
          symbolPosition: 'before'
        }

      case FieldType.RATING:
        return {
          maxRating: 5,
          icon: 'star',
          allowHalf: false
        }

      case FieldType.PROGRESS:
        return {
          maxValue: 100,
          format: 'percentage'
        }

      case FieldType.FILE:
        return {
          allowedTypes: [],
          maxSize: 10 * 1024 * 1024, // 10MB
          maxCount: 5,
          multiple: true
        }

      default:
        return {}
    }
  }

  /**
   * 验证字段类型兼容性
   */
  static isFieldTypeCompatible(fromType: FieldType, toType: FieldType): boolean {
    // 相同类型总是兼容的
    if (fromType === toType) {
      return true
    }

    // 定义兼容性映射
    const compatibilityMap: Record<FieldType, FieldType[]> = {
      [FieldType.TEXT]: [FieldType.RICH_TEXT, FieldType.URL, FieldType.EMAIL, FieldType.PHONE],
      [FieldType.NUMBER]: [FieldType.CURRENCY, FieldType.RATING, FieldType.PROGRESS],
      [FieldType.DATE]: [FieldType.DATETIME],
      [FieldType.DATETIME]: [FieldType.DATE],
      [FieldType.SELECT]: [FieldType.MULTI_SELECT],
      [FieldType.MULTI_SELECT]: [FieldType.SELECT],
      [FieldType.FILE]: [FieldType.IMAGE],
      [FieldType.IMAGE]: [FieldType.FILE]
    }

    return compatibilityMap[fromType]?.includes(toType) || false
  }

  /**
   * 生成字段ID
   */
  static generateFieldId(name: string): string {
    const sanitized = name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
    
    return `field_${sanitized}_${Date.now()}`
  }

  /**
   * 生成视图ID
   */
  static generateViewId(name: string): string {
    const sanitized = name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
    
    return `view_${sanitized}_${Date.now()}`
  }

  /**
   * 创建筛选条件
   */
  static createFilter(
    fieldId: string,
    operator: FilterOperator,
    value: any,
    conjunction: 'and' | 'or' = 'and'
  ): Filter {
    return {
      id: `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fieldId,
      operator,
      value,
      conjunction
    }
  }

  /**
   * 创建排序规则
   */
  static createSort(
    fieldId: string,
    direction: 'asc' | 'desc' = 'asc',
    priority: number = 0
  ): Sort {
    return {
      fieldId,
      direction,
      priority
    }
  }

  /**
   * 创建分组规则
   */
  static createGroup(
    fieldId: string,
    order: 'asc' | 'desc' = 'asc',
    collapsed: boolean = false
  ): Group {
    return {
      fieldId,
      order,
      collapsed
    }
  }

  /**
   * 检查字段名称是否唯一
   */
  static isFieldNameUnique(database: Database, name: string, excludeId?: string): boolean {
    return !database.fields.some(field => 
      field.name === name && field.id !== excludeId
    )
  }

  /**
   * 检查视图名称是否唯一
   */
  static isViewNameUnique(database: Database, name: string, excludeId?: string): boolean {
    return !database.views.some(view => 
      view.name === name && view.id !== excludeId
    )
  }

  /**
   * 获取字段的显示名称
   */
  static getFieldDisplayName(field: Field): string {
    return field.name || field.id
  }

  /**
   * 获取字段类型的显示名称
   */
  static getFieldTypeDisplayName(fieldType: FieldType): string {
    const typeNames: Record<FieldType, string> = {
      [FieldType.TEXT]: '文本',
      [FieldType.NUMBER]: '数字',
      [FieldType.DATE]: '日期',
      [FieldType.DATETIME]: '日期时间',
      [FieldType.TIME]: '时间',
      [FieldType.CHECKBOX]: '复选框',
      [FieldType.SELECT]: '单选',
      [FieldType.MULTI_SELECT]: '多选',
      [FieldType.URL]: '链接',
      [FieldType.EMAIL]: '邮箱',
      [FieldType.PHONE]: '电话',
      [FieldType.RICH_TEXT]: '富文本',
      [FieldType.FILE]: '文件',
      [FieldType.IMAGE]: '图片',
      [FieldType.RELATION]: '关联',
      [FieldType.ROLLUP]: '汇总',
      [FieldType.FORMULA]: '公式',
      [FieldType.CREATED_TIME]: '创建时间',
      [FieldType.LAST_EDITED_TIME]: '最后编辑时间',
      [FieldType.CREATED_BY]: '创建者',
      [FieldType.LAST_EDITED_BY]: '最后编辑者',
      [FieldType.JSON]: 'JSON',
      [FieldType.ARRAY]: '数组',
      [FieldType.LOCATION]: '位置',
      [FieldType.RATING]: '评分',
      [FieldType.PROGRESS]: '进度',
      [FieldType.CURRENCY]: '货币'
    }

    return typeNames[fieldType] || fieldType
  }

  /**
   * 获取视图类型的显示名称
   */
  static getViewTypeDisplayName(viewType: ViewType): string {
    const typeNames: Record<ViewType, string> = {
      [ViewType.TABLE]: '表格',
      [ViewType.KANBAN]: '看板',
      [ViewType.CALENDAR]: '日历',
      [ViewType.GALLERY]: '画廊',
      [ViewType.LIST]: '列表',
      [ViewType.TIMELINE]: '时间线',
      [ViewType.CHART]: '图表'
    }

    return typeNames[viewType] || viewType
  }

  /**
   * 获取操作符的显示名称
   */
  static getOperatorDisplayName(operator: FilterOperator): string {
    const operatorNames: Record<FilterOperator, string> = {
      [FilterOperator.EQUALS]: '等于',
      [FilterOperator.NOT_EQUALS]: '不等于',
      [FilterOperator.IS_EMPTY]: '为空',
      [FilterOperator.IS_NOT_EMPTY]: '不为空',
      [FilterOperator.CONTAINS]: '包含',
      [FilterOperator.NOT_CONTAINS]: '不包含',
      [FilterOperator.STARTS_WITH]: '开始于',
      [FilterOperator.ENDS_WITH]: '结束于',
      [FilterOperator.GREATER_THAN]: '大于',
      [FilterOperator.GREATER_THAN_OR_EQUAL]: '大于等于',
      [FilterOperator.LESS_THAN]: '小于',
      [FilterOperator.LESS_THAN_OR_EQUAL]: '小于等于',
      [FilterOperator.IS_TODAY]: '是今天',
      [FilterOperator.IS_YESTERDAY]: '是昨天',
      [FilterOperator.IS_TOMORROW]: '是明天',
      [FilterOperator.IS_THIS_WEEK]: '是本周',
      [FilterOperator.IS_THIS_MONTH]: '是本月',
      [FilterOperator.IS_THIS_YEAR]: '是今年',
      [FilterOperator.IS_BEFORE]: '早于',
      [FilterOperator.IS_AFTER]: '晚于',
      [FilterOperator.IS_BETWEEN]: '介于',
      [FilterOperator.IS_ANY_OF]: '是其中之一',
      [FilterOperator.IS_NONE_OF]: '都不是',
      [FilterOperator.HAS_ANY]: '包含任意',
      [FilterOperator.HAS_ALL]: '包含全部',
      [FilterOperator.HAS_NONE]: '都不包含'
    }

    return operatorNames[operator] || operator
  }

  /**
   * 获取字段类型支持的操作符
   */
  static getSupportedOperators(fieldType: FieldType): FilterOperator[] {
    const baseOperators = [
      FilterOperator.EQUALS,
      FilterOperator.NOT_EQUALS,
      FilterOperator.IS_EMPTY,
      FilterOperator.IS_NOT_EMPTY
    ]

    switch (fieldType) {
      case FieldType.TEXT:
      case FieldType.RICH_TEXT:
      case FieldType.URL:
      case FieldType.EMAIL:
      case FieldType.PHONE:
        return [
          ...baseOperators,
          FilterOperator.CONTAINS,
          FilterOperator.NOT_CONTAINS,
          FilterOperator.STARTS_WITH,
          FilterOperator.ENDS_WITH
        ]

      case FieldType.NUMBER:
      case FieldType.CURRENCY:
      case FieldType.RATING:
      case FieldType.PROGRESS:
        return [
          ...baseOperators,
          FilterOperator.GREATER_THAN,
          FilterOperator.GREATER_THAN_OR_EQUAL,
          FilterOperator.LESS_THAN,
          FilterOperator.LESS_THAN_OR_EQUAL
        ]

      case FieldType.DATE:
      case FieldType.DATETIME:
      case FieldType.TIME:
        return [
          ...baseOperators,
          FilterOperator.IS_TODAY,
          FilterOperator.IS_YESTERDAY,
          FilterOperator.IS_TOMORROW,
          FilterOperator.IS_THIS_WEEK,
          FilterOperator.IS_THIS_MONTH,
          FilterOperator.IS_THIS_YEAR,
          FilterOperator.IS_BEFORE,
          FilterOperator.IS_AFTER,
          FilterOperator.IS_BETWEEN
        ]

      case FieldType.SELECT:
      case FieldType.MULTI_SELECT:
        return [
          ...baseOperators,
          FilterOperator.IS_ANY_OF,
          FilterOperator.IS_NONE_OF
        ]

      case FieldType.RELATION:
        return [
          ...baseOperators,
          FilterOperator.HAS_ANY,
          FilterOperator.HAS_ALL,
          FilterOperator.HAS_NONE
        ]

      case FieldType.CHECKBOX:
        return [FilterOperator.EQUALS, FilterOperator.NOT_EQUALS]

      default:
        return baseOperators
    }
  }

  /**
   * 深度克隆对象
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as any
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item)) as any
    }

    const cloned = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key])
      }
    }

    return cloned
  }

  /**
   * 比较两个对象是否相等
   */
  static isEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) {
      return true
    }

    if (obj1 == null || obj2 == null) {
      return obj1 === obj2
    }

    if (typeof obj1 !== typeof obj2) {
      return false
    }

    if (typeof obj1 !== 'object') {
      return obj1 === obj2
    }

    if (Array.isArray(obj1) !== Array.isArray(obj2)) {
      return false
    }

    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)

    if (keys1.length !== keys2.length) {
      return false
    }

    for (const key of keys1) {
      if (!keys2.includes(key)) {
        return false
      }

      if (!this.isEqual(obj1[key], obj2[key])) {
        return false
      }
    }

    return true
  }
}
