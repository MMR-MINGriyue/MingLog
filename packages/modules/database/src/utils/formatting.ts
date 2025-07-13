/**
 * 数据格式化工具函数
 */

import { format, parseISO, isValid } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  FieldType,
  FieldValue,
  Field,
  NumberFieldConfig,
  DateFieldConfig,
  CurrencyFieldConfig
} from '../types'

/**
 * 格式化工具类
 */
export class FormattingUtils {
  /**
   * 格式化字段值用于显示
   */
  static formatFieldValue(field: Field, value: FieldValue): string {
    if (value === null || value === undefined) {
      return ''
    }

    switch (field.type) {
      case FieldType.TEXT:
      case FieldType.RICH_TEXT:
        return this.formatTextValue(value, field)
      
      case FieldType.NUMBER:
        return this.formatNumberValue(value, field)
      
      case FieldType.DATE:
      case FieldType.DATETIME:
      case FieldType.TIME:
        return this.formatDateValue(value, field)
      
      case FieldType.CURRENCY:
        return this.formatCurrencyValue(value, field)
      
      case FieldType.CHECKBOX:
        return this.formatCheckboxValue(value)
      
      case FieldType.SELECT:
        return this.formatSelectValue(value, field)
      
      case FieldType.MULTI_SELECT:
        return this.formatMultiSelectValue(value, field)
      
      case FieldType.URL:
        return this.formatUrlValue(value)
      
      case FieldType.EMAIL:
        return this.formatEmailValue(value)
      
      case FieldType.PHONE:
        return this.formatPhoneValue(value)
      
      case FieldType.FILE:
      case FieldType.IMAGE:
        return this.formatFileValue(value)
      
      case FieldType.RATING:
        return this.formatRatingValue(value, field)
      
      case FieldType.PROGRESS:
        return this.formatProgressValue(value, field)
      
      case FieldType.LOCATION:
        return this.formatLocationValue(value)
      
      case FieldType.ARRAY:
        return this.formatArrayValue(value)
      
      case FieldType.JSON:
        return this.formatJsonValue(value)
      
      default:
        return String(value)
    }
  }

  /**
   * 格式化文本值
   */
  private static formatTextValue(value: FieldValue, field: Field): string {
    const text = String(value)
    const config = field.config as any
    
    if (config?.maxLength && text.length > config.maxLength) {
      return text.substring(0, config.maxLength) + '...'
    }
    
    return text
  }

  /**
   * 格式化数字值
   */
  private static formatNumberValue(value: FieldValue, field: Field): string {
    const num = Number(value)
    if (isNaN(num)) {
      return String(value)
    }

    const config = field.config as NumberFieldConfig
    
    // 处理精度
    let formattedNum = num
    if (config?.precision !== undefined) {
      formattedNum = Number(num.toFixed(config.precision))
    }

    // 处理格式
    switch (config?.format) {
      case 'percentage':
        return `${(formattedNum * 100).toFixed(config.precision || 2)}%`
      
      case 'scientific':
        return formattedNum.toExponential(config.precision || 2)
      
      case 'integer':
        return Math.round(formattedNum).toString()
      
      default:
        let result = formattedNum.toString()
        
        // 添加千分位分隔符
        if (config?.thousandsSeparator) {
          result = this.addThousandsSeparator(result)
        }
        
        // 添加单位
        if (config?.unit) {
          result += ` ${config.unit}`
        }
        
        return result
    }
  }

  /**
   * 格式化日期值
   */
  private static formatDateValue(value: FieldValue, field: Field): string {
    const date = typeof value === 'string' ? parseISO(value) : new Date(value as any)
    
    if (!isValid(date)) {
      return String(value)
    }

    const config = field.config as DateFieldConfig
    let formatString = config?.format || 'yyyy-MM-dd'
    
    // 根据字段类型调整格式
    if (field.type === FieldType.DATETIME) {
      formatString = config?.includeTime ? 'yyyy-MM-dd HH:mm:ss' : 'yyyy-MM-dd'
    } else if (field.type === FieldType.TIME) {
      formatString = 'HH:mm:ss'
    }

    try {
      return format(date, formatString, { locale: zhCN })
    } catch {
      return date.toLocaleDateString('zh-CN')
    }
  }

