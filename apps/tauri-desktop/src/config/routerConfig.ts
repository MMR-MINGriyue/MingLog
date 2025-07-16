/**
 * React Router配置
 * 统一管理React Router v7 future标志
 */

export const routerFutureConfig = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const

export type RouterFutureConfig = typeof routerFutureConfig
