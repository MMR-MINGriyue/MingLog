/**
 * 语言选择器组件
 * Language Selector Component
 */

import React from 'react';
import { clsx } from 'clsx';
import { useLocale, getAvailableLocales, type SupportedLocale } from '../hooks/useLocale';

interface LanguageSelectorProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'dropdown' | 'toggle' | 'tabs';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className,
  size = 'md',
  showLabel = false,
  variant = 'dropdown',
}) => {
  const { locale, setLocale, t } = useLocale();
  const availableLocales = getAvailableLocales();

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3',
  };

  if (variant === 'dropdown') {
    return (
      <div className={clsx('relative', className)}>
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as SupportedLocale)}
          className={clsx(
            'appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600',
            'rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'text-gray-900 dark:text-gray-100',
            sizeClasses[size],
            className
          )}
        >
          {availableLocales.map((loc) => (
            <option key={loc.code} value={loc.code}>
              {showLabel ? `${loc.nativeName} (${loc.name})` : loc.nativeName}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  }

  if (variant === 'toggle') {
    const currentIndex = availableLocales.findIndex(loc => loc.code === locale);
    const nextLocale = availableLocales[(currentIndex + 1) % availableLocales.length];

    return (
      <button
        onClick={() => setLocale(nextLocale.code)}
        className={clsx(
          'inline-flex items-center justify-center rounded-md transition-colors',
          'text-gray-600 dark:text-gray-400',
          'hover:text-gray-900 dark:hover:text-gray-100',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          sizeClasses[size],
          className
        )}
        title={t('settings.language')}
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        {showLabel && (
          <span className="font-medium">
            {availableLocales.find(loc => loc.code === locale)?.nativeName}
          </span>
        )}
      </button>
    );
  }

  if (variant === 'tabs') {
    return (
      <div className={clsx('flex rounded-lg border border-gray-200 dark:border-gray-700', className)}>
        {availableLocales.map((loc, index) => (
          <button
            key={loc.code}
            onClick={() => setLocale(loc.code)}
            className={clsx(
              'flex-1 transition-colors font-medium',
              'first:rounded-l-lg last:rounded-r-lg',
              sizeClasses[size],
              locale === loc.code
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            )}
          >
            {showLabel ? `${loc.nativeName} (${loc.name})` : loc.nativeName}
          </button>
        ))}
      </div>
    );
  }

  return null;
};

// 简化的语言切换按钮
export const LanguageToggle: React.FC<{
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ className, size = 'md' }) => {
  return (
    <LanguageSelector
      className={className}
      size={size}
      variant="toggle"
      showLabel={false}
    />
  );
};

// 语言设置面板
export const LanguageSettings: React.FC<{
  className?: string;
}> = ({ className }) => {
  const { locale, setLocale, t } = useLocale();
  const availableLocales = getAvailableLocales();

  return (
    <div className={clsx('space-y-4', className)}>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('settings.language')}
        </label>
        <div className="space-y-2">
          {availableLocales.map((loc) => (
            <label key={loc.code} className="flex items-center">
              <input
                type="radio"
                name="language"
                value={loc.code}
                checked={locale === loc.code}
                onChange={(e) => setLocale(e.target.value as SupportedLocale)}
                className="mr-3 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {loc.nativeName}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {loc.name}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('settings.restartRequired')}
        </p>
      </div>
    </div>
  );
};

export default LanguageSelector;