  /**
   * 格式化货币值
   */
  private static formatCurrencyValue(value: FieldValue, field: Field): string {
    const num = Number(value)
    if (isNaN(num)) {
      return String(value)
    }

    const config = field.config as CurrencyFieldConfig
    const currency = config?.currency || 'CNY'
    const precision = config?.precision || 2
    
    try {
      return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: precision,
        maximumFractionDigits: precision
      }).format(num)
    } catch {
      return `${currency} ${num.toFixed(precision)}`
    }
  }

  /**
   * 格式化复选框值
   */
  private static formatCheckboxValue(value: FieldValue): string {
    return value ? '✓' : '✗'
  }

  /**
   * 格式化选择值
   */
  private static formatSelectValue(value: FieldValue, field: Field): string {
    const config = field.config as any
    const option = config?.options?.find((opt: any) => opt.value === value)
    return option?.label || String(value)
  }

  /**
   * 格式化多选值
   */
  private static formatMultiSelectValue(value: FieldValue, field: Field): string {
    if (!Array.isArray(value)) {
      return String(value)
    }

    const config = field.config as any
    const labels = value.map(val => {
      const option = config?.options?.find((opt: any) => opt.value === val)
      return option?.label || String(val)
    })

    return labels.join(', ')
  }

  /**
   * 格式化URL值
   */
  private static formatUrlValue(value: FieldValue): string {
    const url = String(value)
    if (url.length > 50) {
      return url.substring(0, 47) + '...'
    }
    return url
  }

  /**
   * 格式化邮箱值
   */
  private static formatEmailValue(value: FieldValue): string {
    return String(value)
  }

  /**
   * 格式化电话值
   */
  private static formatPhoneValue(value: FieldValue): string {
    const phone = String(value).replace(/\D/g, '')
    
    // 中国手机号格式化
    if (phone.length === 11 && phone.startsWith('1')) {
      return `${phone.substring(0, 3)}-${phone.substring(3, 7)}-${phone.substring(7)}`
    }
    
    return String(value)
  }

  /**
   * 格式化文件值
   */
  private static formatFileValue(value: FieldValue): string {
    if (typeof value === 'object' && value !== null) {
      const fileValue = value as any
      return fileValue.name || fileValue.url || '文件'
    }
    return String(value)
  }

  /**
   * 格式化评分值
   */
  private static formatRatingValue(value: FieldValue, field: Field): string {
    const rating = Number(value)
    if (isNaN(rating)) {
      return String(value)
    }

    const config = field.config as any
    const maxRating = config?.maxRating || 5
    const icon = config?.icon || 'star'
    
    let iconChar = '★'
    switch (icon) {
      case 'heart':
        iconChar = '♥'
        break
      case 'thumb':
        iconChar = '👍'
        break
      case 'number':
        return `${rating}/${maxRating}`
    }

    return iconChar.repeat(Math.floor(rating)) + '☆'.repeat(maxRating - Math.floor(rating))
  }

  /**
   * 格式化进度值
   */
  private static formatProgressValue(value: FieldValue, field: Field): string {
    const progress = Number(value)
    if (isNaN(progress)) {
      return String(value)
    }

    const config = field.config as any
    const maxValue = config?.maxValue || 100
    const format = config?.format || 'percentage'
    
    switch (format) {
      case 'percentage':
        return `${Math.round((progress / maxValue) * 100)}%`
      case 'fraction':
        return `${progress}/${maxValue}`
      case 'bar':
        const barLength = 20
        const filledLength = Math.round((progress / maxValue) * barLength)
        return '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength)
      default:
        return String(progress)
    }
  }

  /**
   * 格式化位置值
   */
  private static formatLocationValue(value: FieldValue): string {
    if (typeof value === 'object' && value !== null) {
      const location = value as any
      if (location.address) {
        return location.address
      }
      if (location.latitude && location.longitude) {
        return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
      }
    }
    return String(value)
  }

  /**
   * 格式化数组值
   */
  private static formatArrayValue(value: FieldValue): string {
    if (Array.isArray(value)) {
      return value.map(item => String(item)).join(', ')
    }
    return String(value)
  }

  /**
   * 格式化JSON值
   */
  private static formatJsonValue(value: FieldValue): string {
    try {
      if (typeof value === 'object') {
        return JSON.stringify(value, null, 2)
      }
      return String(value)
    } catch {
      return String(value)
    }
  }

  /**
   * 添加千分位分隔符
   */
  private static addThousandsSeparator(numStr: string): string {
    const parts = numStr.split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return parts.join('.')
  }

  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 格式化相对时间
   */
  static formatRelativeTime(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSeconds < 60) {
      return '刚刚'
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`
    } else if (diffHours < 24) {
      return `${diffHours}小时前`
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else {
      return format(date, 'yyyy-MM-dd', { locale: zhCN })
    }
  }

  /**
   * 截断文本
   */
  static truncateText(text: string, maxLength: number, suffix = '...'): string {
    if (text.length <= maxLength) {
      return text
    }
    return text.substring(0, maxLength - suffix.length) + suffix
  }

  /**
   * 高亮搜索关键词
   */
  static highlightSearchTerm(text: string, searchTerm: string): string {
    if (!searchTerm) {
      return text
    }
    
    const regex = new RegExp(`(${searchTerm})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }
}
