import React from 'react'
import { BookOpen } from 'lucide-react'

interface LoadingScreenProps {
  message?: string
  subtitle?: string
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading...', 
  subtitle = 'Please wait while we prepare your workspace' 
}) => {
  return (
    <div className="h-full flex items-center justify-center bg-gradient-primary">
      <div className="text-center text-white">
        {/* Logo and Spinner */}
        <div className="relative mb-8">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            {/* Spinning ring */}
            <div className="absolute inset-0 border-4 border-white/30 rounded-full animate-spin border-t-white"></div>
            {/* Logo */}
            <div className="absolute inset-2 bg-white/20 rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{message}</h2>
          <p className="text-white/80 text-sm max-w-sm mx-auto">{subtitle}</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center space-x-1 mt-8">
          <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen
