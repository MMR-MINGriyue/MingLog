/**
 * 日期工具函数
 * 提供日期格式化和处理功能
 */

/**
 * 格式化日期
 * @param date 日期对象或字符串
 * @param format 格式类型
 * @returns 格式化后的日期字符串
 */
export const formatDate = (
  date: Date | string, 
  format: 'full' | 'short' | 'time' | 'relative' = 'short'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return '无效日期'
  }

  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  switch (format) {
    case 'full':
      return dateObj.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit'
      })
    
    case 'short':
      return dateObj.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    
    case 'time':
      return dateObj.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    
    case 'relative':
      if (diffDays === 0) {
        return '今天'
      } else if (diffDays === 1) {
        return '昨天'
      } else if (diffDays === -1) {
        return '明天'
      } else if (diffDays > 0 && diffDays < 7) {
        return `${diffDays}天前`
      } else if (diffDays < 0 && diffDays > -7) {
        return `${Math.abs(diffDays)}天后`
      } else {
        return formatDate(dateObj, 'short')
      }
    
    default:
      return formatDate(dateObj, 'short')
  }
}

/**
 * 格式化持续时间
 * @param minutes 分钟数
 * @returns 格式化后的持续时间字符串
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}分钟`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (hours < 24) {
    if (remainingMinutes === 0) {
      return `${hours}小时`
    }
    return `${hours}小时${remainingMinutes}分钟`
  }
  
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  
  if (remainingHours === 0) {
    return `${days}天`
  }
  return `${days}天${remainingHours}小时`
}

/**
 * 检查日期是否为今天
 * @param date 日期对象或字符串
 * @returns 是否为今天
 */
export const isToday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  
  return dateObj.getDate() === today.getDate() &&
         dateObj.getMonth() === today.getMonth() &&
         dateObj.getFullYear() === today.getFullYear()
}

/**
 * 检查日期是否为明天
 * @param date 日期对象或字符串
 * @returns 是否为明天
 */
export const isTomorrow = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  return dateObj.getDate() === tomorrow.getDate() &&
         dateObj.getMonth() === tomorrow.getMonth() &&
         dateObj.getFullYear() === tomorrow.getFullYear()
}

/**
 * 检查日期是否已过期
 * @param date 日期对象或字符串
 * @returns 是否已过期
 */
export const isOverdue = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  
  return dateObj < now
}

/**
 * 检查日期是否即将到期（24小时内）
 * @param date 日期对象或字符串
 * @returns 是否即将到期
 */
export const isDueSoon = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = dateObj.getTime() - now.getTime()
  
  return diffMs > 0 && diffMs < 24 * 60 * 60 * 1000
}

/**
 * 获取日期范围的描述
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 日期范围描述
 */
export const getDateRangeDescription = (
  startDate: Date | string, 
  endDate: Date | string
): string => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  
  if (isToday(start) && isToday(end)) {
    return '今天'
  }
  
  if (isToday(start) && isTomorrow(end)) {
    return '今天到明天'
  }
  
  return `${formatDate(start, 'short')} 到 ${formatDate(end, 'short')}`
}

/**
 * 计算两个日期之间的工作日数量
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 工作日数量
 */
export const getWorkdaysBetween = (
  startDate: Date | string, 
  endDate: Date | string
): number => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  
  let count = 0
  const current = new Date(start)
  
  while (current <= end) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 不是周末
      count++
    }
    current.setDate(current.getDate() + 1)
  }
  
  return count
}

/**
 * 获取下一个工作日
 * @param date 基准日期
 * @returns 下一个工作日
 */
export const getNextWorkday = (date: Date | string = new Date()): Date => {
  const baseDate = typeof date === 'string' ? new Date(date) : date
  const nextDay = new Date(baseDate)
  nextDay.setDate(nextDay.getDate() + 1)
  
  // 如果是周末，继续往后找
  while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
    nextDay.setDate(nextDay.getDate() + 1)
  }
  
  return nextDay
}

/**
 * 获取本周的开始和结束日期
 * @param date 基准日期
 * @returns 本周的开始和结束日期
 */
export const getWeekRange = (date: Date | string = new Date()): { start: Date, end: Date } => {
  const baseDate = typeof date === 'string' ? new Date(date) : date
  const start = new Date(baseDate)
  const end = new Date(baseDate)
  
  // 获取周一（周的开始）
  const dayOfWeek = start.getDay()
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  start.setDate(start.getDate() - daysToMonday)
  start.setHours(0, 0, 0, 0)
  
  // 获取周日（周的结束）
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  
  return { start, end }
}

/**
 * 获取本月的开始和结束日期
 * @param date 基准日期
 * @returns 本月的开始和结束日期
 */
export const getMonthRange = (date: Date | string = new Date()): { start: Date, end: Date } => {
  const baseDate = typeof date === 'string' ? new Date(date) : date
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
  const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0, 23, 59, 59, 999)
  
  return { start, end }
}
