// client/src/App.tsx
// 干瞪眼游戏主应用组件

import { useState } from 'react';
import { CardType } from './types/game';
import GameBoard from './components/GameBoard';
import { useSocket } from './hooks/useSocket';
import { ClientCardUtils } from './utils/cardUtils';
import './App.css';

function App() {
  const [playerName, setPlayerName] = useState<string>('');
  const [isInGame, setIsInGame] = useState(false);
  
  const {
    gameState,
    playerId,
    error,
    joinGame,
    playCards,
    pass
  } = useSocket();

  // 连接到游戏
  const handleJoinGame = () => {
    if (!playerName.trim()) {
      return;
    }
    
    joinGame(playerName);
    setIsInGame(true);
  };

  // 识别牌型并出牌
  const handlePlayCards = (cards: any[]) => {
    if (cards.length === 0) return;
    
    // 使用牌型识别工具
    const cardType = ClientCardUtils.identifyCardType(cards);
    
    if (!cardType) {
      console.log('无效的牌型');
      return;
    }
    
    console.log(`出牌：${ClientCardUtils.getCardTypeName(cardType)}`);
    playCards(cards, cardType);
  };

  if (!isInGame) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-600 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
            🃏 干瞪眼
          </h1>
          <p className="text-gray-600 text-center mb-6">
            两人实时对战卡牌游戏
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                玩家昵称
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="输入你的昵称"
                maxLength={20}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
              />
            </div>
            
            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}
            
            <button
              onClick={handleJoinGame}
              disabled={!playerName.trim()}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              开始游戏
            </button>
          </div>
          
          <div className="mt-6 text-sm text-gray-500 text-center">
            <p>游戏规则：</p>
            <ul className="mt-2 space-y-1">
              <li>• 第一个出完手牌的玩家获胜</li>
              <li>• 支持单张和对子牌型</li>
              <li>• 大小王是最大的牌</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-600">
      <GameBoard 
        gameState={gameState}
        playerId={playerId}
        onPlayCards={handlePlayCards}
        onPass={pass}
      />
    </div>
  );
}

export default App; 