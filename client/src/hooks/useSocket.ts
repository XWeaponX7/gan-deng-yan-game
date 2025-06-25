// client/src/hooks/useSocket.ts
// Socket.io连接管理hook

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, Card, CardType } from '../types/game';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  gameState: GameState | null;
  playerId: string;
  error: string;
  isJoining: boolean;
  joinGame: (playerName: string) => void;
  playCards: (cards: Card[], type: CardType) => void;
  pass: () => void;
  requestRematch: () => void;
}

export const useSocket = (): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isJoining, setIsJoining] = useState(false);
  const gameIdRef = useRef<string>('');

  useEffect(() => {
    // 创建Socket连接
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    // 连接事件监听
    newSocket.on('connect', () => {
      console.log('Socket连接成功:', newSocket.id);
      setIsConnected(true);
      setPlayerId(newSocket.id || '');
      setError('');
      
      // 连接成功后立即请求游戏状态（如果已经在游戏中）
      setTimeout(() => {
        newSocket.emit('get-game-state');
      }, 100);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket连接断开');
      setIsConnected(false);
      setError('连接已断开');
    });

    // 游戏事件监听
    newSocket.on('player-joined', (data: { 
      playerId: string; 
      gameId: string; 
      playerName: string; 
    }) => {
      console.log('加入游戏成功:', data);
      gameIdRef.current = data.gameId;
      setIsJoining(false);
      setError('');
    });

    newSocket.on('game-state', (state: GameState) => {
      console.log('游戏状态更新:', state);
      setGameState(state);
    });

    newSocket.on('your-turn', (data: { playerId: string }) => {
      console.log('轮到你了:', data);
      // 可以在这里添加音效或通知
    });

    newSocket.on('game-over', (data: { 
      winner: string; 
      scores: { [key: string]: number }; 
    }) => {
      console.log('游戏结束:', data);
      // 游戏结束处理
    });

    newSocket.on('error', (data: { message: string }) => {
      console.error('游戏错误:', data.message);
      setError(data.message);
      setIsJoining(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('连接错误:', error);
      setError('连接服务器失败');
      setIsConnected(false);
    });

    // 清理函数
    return () => {
      newSocket.close();
    };
  }, []);

  // 加入游戏
  const joinGame = (playerName: string) => {
    if (!socket || !isConnected) {
      console.error('无法加入游戏: socket =', socket, 'isConnected =', isConnected);
      setError('未连接到服务器');
      return;
    }

    if (isJoining) {
      console.log('已经在加入游戏中，忽略重复请求');
      return;
    }

    console.log('尝试加入游戏:', playerName, 'socketId:', socket.id);
    setIsJoining(true);
    setError('');
    socket.emit('join-game', { playerName });
  };

  // 出牌
  const playCards = (cards: Card[], type: CardType) => {
    if (!socket || !isConnected) {
      setError('未连接到服务器');
      return;
    }

    if (!gameIdRef.current) {
      setError('未加入游戏');
      return;
    }

    console.log('出牌:', cards, type);
    socket.emit('play-cards', {
      gameId: gameIdRef.current,
      cards,
      type
    });
  };

  // 过牌
  const pass = () => {
    if (!socket || !isConnected) {
      setError('未连接到服务器');
      return;
    }

    if (!gameIdRef.current) {
      setError('未加入游戏');
      return;
    }

    console.log('过牌');
    socket.emit('pass', { gameId: gameIdRef.current });
  };

  // 请求再玩一次
  const requestRematch = () => {
    if (!socket || !isConnected) {
      setError('未连接到服务器');
      return;
    }

    if (!gameIdRef.current) {
      setError('未加入游戏');
      return;
    }

    console.log('请求再玩一次');
    socket.emit('request-rematch', { gameId: gameIdRef.current });
  };

  return {
    socket,
    isConnected,
    gameState,
    playerId,
    error,
    isJoining,
    joinGame,
    playCards,
    pass,
    requestRematch
  };
}; 