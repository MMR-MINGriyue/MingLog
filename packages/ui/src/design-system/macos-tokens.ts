/**
 * macOS风格设计令牌
 * 基于Apple Human Interface Guidelines的设计系统
 */

// macOS系统颜色
export const macosColors = {
  // 系统颜色 - 亮色模式
  system: {
    blue: '#007AFF',
    green: '#34C759',
    indigo: '#5856D6',
    orange: '#FF9500',
    pink: '#FF2D92',
    purple: '#AF52DE',
    red: '#FF3B30',
    teal: '#5AC8FA',
    yellow: '#FFCC00',
    
    // 暗色模式对应色
    blueDark: '#0A84FF',
    greenDark: '#30D158',
    indigoDark: '#5E5CE6',
    orangeDark: '#FF9F0A',
    pinkDark: '#FF375F',
    purpleDark: '#BF5AF2',
    redDark: '#FF453A',
    tealDark: '#64D2FF',
    yellowDark: '#FFD60A'
  },

  // 灰度系统
  gray: {
    // 亮色模式
    light: {
      primary: '#000000',      // 主文字
      secondary: '#3C3C43',    // 次要文字 (60% opacity)
      tertiary: '#3C3C43',     // 第三级文字 (30% opacity)
      quaternary: '#3C3C43',   // 第四级文字 (18% opacity)
      
      // 背景色
      systemBackground: '#FFFFFF',
      secondarySystemBackground: '#F2F2F7',
      tertiarySystemBackground: '#FFFFFF',
      
      // 分组背景
      systemGroupedBackground: '#F2F2F7',
      secondarySystemGroupedBackground: '#FFFFFF',
      tertiarySystemGroupedBackground: '#F2F2F7',
      
      // 分隔符
      separator: '#3C3C43',           // 29% opacity
      opaqueSeparator: '#C6C6C8',
      
      // 链接
      link: '#007AFF',
      
      // 填充色
      systemFill: '#78788033',        // 20% opacity
      secondarySystemFill: '#78788028', // 16% opacity
      tertiarySystemFill: '#7878801F', // 12% opacity
      quaternarySystemFill: '#78788014' // 8% opacity
    },

    // 暗色模式
    dark: {
      primary: '#FFFFFF',      // 主文字
      secondary: '#EBEBF5',    // 次要文字 (60% opacity)
      tertiary: '#EBEBF5',     // 第三级文字 (30% opacity)
      quaternary: '#EBEBF5',   // 第四级文字 (18% opacity)
      
      // 背景色
      systemBackground: '#000000',
      secondarySystemBackground: '#1C1C1E',
      tertiarySystemBackground: '#2C2C2E',
      
      // 分组背景
      systemGroupedBackground: '#000000',
      secondarySystemGroupedBackground: '#1C1C1E',
      tertiarySystemGroupedBackground: '#2C2C2E',
      
      // 分隔符
      separator: '#54545899',         // 60% opacity
      opaqueSeparator: '#38383A',
      
      // 链接
      link: '#0A84FF',
      
      // 填充色
      systemFill: '#78788033',        // 20% opacity
      secondarySystemFill: '#78788028', // 16% opacity
      tertiarySystemFill: '#7878801F', // 12% opacity
      quaternarySystemFill: '#78788014' // 8% opacity
    }
  }
} as const;

// macOS字体系统
export const macosTypography = {
  // SF Pro字体栈
  fontFamily: {
    system: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
    mono: 'SF Mono, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    rounded: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
  },

  // 文本样式 - 基于Apple Typography Guidelines
  textStyles: {
    // 大标题
    largeTitle: {
      fontSize: '34px',
      lineHeight: '41px',
      fontWeight: '400',
      letterSpacing: '0.374px'
    },
    
    // 标题1
    title1: {
      fontSize: '28px',
      lineHeight: '34px',
      fontWeight: '400',
      letterSpacing: '0.364px'
    },
    
    // 标题2
    title2: {
      fontSize: '22px',
      lineHeight: '28px',
      fontWeight: '400',
      letterSpacing: '0.352px'
    },
    
    // 标题3
    title3: {
      fontSize: '20px',
      lineHeight: '25px',
      fontWeight: '400',
      letterSpacing: '0.38px'
    },
    
    // 标题
    headline: {
      fontSize: '17px',
      lineHeight: '22px',
      fontWeight: '600',
      letterSpacing: '-0.408px'
    },
    
    // 正文
    body: {
      fontSize: '17px',
      lineHeight: '22px',
      fontWeight: '400',
      letterSpacing: '-0.408px'
    },
    
    // 标注
    callout: {
      fontSize: '16px',
      lineHeight: '21px',
      fontWeight: '400',
      letterSpacing: '-0.32px'
    },
    
    // 子标题
    subheadline: {
      fontSize: '15px',
      lineHeight: '20px',
      fontWeight: '400',
      letterSpacing: '-0.24px'
    },
    
    // 脚注
    footnote: {
      fontSize: '13px',
      lineHeight: '18px',
      fontWeight: '400',
      letterSpacing: '-0.08px'
    },
    
    // 说明文字1
    caption1: {
      fontSize: '12px',
      lineHeight: '16px',
      fontWeight: '400',
      letterSpacing: '0px'
    },
    
    // 说明文字2
    caption2: {
      fontSize: '11px',
      lineHeight: '13px',
      fontWeight: '400',
      letterSpacing: '0.066px'
    }
  }
} as const;

