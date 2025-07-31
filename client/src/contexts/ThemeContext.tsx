// client/src/contexts/ThemeContext.tsx
// 主题上下文 - 管理深色/浅色模式切换

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // 从localStorage获取保存的主题，默认为深色模式
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('gan-deng-yan-theme') as ThemeMode;
      return savedTheme || 'dark';
    }
    return 'dark';
  });

  // 初始化时立即设置主题，避免闪烁
  useEffect(() => {
    const initialTheme = theme;
    document.documentElement.setAttribute('data-theme', initialTheme);
    localStorage.setItem('gan-deng-yan-theme', initialTheme);
  }, []); // 只在组件挂载时执行一次

  // 主题变化时更新document元素
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gan-deng-yan-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};