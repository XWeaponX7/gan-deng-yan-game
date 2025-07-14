// client/src/App.tsx
// 干瞪眼游戏主应用组件

import { useState, useEffect } from 'react';
import GameBoard from './components/GameBoard';
import { useSocket } from './hooks/useSocket';
import { ClientCardUtils } from './utils/cardUtils';
import { createRippleEffect } from './utils/uiUtils';
import './App.css';

function App() {
  const [playerName, setPlayerName] = useState<string>('');
  const [isInGame, setIsInGame] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState<number>(2);
  const [roomInfo, setRoomInfo] = useState<{
    currentPlayers: number;
    maxPlayers: number;
    gameId: string;
  } | null>(null);
  
  const {
    gameState,
    playerId,
    error,
    isJoining,
    joinGame,
    playCards,
    pass,
    requestRematch,
    socket,
    turnTimeoutPlayerId
  } = useSocket();

  // 监听玩家加入事件
  useEffect(() => {
    if (!socket) return;

    const handlePlayerJoined = (data: {
      playerId: string;
      gameId: string;
      playerName: string;
      maxPlayers: number;
      currentPlayers: number;
    }) => {
      console.log('玩家加入成功:', data);
      setIsInGame(true);
      setRoomInfo({
        currentPlayers: data.currentPlayers,
        maxPlayers: data.maxPlayers,
        gameId: data.gameId
      });
    };

    socket.on('player-joined', handlePlayerJoined);

    return () => {
      socket.off('player-joined', handlePlayerJoined);
    };
  }, [socket]);

  // 监听游戏状态更新房间信息
  useEffect(() => {
    if (gameState && roomInfo) {
      setRoomInfo(prev => prev ? {
        ...prev,
        currentPlayers: gameState.players.length
      } : null);
    }
  }, [gameState, roomInfo]);

  // 连接到游戏
  const handleJoinGame = () => {
    if (!playerName.trim()) {
      return;
    }
    
    joinGame(playerName, maxPlayers);
  };

  // 处理出牌
  const handlePlayCards = (cards: any[]) => {
    const cardType = ClientCardUtils.identifyCardType(cards);
    if (cardType) {
    playCards(cards, cardType);
    }
  };

  // 如果还没有进入游戏，显示加入界面
  if (!isInGame) {
    return (
      <div className="game-background min-h-screen flex items-center justify-center">
        <div className="glass-panel p-8 max-w-md w-full mx-4">
          <h1 className="text-3xl font-bold text-center text-white mb-6 drop-shadow-lg">
            🃏 干瞪眼
          </h1>
          <p className="text-white/90 text-center mb-6 drop-shadow">
            多人实时对战卡牌游戏
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

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2 drop-shadow">
                选择游戏人数
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    onClick={() => setMaxPlayers(num)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      maxPlayers === num
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-white/20 text-white/80 hover:bg-white/30'
                    }`}
                  >
                    {num}人
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/60 mt-2">
                {maxPlayers === 2 ? '⚡ 快速匹配' : `🎮 ${maxPlayers}人房间`}
              </p>
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
        </div>
      </div>
    );
  }

  // 如果在游戏中但游戏还没开始，显示等待界面
  if (gameState?.phase === 'waiting' && roomInfo) {
    return (
      <div className="game-background min-h-screen flex items-center justify-center">
        <div className="glass-panel p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-center text-white mb-6 drop-shadow-lg">
            🎮 等待其他玩家
          </h2>
          
          <div className="text-center space-y-4">
            <div className="text-white/90">
              <div className="text-lg mb-2">
                房间人数: {roomInfo.currentPlayers}/{roomInfo.maxPlayers}
              </div>
              <div className="text-sm text-white/70">
                房间ID: {roomInfo.gameId}
              </div>
            </div>

            <div className="space-y-2">
              {gameState.players.map((player, index) => (
                <div
                  key={player.id}
                  className={`p-3 rounded-lg ${
                    player.id === playerId
                      ? 'bg-blue-500/30 border border-blue-400/50'
                      : 'bg-white/10'
                  }`}
                >
                  <span className="text-white font-medium">
                    {player.id === playerId ? '👤 你' : `👤 ${player.name}`}
                  </span>
                  {index === 0 && (
                    <span className="text-blue-300 text-sm ml-2">(房主)</span>
                  )}
                </div>
              ))}
              
              {/* 显示空位 */}
              {Array.from({ length: roomInfo.maxPlayers - roomInfo.currentPlayers }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="p-3 rounded-lg bg-white/5 border-2 border-dashed border-white/30"
                >
                  <span className="text-white/50">⏳ 等待玩家加入...</span>
                </div>
              ))}
            </div>

            <p className="text-white/60 text-sm">
              {roomInfo.currentPlayers < roomInfo.maxPlayers
                ? `还需要 ${roomInfo.maxPlayers - roomInfo.currentPlayers} 名玩家`
                : '准备开始游戏...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 游戏进行中，显示游戏界面
  return (
    <div className="App">
    <GameBoard 
      gameState={gameState}
      playerId={playerId}
      onPlayCards={handlePlayCards}
      onPass={pass}
      onRequestRematch={requestRematch}
        turnTimeoutPlayerId={turnTimeoutPlayerId}
    />
    </div>
  );
}

export default App; 