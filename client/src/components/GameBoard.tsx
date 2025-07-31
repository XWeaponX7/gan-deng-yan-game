// client/src/components/GameBoard.tsx
// 游戏主界面组件 - 移动端UI优化版本

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Card, CardType } from '../types/game';
import { ClientCardUtils } from '../utils/cardUtils';
import VictoryEffect from './VictoryEffect';
import TurnTimer from './TurnTimer';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';
import { 
  createRippleEffect, 
  addTurnTransition, 
  createVictoryEffect,
  addVictoryCardAnimation,
  // 再玩一次特效
  triggerRematchButtonEffect
} from '../utils/uiUtils';

interface GameBoardProps {
  gameState: GameState | null;
  playerId: string;
  onPlayCards: (cards: Card[]) => void;
  onPass: () => void;
  onRequestRematch: () => void; // 新增：请求再玩一次
  turnTimeoutPlayerId?: string | null; // 新增：超时的玩家ID
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  gameState, 
  playerId, 
  onPlayCards, 
  onPass,
  onRequestRematch,
  turnTimeoutPlayerId
}) => {
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [showShortcutsInfo, setShowShortcutsInfo] = useState(false); // 新增：控制快捷键信息弹窗
  const currentTurnRef = useRef<number>(-1);
  const gameStatusRef = useRef<HTMLDivElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [isFirstRender, setIsFirstRender] = useState(true);
  const { theme } = useTheme(); // 获取当前主题

  // 提前定义所有hooks，避免条件渲染问题
  const currentPlayer = gameState?.players.find(p => p.id === playerId);
  const otherPlayers = gameState?.players.filter(p => p.id !== playerId) || [];
  const isMyTurn = gameState?.players[gameState.currentPlayerIndex]?.id === playerId;
  const currentTurnPlayer = gameState?.players[gameState.currentPlayerIndex];

  // 监听游戏阶段变化，添加特效
  useEffect(() => {
    if (!gameState) return;

    // 检测发牌（从waiting到playing的转换）
    if (gameState.phase === 'playing' && isFirstRender) {
      setIsFirstRender(false);
      
      // 增强版平滑发牌动画
      setTimeout(() => {
        if (currentPlayer?.cards) {
          currentPlayer.cards.forEach((card, index) => {
            const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
            if (cardElement instanceof HTMLElement) {
              // 增强的发牌动画效果
              cardElement.style.opacity = '0';
              cardElement.style.transform = 'translateY(50px) scale(0.8) rotateX(-15deg)';
              cardElement.style.filter = 'blur(3px)';
              
              setTimeout(() => {
                cardElement.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                cardElement.style.opacity = '1';
                cardElement.style.transform = 'translateY(0) scale(1) rotateX(0deg)';
                cardElement.style.filter = 'blur(0px)';
                
                // 清理内联样式
                setTimeout(() => {
                  cardElement.style.transition = '';
                  cardElement.style.transform = '';
                  cardElement.style.filter = '';
                }, 600);
              }, index * 100); // 每张卡延迟100ms
            }
          });
        }
      }, 100);
    }

    // 检测游戏结束，添加胜利特效
    if (gameState.phase === 'finished' && gameState.winner) {
      setTimeout(() => {
        if (gameContainerRef.current) {
          createVictoryEffect(gameContainerRef.current);
        }
        
        // 如果我是获胜者，为我的卡牌添加胜利动画
        if (gameState.winner === playerId && currentPlayer?.cards) {
          const cardElements = currentPlayer.cards.map(card => 
            document.querySelector(`[data-card-id="${card.id}"]`)
          ).filter(element => element instanceof HTMLElement) as HTMLElement[];
          
          if (cardElements.length > 0) {
            addVictoryCardAnimation(cardElements);
          }
        }
      }, 500);
    }
  }, [gameState, playerId, currentPlayer?.cards, isFirstRender]);

  // 监听轮次变化，添加动画效果
  useEffect(() => {
    if (gameState && gameState.currentPlayerIndex !== currentTurnRef.current) {
      currentTurnRef.current = gameState.currentPlayerIndex;
      
      // 添加轮次切换动画
      if (gameStatusRef.current) {
        addTurnTransition(gameStatusRef.current);
      }
    }
  }, [gameState]);

  // 监听选中卡牌变化的效果已移除，保持简洁

  // 选择/取消选择卡牌 - 增强动画反馈
  const toggleCardSelection = useCallback((card: Card) => {
    const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
    
    setSelectedCards(prev => {
      const isSelected = prev.find(c => c.id === card.id);
      
      // 添加即时视觉反馈
      if (cardElement instanceof HTMLElement) {
        // 移除之前的动画类
        cardElement.classList.remove('card-quick-select-instant');
        
        // 强制重绘，然后添加动画类
        void cardElement.offsetWidth;
        cardElement.classList.add('card-quick-select-instant');
        
        // 清理动画类
        setTimeout(() => {
          cardElement.classList.remove('card-quick-select-instant');
        }, 80);
      }
      
      if (isSelected) {
        return prev.filter(c => c.id !== card.id);
      } else {
        return [...prev, card];
      }
    });
  }, []);

  // 出牌 - 简化版：立即响应，无复杂动画
  const handlePlayCards = useCallback(() => {
    if (selectedCards.length === 0) return;
    
    // 立即执行出牌，无动画延迟
    onPlayCards(selectedCards);
    setSelectedCards([]);
  }, [selectedCards, onPlayCards]);

  // 带ripple效果的按钮点击处理
  const handleButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    action: () => void
  ) => {
    createRippleEffect(event);
    action();
  };

  // 处理倒计时超时
  const handleTurnTimeout = useCallback(() => {
    if (!isMyTurn) return;
    
    if (gameState?.lastPlay) {
      // 如果有上一次出牌，自动过牌
      // 倒计时结束，自动过牌
      onPass();
    } else {
      // 如果没有上一次出牌（首出），随机出一张牌
      // 倒计时结束，自动出牌
      if (currentPlayer?.cards && currentPlayer.cards.length > 0) {
        // 选择一张最小的单牌
        const sortedCards = [...currentPlayer.cards].sort((a, b) => a.value - b.value);
        const cardToPlay = sortedCards[0];
        onPlayCards([cardToPlay]);
      }
    }
  }, [isMyTurn, gameState?.lastPlay, onPass, onPlayCards, currentPlayer?.cards]);

  // 全选同点数牌
  const selectSameRankCards = useCallback((targetCard: Card) => {
    if (!currentPlayer?.cards) return;
    
    const sameRankCards = currentPlayer.cards.filter(card => 
      card.rank === targetCard.rank && !selectedCards.some(selected => selected.id === card.id)
    );
    
    setSelectedCards(prev => [...prev, ...sameRankCards]);
  }, [currentPlayer?.cards, selectedCards]);

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // 只在轮到玩家时响应键盘事件
      if (!isMyTurn || gameState?.phase !== 'playing') return;

      switch (event.key.toLowerCase()) {
        case 'enter':
        case ' ':
          // 空格键或回车键出牌
          event.preventDefault();
          if (selectedCards.length > 0) {
            handlePlayCards();
          }
          break;
        case 'escape':
          // ESC键清空选择
          event.preventDefault();
          setSelectedCards([]);
          break;
        case 'p':
          // P键过牌
          event.preventDefault();
          if (gameState?.lastPlay) {
            onPass();
          }
          break;
        case 'a':
          // A键全选（仅在没有选中卡牌时）
          event.preventDefault();
          if (selectedCards.length === 0 && currentPlayer?.cards) {
            setSelectedCards([...currentPlayer.cards]);
          } else {
            setSelectedCards([]);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isMyTurn, gameState?.phase, gameState?.lastPlay, selectedCards, handlePlayCards, onPass, currentPlayer?.cards]);

  // 如果没有游戏状态，显示等待界面
  if (!gameState) {
    // 等待游戏状态
    return (
      <div className="game-background min-h-screen flex items-center justify-center">
        <div className="glass-panel p-8 text-center max-w-md">
          <div className="loading-spinner h-16 w-16 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-2">🎮 干瞪眼对战</h2>
          <p className="text-lg text-white/90 mb-2">正在连接游戏...</p>
          <p className="text-sm text-white/70 mb-4">请稍候，正在建立连接</p>
          
          {/* 骨架屏预览 */}
          <div className="space-y-4 mt-6">
            <div className="skeleton h-4 w-3/4 mx-auto rounded"></div>
            <div className="skeleton h-4 w-1/2 mx-auto rounded"></div>
            <div className="flex justify-center space-x-2 mt-4">
              <div className="skeleton h-8 w-16 rounded"></div>
              <div className="skeleton h-8 w-16 rounded"></div>
              <div className="skeleton h-8 w-16 rounded"></div>
            </div>
          </div>
          
          {/* 连接状态信息 */}
          <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
            <p className="text-xs text-white/60 mb-2">连接状态</p>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">玩家ID:</span>
                <span className="text-white font-mono">{playerId || '连接中...'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/70">游戏状态:</span>
                <span className="text-yellow-400">等待中</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="btn-enhanced btn-primary text-sm px-4 py-2"
            >
              🔄 刷新重试
            </button>
            <p className="text-xs text-white/50">
              💡 如果长时间无响应，点击刷新重试
            </p>
          </div>
        </div>
      </div>
    );
  }

  // GameBoard render - debug info available in development

  // 渲染卡牌 - 增强版本
  const renderCard = (card: Card, isSelected: boolean, onClick?: () => void) => {
    // 双击选择同点数牌 - 增强反馈版
    const handleDoubleClick = (event: React.MouseEvent) => {
      event.preventDefault();
      if (onClick) {
        // 添加双击特效
        const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
        if (cardElement instanceof HTMLElement) {
          cardElement.style.animation = 'elasticScale 0.4s ease-out';
          setTimeout(() => {
            if (cardElement) {
              cardElement.style.animation = '';
            }
          }, 400);
        }
        
        selectSameRankCards(card);
      }
    };

    // 单击时的处理 - 流畅动画版
    const handleClick = () => {
      if (onClick) {
        // 添加点击反馈动画
        const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
        if (cardElement instanceof HTMLElement) {
          // 添加点击波纹效果
          cardElement.style.transform = 'scale(0.95)';
          cardElement.style.transition = 'transform 0.08s ease-out';
          
          setTimeout(() => {
            cardElement.style.transform = '';
            cardElement.style.transition = '';
          }, 80);
        }
        
        onClick();
      }
    };
    const getCardColor = (card: Card) => {
      const isLightTheme = theme === 'light';
      
      if (card.suit === 'joker') {
        return isLightTheme ? 'text-purple-700 font-extrabold' : 'text-purple-400 font-extrabold';
      }
      if (card.suit === 'hearts' || card.suit === 'diamonds') {
        return isLightTheme ? 'text-red-700 font-bold' : 'text-red-400 font-bold';
      }
      return isLightTheme ? 'text-gray-800 font-semibold' : 'text-gray-200 font-semibold';
    };

    const isSpecial = ClientCardUtils.isSpecialCard(card);
    const isNumber2 = card.rank === '2';
    const cardType = ClientCardUtils.identifyCardType([card]);
    const isBomb = cardType ? ClientCardUtils.isBomb(cardType) : false;

    // 确定卡牌样式类
    const getCardClasses = () => {
      let classes = `card w-14 h-20 `;
      
      if (isSelected) {
        classes += 'selected ';
      }
      if (isSpecial) {
        classes += 'special ';
      }
      if (isBomb) {
        classes += 'bomb ';
      }
      if (isNumber2) {
        classes += 'number-two ';
      }
      
      classes += getCardColor(card);
      return classes;
    };

          return (
        <div
          key={card.id}
          data-card-id={card.id}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          className={getCardClasses()}
          title={`${card.display} - 单击选择，双击选择所有${card.rank}`}
        >
        <span className="relative z-10 drop-shadow-sm">
          {card.display}
        </span>
        
        {/* 特殊牌星星标识 */}
        {isSpecial && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-xs font-bold">★</span>
          </div>
        )}
        
        {/* 数字2的火焰标识 */}
        {isNumber2 && (
          <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white text-xs">🔥</span>
          </div>
        )}

        {/* 炸弹特效 */}
        {isBomb && !isSpecial && (
          <div className="absolute -top-1 -left-1 w-4 h-4 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white text-xs">💥</span>
          </div>
        )}

        {/* 卡牌光泽效果 */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent rounded-xl pointer-events-none"></div>
      </div>
    );
  };

  return (
    <div 
      ref={gameContainerRef}
      className="game-background min-h-screen p-2 sm:p-4 relative overflow-hidden flex justify-center"
    >
      {/* 游戏主容器 - 响应式最大宽度并居中 */}
      <div className="w-full max-w-sm sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl flex flex-col">
        {/* 游戏状态栏 - 压缩高度 */}
        <div className="glass-panel p-3 sm:p-4 mb-2 sm:mb-4 flex-shrink-0 rounded-xl">
        <div className="flex justify-between items-center text-white">
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              🃏 干瞪眼对战
            </h2>
              <div className="flex gap-4 text-xs sm:text-sm opacity-80 mt-1">
                <span className="font-mono bg-white/20 px-2 py-0.5 rounded">ID: {gameState.gameId}</span>
            {gameState.deckCount !== undefined && (
                  <span className="text-cyan-300">📚 剩余: {gameState.deckCount}</span>
                )}
              </div>
            </div>

            {/* 中间显示倒计时 */}
            {gameState.phase === 'playing' && (
              <div className="flex-shrink-0 mx-4">
                {/* 调试信息 */}
                {typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
                  <div className="text-xs text-white/50 mb-1">
                    Timer: {gameState.turnStartTime ? 'ON' : 'OFF'} | 
                    Limit: {gameState.turnTimeLimit || 'N/A'}s | 
                    MyTurn: {isMyTurn ? 'YES' : 'NO'}
                  </div>
                )}
                
                {gameState.turnStartTime && gameState.turnTimeLimit ? (
                  <TurnTimer
                    isMyTurn={isMyTurn}
                    turnStartTime={gameState.turnStartTime}
                    turnTimeLimit={gameState.turnTimeLimit}
                    onTimeout={handleTurnTimeout}
                  />
                ) : (
                  <div className="w-16 h-16 flex items-center justify-center text-white/60 text-xs">
                    ⏱️
                  </div>
                )}
              </div>
            )}

            <div className="text-right flex-shrink-0 flex items-center gap-2">
              {/* 主题切换按钮 */}
              <ThemeToggle size="sm" className="hidden sm:block" />
              
              <div 
                ref={gameStatusRef}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border-2 transition-all text-xs sm:text-sm ${
              gameState.phase === 'waiting' ? 'border-yellow-400 bg-yellow-500/20' :
              gameState.phase === 'playing' ? (isMyTurn ? 'border-green-400 bg-green-500/20 animate-pulse' : 'border-blue-400 bg-blue-500/20') :
              'border-purple-400 bg-purple-500/20'
                }`}
              >
                <p className="font-semibold">
                {gameState.phase === 'waiting' && '⏳ 等待开始'}
                {gameState.phase === 'playing' && (isMyTurn ? '🎯 轮到你了' : '⏸️ 对手回合')}
                {gameState.phase === 'finished' && '🏁 游戏结束'}
              </p>
            </div>
            {gameState.winner && (
                <div className="mt-2 p-2 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/50">
                  <p className="text-sm font-bold">
                    {gameState.winner === playerId ? '🏆 你赢了!' : '😅 对手获胜'}
                </p>
                </div>
              )}

              {/* 超时提示 */}
              {turnTimeoutPlayerId && (
                <div className="mt-2 p-2 rounded-lg bg-orange-500/20 border border-orange-400/50">
                  <p className="text-xs text-orange-300">
                    ⏰ {gameState.players.find(p => p.id === turnTimeoutPlayerId)?.name || '玩家'} 出牌超时
                </p>
              </div>
            )}
            
              {/* 再玩一次按钮 - 压缩版 */}
            {gameState.phase === 'finished' && (
                <div className="mt-2 p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/50">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-white text-xs">想要再来一局吗？</p>
                  
                  {!gameState.players.find(p => p.id === playerId)?.wantsRematch ? (
                    <button
                        onClick={(e) => {
                          triggerRematchButtonEffect(e.currentTarget);
                          handleButtonClick(e, onRequestRematch);
                        }}
                        className="btn-enhanced btn-primary text-xs px-4 py-1"
                    >
                      🔄 再玩一次
                    </button>
                  ) : (
                      <div className="text-green-400 text-xs animate-pulse">
                      ✅ 等待对手确认...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

        {/* 其他玩家信息区域 - 支持多人显示 */}
        <div className="glass-panel p-3 mb-2 sm:mb-3 flex-shrink-0 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-white font-bold text-sm">
              👥 其他玩家 ({otherPlayers.length}人)
          </h3>
            {gameState?.maxPlayers && (
            <div className="text-right">
                <p className="text-white/80 text-xs">
                  房间: {gameState.players.length}/{gameState.maxPlayers}
                </p>
            </div>
          )}
        </div>
        
          {/* 多人玩家列表 */}
          <div className="space-y-2">
            {otherPlayers.length > 0 ? (
              otherPlayers.map((player) => {
                const isCurrentTurn = currentTurnPlayer?.id === player.id;
                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                      isCurrentTurn 
                        ? 'bg-green-500/20 border border-green-400/50 animate-pulse' 
                        : 'bg-white/10 border border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-lg ${isCurrentTurn ? '🎯' : '👤'}`}>
                        {isCurrentTurn ? '🎯' : '👤'}
                      </span>
                      <div>
                        <p className={`font-medium text-sm ${
                          isCurrentTurn ? 'text-green-300' : 'text-white'
                        }`}>
                          {player.name}
                          {isCurrentTurn && (
                            <span className="ml-1 text-xs text-green-400 animate-pulse">
                              (出牌中)
                            </span>
                          )}
                        </p>
                        {player.cardCount <= 3 && player.cardCount > 0 && (
                          <p className="text-red-400 text-xs font-bold animate-pulse">
                            🚨 剩余{player.cardCount}张！
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-xs font-bold ${
                        player.cardCount <= 3 ? 'text-red-300' : 'text-white/80'
                      }`}>
                        {player.cardCount} 张
                      </p>
                      {/* 显示部分手牌背面 */}
                      <div className="flex gap-0.5 mt-1 justify-end">
                        {Array.from({ length: Math.min(player.cardCount, 5) }, (_, i) => (
              <div
                key={i}
                            className="w-3 h-4 bg-gradient-to-br from-blue-500 to-blue-700 rounded-sm border border-blue-400/50 shadow-sm"
                style={{
                              transform: `rotate(${(Math.random() - 0.5) * 10}deg) translateY(${i * -2}px)`,
                              zIndex: 5 - i
                }}
                            title={`${player.name} 剩余 ${player.cardCount} 张牌`}
                          />
                        ))}
                        {player.cardCount > 5 && (
                          <div className="w-3 h-4 flex items-center justify-center text-white/60 text-xs">
                            +{player.cardCount - 5}
                          </div>
                        )}
                      </div>
                    </div>
              </div>
                );
              })
          ) : (
              <div className="p-4 text-center">
                <p className="text-white/60 text-sm">🔍 等待其他玩家加入...</p>
            </div>
          )}
        </div>
      </div>

        {/* 上次出牌区域 - 重点显示，增加高度 */}
        <div className="glass-panel p-3 mb-2 sm:mb-3 flex-1 min-h-0 border-2 border-yellow-400/30 rounded-xl">
          <h3 className="text-white font-bold mb-2 text-sm">🎯 上次出牌</h3>
        {gameState.lastPlay ? (
            <div className="h-full flex flex-col">
              <div className="flex gap-1 mb-2 flex-wrap justify-center">
              {gameState.lastPlay.cards.map(card => 
                renderCard(card, false)
              )}
            </div>
              <div className="text-white text-sm flex-1">
                <p className="text-center mb-2">
                  <span className="text-white/80">{gameState.players.find(p => p.id === gameState.lastPlay?.playerId)?.name}</span>
                  {' '}出了{' '}
                  <span className={`font-bold ${ClientCardUtils.getCardTypeColor(gameState.lastPlay.type)}`}>
                  {ClientCardUtils.getCardTypeName(gameState.lastPlay.type)}
                </span>
              </p>
                {/* 策略提示 - 更突出显示 */}
              {gameState.lastPlay.type === CardType.SINGLE && gameState.lastPlay.cards[0]?.rank === '2' && (
                  <p className="mt-1 text-orange-300 text-xs text-center p-2 bg-orange-500/20 rounded border border-orange-400/50">
                  🔥 对方出了2，只能用大小王或炸弹压制
                </p>
              )}
              {gameState.lastPlay.type === CardType.JOKER_BOMB && (
                  <p className="mt-1 text-purple-300 text-xs text-center p-2 bg-purple-500/20 rounded border border-purple-400/50">
                  👑 对方出了王炸，无法压制
                </p>
              )}
              {ClientCardUtils.isBomb(gameState.lastPlay.type) && gameState.lastPlay.type !== CardType.JOKER_BOMB && (
                  <p className="mt-1 text-red-300 text-xs text-center p-2 bg-red-500/20 rounded border border-red-400/50">
                  💥 对方出了炸弹，需要更大的炸弹才能压制
                </p>
              )}
            </div>
          </div>
        ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-white/60 text-sm">等待首出...</p>
            </div>
        )}
      </div>

        {/* 游戏控制按钮 - 紧凑设计 */}
      {gameState.phase === 'playing' && isMyTurn && (
          <div className="glass-panel p-3 mb-2 flex-shrink-0 relative rounded-xl">
            <div className="flex gap-2 mb-2">
            <button
                onClick={(e) => {
                  if (selectedCards.length > 0) {
                    handleButtonClick(e, handlePlayCards);
                  }
                }}
              disabled={selectedCards.length === 0}
                className={`btn-enhanced flex-1 text-sm py-2 ${selectedCards.length === 0 ? 'btn-disabled' : 'btn-primary'}`}
            >
              🚀 出牌 ({selectedCards.length})
            </button>
            <button
                onClick={(e) => {
                  if (gameState.lastPlay) {
                    handleButtonClick(e, onPass);
                  }
                }}
              disabled={!gameState.lastPlay}
                className={`btn-enhanced flex-1 text-sm py-2 ${!gameState.lastPlay ? 'btn-disabled' : 'btn-danger'}`}
            >
              ⏭️ 过牌
            </button>
          
              {/* 快捷键信息按钮 - 美化版 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowShortcutsInfo(!showShortcutsInfo);
                }}
                className="btn-enhanced bg-gradient-to-br from-blue-500/80 to-purple-600/80 hover:from-blue-400/90 hover:to-purple-500/90 border border-blue-400/50 hover:border-blue-300/70 w-10 h-10 flex items-center justify-center text-sm font-bold text-white hover:text-blue-100 transition-all duration-200 rounded-xl shadow-lg hover:shadow-blue-500/25 relative overflow-hidden group"
                title="查看快捷键和操作说明"
              >
                <span className="relative z-10">❓</span>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </button>
              
              {/* 主题切换按钮 - 移动端显示 */}
              <ThemeToggle size="sm" className="sm:hidden" title="切换主题" />
          </div>

          {selectedCards.length > 0 && (
              <div className="text-white text-xs">
                <p className="mb-1">已选择: {selectedCards.map(c => c.display).join(', ')}</p>
              {(() => {
                const cardType = ClientCardUtils.identifyCardType(selectedCards);
                if (cardType) {
                  return (
                      <p className={`font-bold ${ClientCardUtils.getCardTypeColor(cardType)}`}>
                        牌型: {ClientCardUtils.getCardTypeName(cardType)}
                      </p>
                  );
                } else {
                  return (
                      <p className="text-red-400 font-bold">无效牌型</p>
                  );
                }
              })()}
            </div>
          )}
            
            {/* 快捷键信息弹窗 - 修复为固定定位并提高z-index */}
            {showShortcutsInfo && (
              <div className="fixed inset-0 flex items-center justify-center z-[9999] px-4">
                <div className="glass-panel p-4 border border-white/20 shadow-xl w-full max-w-sm">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-white font-bold text-sm">⌨️ 快捷键说明</h4>
                    <button
                      onClick={() => setShowShortcutsInfo(false)}
                      className="text-white/60 hover:text-white text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-white/80">出牌</span>
                      <div className="flex gap-1">
                        <kbd className="bg-white/20 text-white px-2 py-1 rounded text-xs">空格</kbd>
                        <kbd className="bg-white/20 text-white px-2 py-1 rounded text-xs">回车</kbd>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center py-1">
                      <span className="text-white/80">过牌</span>
                      <kbd className="bg-white/20 text-white px-2 py-1 rounded text-xs">P</kbd>
                    </div>
                    
                    <div className="flex justify-between items-center py-1">
                      <span className="text-white/80">全选/取消</span>
                      <kbd className="bg-white/20 text-white px-2 py-1 rounded text-xs">A</kbd>
                    </div>
                    
                    <div className="flex justify-between items-center py-1">
                      <span className="text-white/80">清空选择</span>
                      <kbd className="bg-white/20 text-white px-2 py-1 rounded text-xs">ESC</kbd>
                    </div>
                    
                    <div className="border-t border-white/20 pt-2 mt-3">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-white/80">单击卡牌</span>
                        <span className="text-white/60 text-xs">选择/取消</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-1">
                        <span className="text-white/80">双击卡牌</span>
                        <span className="text-white/60 text-xs">选择同点数</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-2 border-t border-white/20">
                    <p className="text-white/50 text-xs text-center">
                      💡 在桌面端可使用键盘快捷键
                    </p>
                  </div>
                </div>
              </div>
            )}
        </div>
      )}

        {/* 点击其他区域时关闭快捷键弹窗 - 更新z-index */}
        {showShortcutsInfo && (
          <div 
            className="fixed inset-0 z-[9998] bg-black/50" 
            onClick={() => setShowShortcutsInfo(false)}
          />
        )}

        {/* 我的手牌 - 重点区域，确保充足空间 */}
        <div className="glass-panel p-3 flex-1 min-h-0 border-2 border-green-400/30 overflow-hidden rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-white font-bold text-sm">🎲 我的手牌: {currentPlayer?.name}</h3>
          <div className="text-right">
              <p className="text-white/80 text-xs">
              剩余 {currentPlayer?.cards?.length || 0} 张牌
            </p>
            {currentPlayer?.cards && currentPlayer.cards.length <= 3 && currentPlayer.cards.length > 0 && (
              <p className="text-yellow-400 text-xs font-bold animate-pulse">
                ⚠️ 警报！剩余牌数过少
              </p>
            )}
          </div>
        </div>
        
          <div className="flex flex-wrap gap-1 sm:gap-2 min-h-20 pt-6 pb-3 px-3 bg-white/5 backdrop-blur border border-white/10 flex-1 overflow-hidden relative" style={{borderRadius: '8px', margin: '4px'}}>
          {currentPlayer?.cards && currentPlayer.cards.length > 0 ? (
              currentPlayer.cards.map((card) => 
              renderCard(
                card, 
                selectedCards.some(c => c.id === card.id),
                gameState.phase === 'playing' && isMyTurn ? 
                  () => toggleCardSelection(card) : undefined
              )
            )
          ) : (
            <div className="w-full h-20 flex items-center justify-center">
                <p className="text-white/60 text-sm text-center">
                {gameState.phase === 'waiting' ? (
                  <span>🃏 等待发牌...</span>
                ) : (
                  <span>🎉 恭喜！所有手牌已出完</span>
                )}
              </p>
            </div>
          )}
        </div>
        
        {/* 手牌提示 */}
        {isMyTurn && currentPlayer?.cards && currentPlayer.cards.length > 0 && (
            <div className="mt-2 text-xs text-white/60 text-center">
              💡 单击选择卡牌，双击选择所有相同点数的牌
          </div>
        )}
        </div>
        
        {/* 胜利特效 */}
        <VictoryEffect 
          isVisible={gameState?.phase === 'finished' && !!gameState.winner}
          playerName={gameState?.winner === playerId ? currentPlayer?.name || '你' : 
            gameState?.players.find(p => p.id === gameState.winner)?.name || '对手'}
          isWinner={gameState?.winner === playerId}
        />
      </div>
    </div>
  );
};

export default GameBoard; 