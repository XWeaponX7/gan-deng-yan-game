// client/src/components/GameBoard.tsx
// 游戏主界面组件

import { useState } from 'react';
import { GameState, Card, CardType } from '../types/game';
import { ClientCardUtils } from '../utils/cardUtils';

interface GameBoardProps {
  gameState: GameState | null;
  playerId: string;
  onPlayCards: (cards: Card[]) => void;
  onPass: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  gameState, 
  playerId, 
  onPlayCards, 
  onPass 
}) => {
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);

  // 如果没有游戏状态，显示等待界面
  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">正在匹配对手...</p>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const opponent = gameState.players.find(p => p.id !== playerId);
  const isMyTurn = gameState.players[gameState.currentPlayerIndex]?.id === playerId;

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

  // 选择/取消选择卡牌
  const toggleCardSelection = (card: Card) => {
    setSelectedCards(prev => {
      const isSelected = prev.find(c => c.id === card.id);
      if (isSelected) {
        return prev.filter(c => c.id !== card.id);
      } else {
        return [...prev, card];
      }
    });
  };

  // 出牌
  const handlePlayCards = () => {
    if (selectedCards.length === 0) return;
    onPlayCards(selectedCards);
    setSelectedCards([]);
  };

  // 渲染卡牌
  const renderCard = (card: Card, isSelected: boolean, onClick?: () => void) => {
    const getCardColor = (card: Card) => {
      if (card.suit === 'joker') return 'text-purple-600';
      if (card.suit === 'hearts' || card.suit === 'diamonds') return 'text-red-600';
      return 'text-black';
    };

    const isSpecial = ClientCardUtils.isSpecialCard(card);

    return (
      <div
        key={card.id}
        onClick={onClick}
        className={`
          relative w-12 h-16 bg-white rounded border-2 flex items-center justify-center
          text-xs font-bold cursor-pointer transition-all
          ${isSelected ? 'border-blue-500 -translate-y-2 shadow-lg' : 
            isSpecial ? 'border-orange-400 hover:border-orange-600' : 
            'border-gray-300 hover:border-gray-400'}
          ${getCardColor(card)}
          ${isSpecial ? 'bg-gradient-to-br from-yellow-50 to-orange-50' : 'bg-white'}
        `}
      >
        {card.display}
        {/* 特殊牌标识 */}
        {isSpecial && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">★</span>
          </div>
        )}
        {/* 数字2的特殊标识 */}
        {card.rank === '2' && (
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">🔥</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4">
      {/* 游戏状态栏 */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center text-white">
          <div>
            <h2 className="text-xl font-bold">干瞪眼对战</h2>
            <p className="text-sm opacity-80">游戏ID: {gameState.gameId}</p>
            {gameState.deckCount !== undefined && (
              <p className="text-xs opacity-60">剩余牌堆: {gameState.deckCount}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm">
              {gameState.phase === 'waiting' && '等待开始'}
              {gameState.phase === 'playing' && (isMyTurn ? '轮到你了' : '对手回合')}
              {gameState.phase === 'finished' && '游戏结束'}
            </p>
            {gameState.winner && (
              <p className="text-lg font-bold">
                🎉 {gameState.winner === playerId ? '你赢了!' : '对手获胜'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 对手信息区域 */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
        <h3 className="text-white font-bold mb-2">对手: {opponent?.name || '等待中'}</h3>
        <div className="flex gap-1">
          {Array.from({ length: opponent?.cardCount || 0 }, (_, i) => (
            <div
              key={i}
              className="w-8 h-12 bg-blue-600 rounded border border-blue-400"
              title={`对手剩余 ${opponent?.cardCount} 张牌`}
            />
          ))}
        </div>
        {opponent && (
          <p className="text-white text-sm mt-2">
            剩余 {opponent.cardCount} 张牌
          </p>
        )}
      </div>

      {/* 出牌区域 */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4 min-h-32">
        <h3 className="text-white font-bold mb-2">上次出牌</h3>
        {gameState.lastPlay ? (
          <div>
            <div className="flex gap-1 mb-2">
              {gameState.lastPlay.cards.map(card => 
                renderCard(card, false)
              )}
            </div>
            <div className="text-white text-sm">
              <p>
                {gameState.players.find(p => p.id === gameState.lastPlay?.playerId)?.name} 出了 
                <span className={`ml-1 font-bold ${ClientCardUtils.getCardTypeColor(gameState.lastPlay.type)}`}>
                  {ClientCardUtils.getCardTypeName(gameState.lastPlay.type)}
                </span>
              </p>
              {/* 显示上家出牌的特殊提示 */}
              {gameState.lastPlay.type === CardType.SINGLE && gameState.lastPlay.cards[0]?.rank === '2' && (
                <p className="mt-1 text-orange-300 text-xs">
                  🔥 对方出了2，只能用大小王或炸弹压制
                </p>
              )}
              {gameState.lastPlay.type === CardType.JOKER_BOMB && (
                <p className="mt-1 text-purple-300 text-xs">
                  👑 对方出了王炸，无法压制
                </p>
              )}
              {ClientCardUtils.isBomb(gameState.lastPlay.type) && gameState.lastPlay.type !== CardType.JOKER_BOMB && (
                <p className="mt-1 text-red-300 text-xs">
                  💥 对方出了炸弹，需要更大的炸弹才能压制
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-white/60">等待首出...</p>
        )}
      </div>

      {/* 游戏控制按钮 */}
      {gameState.phase === 'playing' && isMyTurn && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
          <div className="flex gap-2">
            <button
              onClick={handlePlayCards}
              disabled={selectedCards.length === 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white rounded font-medium transition-colors"
            >
              出牌 ({selectedCards.length})
            </button>
            <button
              onClick={onPass}
              disabled={!gameState.lastPlay}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white rounded font-medium transition-colors"
            >
              过牌
            </button>
          </div>
          {selectedCards.length > 0 && (
            <div className="text-white text-sm mt-2">
              <p>已选择: {selectedCards.map(c => c.display).join(', ')}</p>
              {(() => {
                const cardType = ClientCardUtils.identifyCardType(selectedCards);
                if (cardType) {
                  // 检查是否包含特殊牌
                  const hasSpecialCards = selectedCards.some(card => ClientCardUtils.isSpecialCard(card));
                  
                  return (
                    <div>
                      <p className={`mt-1 font-bold ${ClientCardUtils.getCardTypeColor(cardType)}`}>
                        牌型: {ClientCardUtils.getCardTypeName(cardType)}
                      </p>
                      {hasSpecialCards && (
                        <p className="mt-1 text-yellow-400 text-xs">
                          ⚡ 包含特殊牌 (2/大小王)
                        </p>
                      )}
                      {/* 数字2的特殊提示 */}
                      {selectedCards.length === 1 && selectedCards[0].rank === '2' && (
                        <p className="mt-1 text-orange-300 text-xs">
                          🔥 数字2只能被大小王或炸弹压制
                        </p>
                      )}
                      {/* 王炸提示 */}
                      {cardType === CardType.JOKER_BOMB && (
                        <p className="mt-1 text-purple-300 text-xs">
                          👑 王炸：最强牌型，无人能敌！
                        </p>
                      )}
                      {/* 百搭牌型提示 */}
                      {(() => {
                        const jokers = selectedCards.filter(c => c.rank === 'small_joker' || c.rank === 'big_joker');
                        if (jokers.length > 0 && cardType !== CardType.JOKER_BOMB) {
                          const normalCards = selectedCards.filter(c => c.rank !== 'small_joker' && c.rank !== 'big_joker');
                          return (
                            <p className="mt-1 text-cyan-300 text-xs">
                              🎭 百搭组合：{jokers.length}张大小王 + {normalCards.length}张普通牌
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  );
                } else {
                  return (
                    <p className="mt-1 text-red-400 font-bold">
                      无效牌型
                    </p>
                  );
                }
              })()}
            </div>
          )}
        </div>
      )}

      {/* 我的手牌 */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
        <h3 className="text-white font-bold mb-2">我的手牌: {currentPlayer?.name}</h3>
        <div className="flex flex-wrap gap-1">
          {currentPlayer?.cards && currentPlayer.cards.length > 0 ? (
            currentPlayer.cards.map(card => 
              renderCard(
                card, 
                selectedCards.some(c => c.id === card.id),
                gameState.phase === 'playing' && isMyTurn ? 
                  () => toggleCardSelection(card) : undefined
              )
            )
          ) : (
            <p className="text-white/60 text-sm">
              {gameState.phase === 'waiting' ? '等待发牌...' : '无手牌'}
            </p>
          )}
        </div>
        <p className="text-white text-sm mt-2">
          剩余 {currentPlayer?.cards?.length || 0} 张牌
        </p>
      </div>
    </div>
  );
};

export default GameBoard; 