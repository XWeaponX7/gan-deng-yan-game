// client/src/utils/uiUtils.ts
// UI工具函数 - 优化版本

import React from 'react';

/**
 * 为按钮添加ripple效果
 * @param event 鼠标点击事件
 */
export const createRippleEffect = (event: React.MouseEvent<HTMLButtonElement>) => {
  const button = event.currentTarget;
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  
  // 创建ripple元素
  const ripple = document.createElement('span');
  ripple.classList.add('ripple');
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  
  // 添加到按钮中
  button.appendChild(ripple);
  
  // 动画结束后移除元素
  setTimeout(() => {
    if (ripple.parentNode) {
      ripple.parentNode.removeChild(ripple);
    }
  }, 600);
};

/**
 * 为卡牌添加牌型识别动画 - 优化版
 * @param cardElement 卡牌DOM元素
 */
export const addCardTypeGlow = (cardElement: HTMLElement) => {
  cardElement.classList.add('card-type-glow');
  
  // 动画结束后移除类 - 配合缩短的动画时间
  setTimeout(() => {
    cardElement.classList.remove('card-type-glow');
  }, 400);
};

/**
 * 添加轮次切换动画
 * @param element 要添加动画的元素
 */
export const addTurnTransition = (element: HTMLElement) => {
  element.classList.add('turn-transition');
  
  // 动画结束后移除类
  setTimeout(() => {
    element.classList.remove('turn-transition');
  }, 500);
};

/**
 * 创建骨架屏元素
 * @param className 额外的CSS类名
 */
export const createSkeletonElement = (className: string = '') => {
  return `skeleton ${className}`;
};

/**
 * 防抖函数 - 防止重复点击
 * @param func 要防抖的函数
 * @param delay 延迟时间（毫秒）
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: number;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * 节流函数 - 限制函数执行频率
 * @param func 要节流的函数
 * @param limit 时间限制（毫秒）
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/* ===================
   核心动画函数 - 优化版
   =================== */

/**
 * 为卡牌添加发牌动画
 * @param cardElement 卡牌DOM元素
 * @param delay 延迟时间（毫秒）
 */
export const addDealCardAnimation = (cardElement: HTMLElement, delay: number = 0) => {
  setTimeout(() => {
    cardElement.classList.add('card-dealing');
    
    // 动画结束后移除类
    setTimeout(() => {
      cardElement.classList.remove('card-dealing');
    }, 800);
  }, delay);
};

/**
 * 创建胜利庆祝效果
 * @param containerElement 容器元素
 */
export const createVictoryEffect = (containerElement: HTMLElement) => {
  // 添加彩带效果
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.classList.add('confetti');
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.animationDelay = Math.random() * 3 + 's';
    containerElement.appendChild(confetti);
    
    // 3秒后移除彩带
    setTimeout(() => {
      if (confetti.parentNode) {
        confetti.parentNode.removeChild(confetti);
      }
    }, 3000);
  }
};

/**
 * 为获胜玩家的卡牌添加胜利动画
 * @param cardElements 卡牌DOM元素数组
 */
export const addVictoryCardAnimation = (cardElements: HTMLElement[]) => {
  cardElements.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add('victory-card');
    }, index * 100);
  });
  
  // 5秒后移除动画
  setTimeout(() => {
    cardElements.forEach(card => {
      card.classList.remove('victory-card');
    });
  }, 5000);
};

/**
 * 为出牌添加飞行动画
 * @param cardElement 卡牌DOM元素
 */
export const addCardFlyOutEffect = (cardElement: HTMLElement) => {
  cardElement.classList.add('card-fly-out');
  
  // 动画结束后隐藏元素
  setTimeout(() => {
    cardElement.style.visibility = 'hidden';
  }, 1000);
};

/**
 * 快速选择效果 - 极短的视觉反馈，立即响应
 * @param element 卡牌元素
 */
export const triggerQuickSelect = (element: HTMLElement): void => {
  // 使用CSS动画类，更快更流畅
  element.classList.add('card-quick-select-instant');
  
  // 60ms后移除类
  setTimeout(() => {
    element.classList.remove('card-quick-select-instant');
  }, 60);
};

/**
 * 再玩一次按钮特效 - 立即反馈
 * @param element 按钮元素
 */
export const triggerRematchButtonEffect = (element: HTMLElement): void => {
  // 立即视觉反馈
  element.style.transform = 'scale(0.95)';
  element.style.transition = 'all 0.1s ease';
  
  // 快速恢复并添加成功效果
  setTimeout(() => {
    element.style.transform = 'scale(1.02)';
    element.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    
    // 添加粒子效果
    const rect = element.getBoundingClientRect();
    for (let i = 0; i < 8; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'fixed';
      particle.style.left = rect.left + rect.width / 2 + 'px';
      particle.style.top = rect.top + rect.height / 2 + 'px';
      particle.style.width = '4px';
      particle.style.height = '4px';
      particle.style.backgroundColor = '#10b981';
      particle.style.borderRadius = '50%';
      particle.style.pointerEvents = 'none';
      particle.style.zIndex = '9999';
      
      const angle = (Math.PI * 2 * i) / 8;
      const distance = 50;
      const finalX = Math.cos(angle) * distance;
      const finalY = Math.sin(angle) * distance;
      
      particle.style.transition = 'all 0.5s ease-out';
      particle.style.transform = `translate(${finalX}px, ${finalY}px)`;
      particle.style.opacity = '0';
      
      document.body.appendChild(particle);
      
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 500);
    }
  }, 100);
  
  // 恢复原状
  setTimeout(() => {
    element.style.transform = '';
    element.style.background = '';
    element.style.transition = '';
  }, 600);
}; 