import React from 'react';
import { ThemeContext, useThemeSettings } from '../hooks/useTheme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const themeSettings = useThemeSettings();

  return (
    <ThemeContext.Provider value={themeSettings}>
      {children}
    </ThemeContext.Provider>
  );
};
