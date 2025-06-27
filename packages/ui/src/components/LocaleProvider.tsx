/**
 * 本地化提供者组件
 * Locale Provider Component
 */

import React from 'react';
import { LocaleContext, useLocaleSettings } from '../hooks/useLocale';

interface LocaleProviderProps {
  children: React.ReactNode;
}

export const LocaleProvider: React.FC<LocaleProviderProps> = ({ children }) => {
  const localeSettings = useLocaleSettings();

  return (
    <LocaleContext.Provider value={localeSettings}>
      {children}
    </LocaleContext.Provider>
  );
};

export default LocaleProvider;
