import React from 'react'
import { BookOpen } from 'lucide-react'

interface LoadingScreenProps {
  message?: string
  subtitle?: string
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = '正在加载...',
  subtitle = '请稍候，我们正在为您准备工作空间'
}) => {
  return (
    <div
      className="h-full w-full flex items-center justify-center"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
        background: 'var(--macos-bg-primary, #ffffff)',
        color: 'var(--macos-text-primary, #000000)'
      }}
    >
      <div className="text-center">
        {/* macOS风格Logo和加载器 */}
        <div className="relative mb-8">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            {/* macOS风格旋转环 */}
            <div
              className="absolute inset-0 rounded-full animate-spin"
              style={{
                border: '3px solid var(--macos-separator-primary, #d1d5db)',
                borderTopColor: 'var(--macos-system-blue, #007AFF)',
                borderRadius: '50%'
              }}
            ></div>
            {/* Logo背景 */}
            <div
              className="absolute inset-2 rounded-full flex items-center justify-center"
              style={{
                background: 'var(--macos-fill-quaternary, #f3f4f6)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)'
              }}
            >
              <BookOpen
                className="w-8 h-8"
                style={{ color: 'var(--macos-system-blue, #007AFF)' }}
              />
            </div>
          </div>
        </div>

        {/* macOS风格文本 */}
        <div className="space-y-3">
          <h1
            className="font-semibold"
            style={{
              fontSize: '28px',
              lineHeight: '34px',
              fontWeight: '600',
              color: 'var(--macos-text-primary, #000000)'
            }}
          >
            MingLog
          </h1>
          <h2
            className="font-medium"
            style={{
              fontSize: '17px',
              lineHeight: '22px',
              fontWeight: '500',
              color: 'var(--macos-text-primary, #000000)'
            }}
          >
            {message}
          </h2>
          <p
            className="max-w-sm mx-auto"
            style={{
              fontSize: '15px',
              lineHeight: '20px',
              color: 'var(--macos-text-secondary, #6b7280)'
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* macOS风格进度指示器 */}
        <div className="flex justify-center space-x-2 mt-8">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{
              backgroundColor: 'var(--macos-system-blue, #007AFF)',
              opacity: '0.6'
            }}
          ></div>
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{
              backgroundColor: 'var(--macos-system-blue, #007AFF)',
              opacity: '0.6',
              animationDelay: '0.2s'
            }}
          ></div>
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{
              backgroundColor: 'var(--macos-system-blue, #007AFF)',
              opacity: '0.6',
              animationDelay: '0.4s'
            }}
          ></div>
        </div>
      </div>
    </div>
  )
}

export { LoadingScreen }
