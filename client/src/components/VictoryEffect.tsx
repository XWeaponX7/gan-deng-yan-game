// client/src/components/VictoryEffect.tsx
// 胜利特效组件 - Phase 2 视觉特效

import { useEffect, useState } from 'react';

interface VictoryEffectProps {
  isVisible: boolean;
  playerName: string;
  isWinner: boolean;
}

const VictoryEffect: React.FC<VictoryEffectProps> = ({ isVisible, playerName, isWinner }) => {
  const [confettiPieces, setConfettiPieces] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);

  useEffect(() => {
    if (isVisible) {
      // 创建彩带效果
      const pieces = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        style: {
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 3}s`,
          animationDuration: `${3 + Math.random() * 2}s`,
          backgroundColor: [
            '#ff6b6b', '#4ecdc4', '#45b7d1', 
            '#f9ca24', '#6c5ce7', '#fd79a8', 
            '#00b894', '#e17055'
          ][Math.floor(Math.random() * 8)],
          width: `${8 + Math.random() * 6}px`,
          height: `${8 + Math.random() * 6}px`,
          borderRadius: Math.random() > 0.5 ? '50%' : '0%',
        }
      }));
      
      setConfettiPieces(pieces);

      // 3秒后清理
      const timeout = setTimeout(() => {
        setConfettiPieces([]);
      }, 5000);

      return () => clearTimeout(timeout);
    } else {
      // 当不可见时立即清理彩带
      setConfettiPieces([]);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* 彩带效果 */}
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti absolute"
          style={piece.style}
        />
      ))}
      
      {/* 胜利文字动画 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            {isWinner ? (
              <>
                <div className="text-6xl md:text-8xl font-bold text-yellow-400 animate-bounce drop-shadow-2xl">
                  🏆
                </div>
                <h2 className="text-4xl md:text-6xl font-bold text-white mt-4 animate-pulse drop-shadow-lg">
                  恭喜获胜！
                </h2>
                <p className="text-xl md:text-2xl text-yellow-300 mt-2 animate-pulse">
                  {playerName}，你太厉害了！
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl md:text-8xl font-bold text-blue-400 animate-bounce drop-shadow-2xl">
                  🎉
                </div>
                <h2 className="text-4xl md:text-6xl font-bold text-white mt-4 animate-pulse drop-shadow-lg">
                  游戏结束
                </h2>
                <p className="text-xl md:text-2xl text-blue-300 mt-2 animate-pulse">
                  {playerName} 获胜了！
                </p>
                <p className="text-lg text-gray-300 mt-1">
                  再接再厉！
                </p>
              </>
            )}
          </div>
          
          {/* 烟花效果 */}
          <div className="relative">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping`}
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${Math.random() * 50}px`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: '2s'
                }}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* 光环效果 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className={`w-96 h-96 rounded-full border-4 ${
            isWinner ? 'border-yellow-400' : 'border-blue-400'
          } opacity-50 animate-ping`}
          style={{ animationDuration: '3s' }}
        />
        <div 
          className={`absolute w-72 h-72 rounded-full border-2 ${
            isWinner ? 'border-yellow-300' : 'border-blue-300'
          } opacity-30 animate-ping`}
          style={{ animationDuration: '2s', animationDelay: '0.5s' }}
        />
      </div>
    </div>
  );
};

export default VictoryEffect; 