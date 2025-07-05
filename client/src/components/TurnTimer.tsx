// client/src/components/TurnTimer.tsx
// 轮次倒计时组件

import React, { useState, useEffect } from 'react';

interface TurnTimerProps {
  isMyTurn: boolean;
  turnStartTime: number | null;
  turnTimeLimit: number;
  onTimeout?: () => void;
}

const TurnTimer: React.FC<TurnTimerProps> = ({ 
  isMyTurn, 
  turnStartTime, 
  turnTimeLimit, 
  onTimeout 
}) => {
  const [remainingTime, setRemainingTime] = useState(turnTimeLimit);

  useEffect(() => {
    if (!turnStartTime) {
      setRemainingTime(turnTimeLimit);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = (now - turnStartTime) / 1000;
      const remaining = Math.max(0, turnTimeLimit - elapsed);
      
      setRemainingTime(remaining);

      // 如果时间到了且是我的回合，触发超时回调
      if (remaining <= 0 && isMyTurn && onTimeout) {
        onTimeout();
      }
    };

    // 立即更新一次
    updateTimer();

    // 每100ms更新一次，确保流畅的倒计时
    const interval = setInterval(updateTimer, 100);

    return () => clearInterval(interval);
  }, [turnStartTime, turnTimeLimit, isMyTurn, onTimeout]);

  // 如果没有开始计时，不显示
  if (!turnStartTime) {
    return null;
  }

  const percentage = (remainingTime / turnTimeLimit) * 100;
  const isUrgent = remainingTime <= 5; // 剩余5秒时显示紧急状态
  const isWarning = remainingTime <= 10; // 剩余10秒时显示警告状态

  return (
    <div className={`turn-timer ${isMyTurn ? 'my-turn' : 'other-turn'}`}>
      {/* 圆形进度条 */}
      <div className={`relative w-16 h-16 ${isMyTurn ? 'mx-auto' : ''}`}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          {/* 背景圆圈 */}
          <path
            className="text-gray-300 dark:text-gray-600"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          {/* 进度圆圈 */}
          <path
            className={`transition-all duration-100 ${
              isUrgent 
                ? 'text-red-500' 
                : isWarning 
                  ? 'text-yellow-500' 
                  : 'text-green-500'
            }`}
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${percentage}, 100`}
          />
        </svg>
        
        {/* 中心显示剩余时间 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-bold ${
            isUrgent 
              ? 'text-red-500 animate-pulse' 
              : isWarning 
                ? 'text-yellow-500' 
                : 'text-white'
          }`}>
            {Math.ceil(remainingTime)}
          </span>
        </div>
      </div>

      {/* 文字提示 */}
      {isMyTurn && (
        <div className="text-center mt-2">
          <p className={`text-xs ${
            isUrgent 
              ? 'text-red-400 animate-pulse font-bold' 
              : isWarning 
                ? 'text-yellow-400' 
                : 'text-white/80'
          }`}>
            {isUrgent ? '⚠️ 快出牌!' : isWarning ? '⏰ 时间不多了' : '⏱️ 思考中...'}
          </p>
        </div>
      )}
    </div>
  );
};

export default TurnTimer; 