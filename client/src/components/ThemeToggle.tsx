// client/src/components/ThemeToggle.tsx
// 主题切换按钮组件 - 支持深色/浅色模式切换

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { createRippleEffect } from '../utils/uiUtils';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  title?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  size = 'md',
  title 
}) => {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    createRippleEffect(e);
    toggleTheme();
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        btn-enhanced theme-toggle-btn
        ${sizeClasses[size]}
        bg-gradient-to-br from-purple-500/80 to-pink-600/80 
        hover:from-purple-400/90 hover:to-pink-500/90
        border border-purple-400/50 hover:border-purple-300/70
        flex items-center justify-center font-bold text-white 
        hover:text-purple-100 transition-all duration-300
        rounded-xl shadow-lg hover:shadow-purple-500/25
        relative overflow-hidden group
        ${className}
      `}
      title={title || `切换到${theme === 'dark' ? '浅色' : '深色'}模式`}
      aria-label={title || `切换到${theme === 'dark' ? '浅色' : '深色'}模式`}
    >
      {/* 图标 */}
      <span className="relative z-10 transition-transform duration-300 group-hover:scale-110">
        {theme === 'dark' ? '☀️' : '🌙'}
      </span>
      
      {/* 悬停光泽效果 */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
      
      {/* 切换动画指示器 */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/30 rounded-xl transition-all duration-200"></div>
    </button>
  );
};

export default ThemeToggle;