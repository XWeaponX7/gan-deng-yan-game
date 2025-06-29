// client/src/components/GameBoard.tsx
// 游戏主界面组件 - 移动端UI优化版本

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Card, CardType } from '../types/game';
import { ClientCardUtils } from '../utils/cardUtils';
import VictoryEffect from './VictoryEffect';
import { 
  createRippleEffect, 
  addCardTypeGlow, 
  addTurnTransition, 
  debounce,
  createVictoryEffect,
  addVictoryCardAnimation,
  addEnhancedHoverEffect,
  // Phase 3 新增函数
  triggerAdvancedDeal,
  createParticleExplosion,
  triggerCardWobble,
  triggerQuickSelect,
  triggerElasticScale,
  triggerGravityDrop,
  triggerMagicAura,
  triggerPlayCardCombo,
  createFloatingParticles,
  // 再玩一次特效
  triggerRematchButtonEffect
} from '../utils/uiUtils';

interface GameBoardProps {
  gameState: GameState | null;
  playerId: string;
  onPlayCards: (cards: Card[]) => void;
  onPass: () => void;
  onRequestRematch: () => void; // 新增：请求再玩一次
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  gameState, 
  playerId, 
  onPlayCards, 
  onPass,
  onRequestRematch
}) => {
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [lastSelectedCardType, setLastSelectedCardType] = useState<CardType | null>(null);
  const currentTurnRef = useRef<number>(-1);
  const gameStatusRef = useRef<HTMLDivElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [isFirstRender, setIsFirstRender] = useState(true);

  // 提前定义所有hooks，避免条件渲染问题
  const currentPlayer = gameState?.players.find(p => p.id === playerId);
  const opponent = gameState?.players.find(p => p.id !== playerId);
  const isMyTurn = gameState?.players[gameState.currentPlayerIndex]?.id === playerId;

  // 监听游戏阶段变化，添加特效
  useEffect(() => {
    if (!gameState) return;

    // 检测发牌（从waiting到playing的转换）
    if (gameState.phase === 'playing' && isFirstRender) {
      setIsFirstRender(false);
      
      // Phase 3: 高级发牌动画系统
      setTimeout(() => {
        if (currentPlayer?.cards) {
          currentPlayer.cards.forEach((card, index) => {
            const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
            if (cardElement instanceof HTMLElement) {
              // 使用高级发牌动画
              triggerAdvancedDeal(cardElement, index * 150);
              
              // 添加随机重力掉落效果
              if (Math.random() > 0.6) {
                triggerGravityDrop(cardElement, index * 150 + 500);
              }
            }
          });
        }
        
        // 添加浮动粒子背景效果
        if (gameContainerRef.current) {
          createFloatingParticles(gameContainerRef.current, 8);
        }
      }, 200);
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
  }, [gameState?.phase, gameState?.winner, playerId, currentPlayer?.cards, isFirstRender]);

  // 监听轮次变化，添加动画效果
  useEffect(() => {
    if (gameState && gameState.currentPlayerIndex !== currentTurnRef.current) {
      currentTurnRef.current = gameState.currentPlayerIndex;
      
      // 添加轮次切换动画
      if (gameStatusRef.current) {
        addTurnTransition(gameStatusRef.current);
      }
    }
  }, [gameState?.currentPlayerIndex]);

  // 监听选中卡牌变化，添加牌型识别动画 - 即时响应版
  useEffect(() => {
    if (selectedCards.length > 0) {
      const cardType = ClientCardUtils.identifyCardType(selectedCards);
      if (cardType && cardType !== lastSelectedCardType) {
        setLastSelectedCardType(cardType);
        
        // 即时牌型识别动画 - 大幅减少延迟
        selectedCards.forEach((card) => {
          const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
          if (cardElement instanceof HTMLElement) {
            // 立即触发基础发光动画
            addCardTypeGlow(cardElement);
            
            // 根据牌型添加特殊效果 - 几乎无延迟
            const isBomb = ClientCardUtils.isBomb(cardType);
            const isSpecial = ClientCardUtils.isSpecialCard(card);
            
            if (isBomb) {
              // 炸弹类型：立即震动+快速粒子
              triggerCardWobble(cardElement);
              setTimeout(() => {
                createParticleExplosion(cardElement, 10);
              }, 50);
            } else if (isSpecial) {
              // 特殊牌：快速魔法光环
              setTimeout(() => {
                triggerMagicAura(cardElement, 1000);
              }, 20);
            } else if (selectedCards.length >= 3) {
              // 多张牌：即时弹性效果
              setTimeout(() => {
                triggerElasticScale(cardElement);
              }, 10);
            }
            
            // 新增：即时快速选择动画
            triggerQuickSelect(cardElement);
          }
        });
      }
    } else {
      setLastSelectedCardType(null);
    }
  }, [selectedCards, lastSelectedCardType]);

  // 选择/取消选择卡牌
  const toggleCardSelection = useCallback((card: Card) => {
    setSelectedCards(prev => {
      const isSelected = prev.find(c => c.id === card.id);
      if (isSelected) {
        return prev.filter(c => c.id !== card.id);
      } else {
        return [...prev, card];
      }
    });
  }, []);

  // 出牌 - 添加防抖处理和Phase 3动画
  const handlePlayCards = useCallback(
    debounce(() => {
      if (selectedCards.length === 0) return;
      
      // Phase 3: 出牌复杂动画序列
      selectedCards.forEach((card, index) => {
        const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
        if (cardElement instanceof HTMLElement) {
          setTimeout(() => {
            // 使用组合动画
            triggerPlayCardCombo(cardElement);
          }, index * 100);
        }
      });
      
      // 延迟执行出牌逻辑，让动画先播放
      setTimeout(() => {
        onPlayCards(selectedCards);
        setSelectedCards([]);
      }, selectedCards.length * 100 + 500);
    }, 300),
    [selectedCards, onPlayCards]
  );

  // 带ripple效果的按钮点击处理
  const handleButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    action: () => void
  ) => {
    createRippleEffect(event);
    action();
  };

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
    console.log('GameBoard: 等待游戏状态, playerId:', playerId);
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

  console.log('GameBoard render:', {
    playerId,
    currentPlayer: currentPlayer ? { 
      id: currentPlayer.id, 
      name: currentPlayer.name, 
      cardCount: currentPlayer.cards.length 
    } : null,
    gameState: {
      phase: gameState.phase,
      currentPlayerIndex: gameState.currentPlayerIndex
    }
  });

  // 渲染卡牌 - 增强版本
  const renderCard = (card: Card, isSelected: boolean, onClick?: () => void) => {
    // 双击选择同点数牌 - Phase 3增强版
    const handleDoubleClick = (event: React.MouseEvent) => {
      event.preventDefault();
      if (onClick) {
        selectSameRankCards(card);
        
        // Phase 3: 即时双击特效组合
        const cardElement = event.currentTarget as HTMLElement;
        
        // 立即创建粒子爆炸
        createParticleExplosion(cardElement, 25);
        
        // 快速弹性缩放
        setTimeout(() => {
          triggerElasticScale(cardElement);
        }, 50);
        
        // 快速魔法光环
        setTimeout(() => {
          triggerMagicAura(cardElement, 2000);
        }, 100);
      }
    };

    // 单击时的处理 - 即时反馈版本
    const handleClick = (event: React.MouseEvent) => {
      if (onClick) {
        // 立即触发视觉反馈 - 不等待DOM查询
        const cardElement = event.currentTarget as HTMLElement;
        triggerQuickSelect(cardElement);
        
        // 立即执行选择逻辑（无延迟）
        onClick();
        
        // 根据卡牌类型添加额外效果（不阻塞主要反馈）
        const isSpecialCard = ClientCardUtils.isSpecialCard(card);
        if (isSpecialCard && Math.random() > 0.7) {
          setTimeout(() => {
            triggerElasticScale(cardElement);
          }, 50);
        }
      }
    };
    const getCardColor = (card: Card) => {
      if (card.suit === 'joker') return 'text-purple-700 font-extrabold';
      if (card.suit === 'hearts' || card.suit === 'diamonds') return 'text-red-600 font-bold';
      return 'text-gray-800 font-semibold';
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
          className={`${getCardClasses()} card-enhanced-hover`}
          style={{
            animationDelay: `${Math.random() * 0.5}s`
          }}
          title={`${card.display} - 单击选择，双击选择所有${card.rank}`}
          ref={(el) => {
            if (el && !el.classList.contains('enhanced-hover-added')) {
              addEnhancedHoverEffect(el);
              el.classList.add('enhanced-hover-added');
            }
          }}
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
      className="game-background min-h-screen p-2 sm:p-4 relative overflow-hidden flex flex-col"
    >
      {/* 游戏状态栏 - 压缩高度 */}
      <div className="glass-panel p-3 sm:p-4 mb-2 sm:mb-4 flex-shrink-0">
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
          <div className="text-right flex-shrink-0">
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

      {/* 对手信息区域 - 压缩高度 */}
      <div className="glass-panel p-3 mb-2 sm:mb-3 flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-white font-bold text-sm">
            👤 {opponent?.name || '等待中...'}
          </h3>
          {opponent && (
            <div className="text-right">
              <p className="text-white/80 text-xs">
                剩余 <span className="font-bold text-red-300">{opponent.cardCount}</span> 张
              </p>
              {opponent.cardCount <= 3 && opponent.cardCount > 0 && (
                <p className="text-red-400 text-xs font-bold animate-pulse">
                  🚨 即将获胜！
                </p>
              )}
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-1 min-h-12 p-2 bg-white/5 backdrop-blur rounded-lg border border-white/10">
          {opponent ? (
            Array.from({ length: Math.min(opponent.cardCount, 15) }, (_, i) => (
              <div
                key={i}
                className="w-8 h-11 bg-gradient-to-br from-blue-500 to-blue-700 rounded border border-blue-400/50 shadow-lg card-3d"
                style={{
                  animationDelay: `${i * 0.05}s`,
                  transform: `rotate(${(Math.random() - 0.5) * 5}deg)`
                }}
                title={`对手剩余 ${opponent.cardCount} 张牌`}
              >
                <div className="w-full h-full bg-gradient-to-br from-white/20 via-transparent to-transparent rounded"></div>
              </div>
            )).concat(
              opponent.cardCount > 15 ? [
                <div key="more" className="w-8 h-11 flex items-center justify-center text-white/60 text-xs">
                  +{opponent.cardCount - 15}
                </div>
              ] : []
            )
          ) : (
            <div className="w-full h-11 flex items-center justify-center">
              <p className="text-white/60 text-xs">🔍 寻找对手中...</p>
            </div>
          )}
        </div>
      </div>

      {/* 上次出牌区域 - 重点显示，增加高度 */}
      <div className="glass-panel p-3 mb-2 sm:mb-3 flex-1 min-h-0 border-2 border-yellow-400/30">
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
        <div className="glass-panel p-3 mb-2 flex-shrink-0">
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
        </div>
      )}

      {/* 我的手牌 - 重点区域，确保充足空间 */}
      <div className="glass-panel p-3 flex-1 min-h-0 border-2 border-green-400/30">
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
        
        <div className="flex flex-wrap gap-1 sm:gap-2 min-h-20 p-2 bg-white/5 backdrop-blur rounded-lg border border-white/10 h-full overflow-y-auto">
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
        playerName={gameState?.winner === playerId ? currentPlayer?.name || '你' : opponent?.name || '对手'}
        isWinner={gameState?.winner === playerId}
      />
    </div>
  );
};

export default GameBoard; 