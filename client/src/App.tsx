// client/src/App.tsx
// 干瞪眼游戏主应用组件

import { useState } from 'react';
import GameBoard from './components/GameBoard';
import { useSocket } from './hooks/useSocket';
import { ClientCardUtils } from './utils/cardUtils';
import { createRippleEffect } from './utils/uiUtils';
import './App.css';

function App() {
  const [playerName, setPlayerName] = useState<string>('');
  const [isInGame, setIsInGame] = useState(false);
  
  const {
    gameState,
    playerId,
    error,
    isJoining,
    joinGame,
    playCards,
    pass,
    requestRematch
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
      <div className="game-background min-h-screen flex items-center justify-center">
        <div className="glass-panel p-8 max-w-md w-full mx-4">
          <h1 className="text-3xl font-bold text-center text-white mb-6 drop-shadow-lg">
            🃏 干瞪眼
          </h1>
          <p className="text-white/90 text-center mb-6 drop-shadow">
            两人实时对战卡牌游戏
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2 drop-shadow">
                玩家昵称
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 backdrop-blur border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                placeholder="输入你的昵称"
                maxLength={20}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
              />
            </div>
            
            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/20 backdrop-blur rounded-lg p-3 border border-red-400/30">
                ⚠️ {error}
              </div>
            )}
            
            <button
              onClick={(e) => {
                if (!isJoining && playerName.trim()) {
                  createRippleEffect(e);
                  handleJoinGame();
                }
              }}
              disabled={!playerName.trim() || isJoining}
              className={`w-full btn-enhanced ${(!playerName.trim() || isJoining) ? 'btn-disabled' : 'btn-primary'}`}
            >
              {isJoining ? '🔄 连接中...' : '🚀 开始游戏'}
            </button>
          </div>
          
          <div className="mt-8 text-sm text-white/70 text-center">
            <p className="font-semibold text-white/90 mb-3">🎯 游戏规则</p>
            <ul className="space-y-2 text-left bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
              <li>🏆 第一个出完手牌的玩家获胜</li>
              <li>🃏 支持单张、对子、顺子、炸弹等牌型</li>
              <li>👑 大小王是最大的牌，可当百搭使用</li>
              <li>🔥 数字2只能被大小王或炸弹压制</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // 调试信息
  console.log('App render:', {
    isInGame,
    gameState: gameState ? {
      gameId: gameState.gameId,
      phase: gameState.phase,
      playerCount: gameState.players.length
    } : null,
    playerId,
    error
  });

  return (
    <GameBoard 
      gameState={gameState}
      playerId={playerId}
      onPlayCards={handlePlayCards}
      onPass={pass}
      onRequestRematch={requestRematch}
    />
  );
}

export default App; 