// server/src/server.ts
// 干瞪眼游戏服务端主文件

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Game } from './models/Game';
import { Card, CardType } from './models/Card';

const app = express();
const server = createServer(app);

// 配置CORS
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));

// Socket.IO配置
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// 游戏管理
const games = new Map<string, Game>(); // gameId -> Game
const playerToGame = new Map<string, string>(); // playerId -> gameId
const waitingPlayers: string[] = []; // 等待匹配的玩家

// 生成唯一ID
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// 创建新游戏
function createGame(): Game {
  const gameId = generateId();
  const game = new Game(gameId);
  games.set(gameId, game);
  return game;
}

// 匹配玩家到游戏
function matchPlayer(playerId: string, playerName: string): Game | null {
  // 查找等待中的游戏
  for (const [gameId, game] of games.entries()) {
    if (game.phase === 'waiting' && game.players.length < 2) {
      if (game.addPlayer(playerId, playerName)) {
        playerToGame.set(playerId, gameId);
        return game;
      }
    }
  }

  // 没有等待的游戏，创建新游戏
  const newGame = createGame();
  if (newGame.addPlayer(playerId, playerName)) {
    playerToGame.set(playerId, newGame.id);
    return newGame;
  }

  return null;
}

// Socket.IO事件处理
io.on('connection', (socket) => {
  console.log(`玩家连接: ${socket.id}`);

  // 加入游戏
  socket.on('join-game', (data: { playerName: string }) => {
    try {
      const { playerName } = data;
      const playerId = socket.id;
      
      // 匹配玩家到游戏
      const game = matchPlayer(playerId, playerName);
      
      if (!game) {
        socket.emit('error', { message: '无法加入游戏' });
        return;
      }

      // 加入Socket房间
      socket.join(game.id);
      
      // 通知玩家加入成功
      socket.emit('player-joined', {
        playerId,
        gameId: game.id,
        playerName
      });

      // 为每个玩家发送包含自己手牌的游戏状态
      game.players.forEach(player => {
        io.to(player.id).emit('game-state', game.getGameState(player.id));
      });

      // 如果房间满了，自动开始游戏
      if (game.players.length === 2) {
        setTimeout(() => {
          if (game.startGame()) {
            // 为每个玩家发送包含自己手牌的游戏状态
            game.players.forEach(player => {
              io.to(player.id).emit('game-state', game.getGameState(player.id));
            });
            
            // 通知当前玩家轮到他了
            const currentPlayer = game.getCurrentPlayer();
            if (currentPlayer) {
              io.to(currentPlayer.id).emit('your-turn', { playerId: currentPlayer.id });
            }
          }
        }, 1000); // 延迟1秒开始，让客户端准备好
      }

      console.log(`玩家 ${playerName} 加入游戏 ${game.id}`);
      
    } catch (error) {
      console.error('加入游戏错误:', error);
      socket.emit('error', { message: '加入游戏失败' });
    }
  });

  // 出牌
  socket.on('play-cards', (data: { gameId: string; cards: Card[]; type: CardType }) => {
    try {
      const { gameId, cards } = data;
      const playerId = socket.id;
      
      const game = games.get(gameId);
      if (!game) {
        socket.emit('error', { message: '游戏不存在' });
        return;
      }

      const result = game.playCards(playerId, cards);
      
      if (!result.success) {
        socket.emit('error', { message: result.error || '出牌失败' });
        return;
      }

      // 广播游戏状态更新
      game.players.forEach(player => {
        io.to(player.id).emit('game-state', game.getGameState(player.id));
      });

      // 检查游戏是否结束
      if (game.phase === 'finished') {
        io.to(gameId).emit('game-over', {
          winner: game.winner,
          scores: game.players.reduce((acc, player) => {
            acc[player.id] = player.cards.length;
            return acc;
          }, {} as { [key: string]: number })
        });
      } else {
        // 通知下一个玩家
        const currentPlayer = game.getCurrentPlayer();
        if (currentPlayer) {
          io.to(currentPlayer.id).emit('your-turn', { playerId: currentPlayer.id });
        }
      }

    } catch (error) {
      console.error('出牌错误:', error);
      socket.emit('error', { message: '出牌失败' });
    }
  });

  // 过牌
  socket.on('pass', (data: { gameId: string }) => {
    try {
      const { gameId } = data;
      const playerId = socket.id;
      
      const game = games.get(gameId);
      if (!game) {
        socket.emit('error', { message: '游戏不存在' });
        return;
      }

      const result = game.pass(playerId);
      
      if (!result.success) {
        socket.emit('error', { message: result.error || '过牌失败' });
        return;
      }

              // 广播游戏状态更新
        game.players.forEach(player => {
          io.to(player.id).emit('game-state', game.getGameState(player.id));
        });

        // 通知下一个玩家
        const currentPlayer = game.getCurrentPlayer();
        if (currentPlayer) {
          io.to(currentPlayer.id).emit('your-turn', { playerId: currentPlayer.id });
        }

    } catch (error) {
      console.error('过牌错误:', error);
      socket.emit('error', { message: '过牌失败' });
    }
  });

  // 断开连接
  socket.on('disconnect', () => {
    const playerId = socket.id;
    const gameId = playerToGame.get(playerId);
    
    if (gameId) {
      const game = games.get(gameId);
      if (game) {
        game.removePlayer(playerId);
        
        // 通知其他玩家
        game.players.forEach(player => {
          io.to(player.id).emit('game-state', game.getGameState(player.id));
        });
        
        // 如果游戏已空，删除游戏
        if (game.players.length === 0) {
          games.delete(gameId);
        }
      }
      
      playerToGame.delete(playerId);
    }

    console.log(`玩家断开连接: ${playerId}`);
  });
});

// 基础路由
app.get('/', (req, res) => {
  res.json({ 
    message: '干瞪眼游戏服务端运行中',
    stats: {
      activeGames: games.size,
      connectedPlayers: io.engine.clientsCount
    }
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🃏 干瞪眼游戏服务端启动在端口 ${PORT}`);
  console.log(`🌍 CORS已配置为: ${process.env.CLIENT_URL || "http://localhost:5173"}`);
}); 