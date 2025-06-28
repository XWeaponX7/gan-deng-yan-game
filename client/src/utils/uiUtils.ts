// client/src/utils/uiUtils.ts
// UI工具函数 - Phase 1 增强功能

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
 * 为卡牌添加牌型识别动画
 * @param cardElement 卡牌DOM元素
 */
export const addCardTypeGlow = (cardElement: HTMLElement) => {
  cardElement.classList.add('card-type-glow');
  
  // 动画结束后移除类
  setTimeout(() => {
    cardElement.classList.remove('card-type-glow');
  }, 1500);
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
   Phase 2 视觉特效函数
   =================== */

/**
 * 为卡牌添加翻牌效果
 * @param cardElement 卡牌DOM元素
 */
export const addCardFlipEffect = (cardElement: HTMLElement) => {
  cardElement.classList.add('card-flip');
  
  // 动画结束后移除类
  setTimeout(() => {
    cardElement.classList.remove('card-flip');
  }, 600);
};

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
 * 为卡牌添加增强hover效果
 * @param cardElement 卡牌DOM元素
 */
export const addEnhancedHoverEffect = (cardElement: HTMLElement) => {
  cardElement.classList.add('card-enhanced-hover');
};

/**
 * 随机选择翻牌效果
 * @param cardElement 卡牌DOM元素
 */
export const addRandomCardEffect = (cardElement: HTMLElement) => {
  const effects = ['card-flip', 'card-type-glow'];
  const randomEffect = effects[Math.floor(Math.random() * effects.length)];
  
  if (randomEffect === 'card-flip') {
    addCardFlipEffect(cardElement);
  } else {
    addCardTypeGlow(cardElement);
  }
};

/* ===================
   Phase 3 复杂动画系统
   =================== */

/**
 * 复杂出牌飞行动画
 * @param element 卡牌元素
 */
export const triggerCardFlyToCenter = (element: HTMLElement): void => {
  element.style.animation = 'cardFlyToCenter 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';
  
  // 动画结束后的清理
  setTimeout(() => {
    element.style.animation = '';
    element.style.transform = '';
  }, 1500);
};

/**
 * 高级发牌动画 - 弧线轨迹
 * @param element 卡牌元素
 * @param delay 延迟时间(毫秒)
 */
export const triggerAdvancedDeal = (element: HTMLElement, delay: number = 0): void => {
  setTimeout(() => {
    element.style.animation = 'dealCardAdvanced 2s ease-out forwards';
    
    // 动画结束后清理
    setTimeout(() => {
      element.style.animation = '';
    }, 2000);
  }, delay);
};

/**
 * 创建粒子爆炸效果
 * @param element 中心元素
 * @param particleCount 粒子数量
 */
export const createParticleExplosion = (element: HTMLElement, particleCount: number = 20): void => {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.style.position = 'fixed';
    particle.style.left = `${centerX}px`;
    particle.style.top = `${centerY}px`;
    particle.style.width = '6px';
    particle.style.height = '6px';
    particle.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 60%)`;
    particle.style.borderRadius = '50%';
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '9999';
    
    // 随机方向和距离
    const angle = (Math.PI * 2 * i) / particleCount;
    const distance = 100 + Math.random() * 100;
    const finalX = centerX + Math.cos(angle) * distance;
    const finalY = centerY + Math.sin(angle) * distance;
    
    particle.style.animation = 'particleExplosion 1s ease-out forwards';
    particle.style.transform = `translate(${finalX - centerX}px, ${finalY - centerY}px)`;
    
    document.body.appendChild(particle);
    
    // 清理粒子
    setTimeout(() => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    }, 1000);
  }
};

/**
 * 卡牌摆动效果
 * @param element 卡牌元素
 */
export const triggerCardWobble = (element: HTMLElement): void => {
  element.style.animation = 'cardWobble 0.8s ease-in-out';
  
  setTimeout(() => {
    element.style.animation = '';
  }, 800);
};

/**
 * 弹性缩放动画
 * @param element 目标元素
 */
export const triggerElasticScale = (element: HTMLElement): void => {
  element.style.animation = 'elasticScale 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
  
  setTimeout(() => {
    element.style.animation = '';
  }, 600);
};

/**
 * 重力掉落效果
 * @param element 元素
 * @param delay 延迟时间
 */
export const triggerGravityDrop = (element: HTMLElement, delay: number = 0): void => {
  setTimeout(() => {
    element.style.animation = 'gravityDrop 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
    
    setTimeout(() => {
      element.style.animation = '';
    }, 1200);
  }, delay);
};

/**
 * 魔法光环效果
 * @param element 目标元素
 * @param duration 持续时间(毫秒)
 */
export const triggerMagicAura = (element: HTMLElement, duration: number = 3000): void => {
  element.style.animation = `magicAura 2s ease-in-out infinite`;
  
  setTimeout(() => {
    element.style.animation = '';
    element.style.boxShadow = '';
  }, duration);
};

/**
 * 组合动画：出牌时的复杂特效
 * @param element 卡牌元素
 */
export const triggerPlayCardCombo = (element: HTMLElement): void => {
  // 先摆动
  triggerCardWobble(element);
  
  // 然后粒子爆炸
  setTimeout(() => {
    createParticleExplosion(element, 15);
  }, 200);
  
  // 最后飞向中心
  setTimeout(() => {
    triggerCardFlyToCenter(element);
  }, 400);
};

/**
 * 物理引擎模拟：卡牌弹跳效果
 * @param element 卡牌元素
 */
export const createPhysicsBounce = (element: HTMLElement): void => {
  let position = 0;
  let velocity = -15; // 初始向上速度
  const gravity = 1; // 重力加速度
  const damping = 0.8; // 阻尼系数
  
  const animate = () => {
    velocity += gravity;
    position += velocity;
    
    // 碰到地面反弹
    if (position >= 0) {
      position = 0;
      velocity *= -damping;
      
      // 速度太小时停止
      if (Math.abs(velocity) < 0.5) {
        element.style.transform = '';
        return;
      }
    }
    
    element.style.transform = `translateY(${position}px)`;
    requestAnimationFrame(animate);
  };
  
  animate();
};

/**
 * 创建浮动魔法粒子
 * @param container 容器元素
 * @param count 粒子数量
 */
export const createFloatingParticles = (container: HTMLElement, count: number = 10): void => {
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.style.position = 'absolute';
    particle.style.width = '4px';
    particle.style.height = '4px';
    particle.style.backgroundColor = `hsl(${180 + Math.random() * 60}, 70%, 70%)`;
    particle.style.borderRadius = '50%';
    particle.style.pointerEvents = 'none';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = '100%';
    particle.style.opacity = '0.7';
    particle.style.animation = `gravityDrop ${2 + Math.random() * 2}s linear infinite`;
    particle.style.animationDelay = Math.random() * 2 + 's';
    
    container.appendChild(particle);
    
    // 5秒后清理粒子
    setTimeout(() => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    }, 5000);
  }
};

/**
 * 高级随机特效系统 - Phase 3版本
 * @param element 目标元素
 * @param intensity 特效强度 (1-5)
 */
export const triggerAdvancedRandomEffect = (element: HTMLElement, intensity: number = 3): void => {
  const effects = [
    () => triggerCardWobble(element),
    () => triggerElasticScale(element),
    () => createParticleExplosion(element, 10),
    () => triggerMagicAura(element, 2000),
    () => createPhysicsBounce(element),
    () => triggerPlayCardCombo(element)
  ];
  
  // 根据强度选择效果数量
  const effectCount = Math.min(intensity, 3);
  const selectedEffects = effects.sort(() => Math.random() - 0.5).slice(0, effectCount);
  
  selectedEffects.forEach((effect, index) => {
    setTimeout(() => effect(), index * 300);
  });
}; 