// macOS间距系统
export const macosSpacing = {
  // 基础间距单位 (4px)
  unit: 4,
  
  // 间距比例
  scale: {
    0: '0px',
    1: '4px',    // 1 unit
    2: '8px',    // 2 units
    3: '12px',   // 3 units
    4: '16px',   // 4 units
    5: '20px',   // 5 units
    6: '24px',   // 6 units
    8: '32px',   // 8 units
    10: '40px',  // 10 units
    12: '48px',  // 12 units
    16: '64px',  // 16 units
    20: '80px',  // 20 units
    24: '96px',  // 24 units
    32: '128px', // 32 units
    40: '160px', // 40 units
    48: '192px', // 48 units
    56: '224px', // 56 units
    64: '256px'  // 64 units
  },
  
  // 语义化间距
  semantic: {
    // 内边距
    padding: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px'
    },
    
    // 外边距
    margin: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px'
    },
    
    // 间隙
    gap: {
      xs: '4px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px'
    }
  }
} as const;

// macOS圆角系统
export const macosBorderRadius = {
  // 基础圆角
  none: '0px',
  xs: '2px',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  '3xl': '24px',
  full: '9999px',
  
  // 语义化圆角
  semantic: {
    button: '6px',
    card: '8px',
    modal: '12px',
    input: '6px',
    badge: '4px',
    avatar: '50%'
  }
} as const;

// macOS阴影系统
export const macosShadows = {
  // 基础阴影
  none: 'none',
  
  // 层级阴影
  level1: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
  level2: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
  level3: '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
  level4: '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
  level5: '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)',
  
  // 语义化阴影
  semantic: {
    card: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    modal: '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
    dropdown: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
    button: '0 1px 3px rgba(0, 0, 0, 0.12)',
    focus: '0 0 0 3px rgba(0, 122, 255, 0.3)'
  },
  
  // 暗色模式阴影
  dark: {
    level1: '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.4)',
    level2: '0 3px 6px rgba(0, 0, 0, 0.4), 0 3px 6px rgba(0, 0, 0, 0.5)',
    level3: '0 10px 20px rgba(0, 0, 0, 0.5), 0 6px 6px rgba(0, 0, 0, 0.6)',
    level4: '0 14px 28px rgba(0, 0, 0, 0.6), 0 10px 10px rgba(0, 0, 0, 0.7)',
    level5: '0 19px 38px rgba(0, 0, 0, 0.7), 0 15px 12px rgba(0, 0, 0, 0.8)'
  }
} as const;

// macOS动画系统
export const macosAnimation = {
  // 缓动函数
  easing: {
    // 标准缓动
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    // 减速
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    // 加速
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
    // 尖锐
    sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
    // 弹性
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  },
  
  // 持续时间
  duration: {
    shortest: '150ms',
    shorter: '200ms',
    short: '250ms',
    standard: '300ms',
    complex: '375ms',
    enteringScreen: '225ms',
    leavingScreen: '195ms'
  },
  
  // 预设动画
  presets: {
    fadeIn: 'opacity 200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
    fadeOut: 'opacity 150ms cubic-bezier(0.4, 0.0, 0.2, 1)',
    slideIn: 'transform 225ms cubic-bezier(0.4, 0.0, 0.2, 1)',
    slideOut: 'transform 195ms cubic-bezier(0.4, 0.0, 0.2, 1)',
    scaleIn: 'transform 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    scaleOut: 'transform 150ms cubic-bezier(0.4, 0.0, 0.2, 1)'
  }
} as const;

// macOS毛玻璃效果
export const macosBlur = {
  // 毛玻璃背景
  vibrancy: {
    // 亮色模式
    light: {
      sidebar: 'rgba(246, 246, 246, 0.8)',
      menu: 'rgba(255, 255, 255, 0.8)',
      popover: 'rgba(255, 255, 255, 0.9)',
      sheet: 'rgba(255, 255, 255, 0.95)'
    },
    
    // 暗色模式
    dark: {
      sidebar: 'rgba(30, 30, 30, 0.8)',
      menu: 'rgba(40, 40, 40, 0.8)',
      popover: 'rgba(50, 50, 50, 0.9)',
      sheet: 'rgba(28, 28, 30, 0.95)'
    }
  },
  
  // 模糊强度
  blur: {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '16px',
    xl: '24px',
    '2xl': '40px',
    '3xl': '64px'
  },
  
  // CSS滤镜
  filters: {
    vibrancy: 'blur(20px) saturate(180%)',
    subtle: 'blur(8px) saturate(120%)',
    strong: 'blur(32px) saturate(200%)'
  }
} as const;

// macOS设计令牌集合
export const macosDesignTokens = {
  colors: macosColors,
  typography: macosTypography,
  spacing: macosSpacing,
  borderRadius: macosBorderRadius,
  shadows: macosShadows,
  animation: macosAnimation,
  blur: macosBlur
} as const;

export type MacOSDesignTokens = typeof macosDesignTokens;
export type MacOSColorSystem = typeof macosColors;
export type MacOSTypography = typeof macosTypography;
