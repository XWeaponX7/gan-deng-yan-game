// server/src/server.ts
// 干瞪眼游戏服务端主文件

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { Game } from './models/Game';
import { Card, CardType } from './models/Card';

const app = express();
const server = createServer(app);

// 配置CORS
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));

// 在生产环境中提供静态文件
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '../../client/dist');
  console.log('🗂️ 静态文件路径:', staticPath);
  console.log('🏠 当前工作目录:', process.cwd());
  console.log('📁 __dirname:', __dirname);
  app.use(express.static(staticPath));
}

// Socket.IO配置
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? true : (process.env.CLIENT_URL || "http://localhost:5173"),
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

// 设置轮次计时器的通用函数
function setupTurnTimer(game: Game): void {
  game.startTurnTimer((playerId) => {
    // 玩家超时，自动过牌
    const result = game.pass(playerId);
    if (result.success) {
      // 通知所有玩家有人超时
      io.to(game.id).emit('turn-timeout', { playerId });
      
      // 广播游戏状态更新
      game.players.forEach(player => {
        io.to(player.id).emit('game-state', game.getGameState(player.id));
      });
      
      // 递归设置下一个玩家的计时器
      setupTurnTimer(game);
      
      // 通知下一个玩家
      const currentPlayer = game.getCurrentPlayer();
      if (currentPlayer) {
        io.to(currentPlayer.id).emit('your-turn', { playerId: currentPlayer.id });
      }
    }
  });
}

// 创建新游戏
function createGame(maxPlayers: number = 2): Game {
  const gameId = generateId();
  const game = new Game(gameId, maxPlayers);
  games.set(gameId, game);
  console.log(`创建新游戏: ${gameId}，最大人数: ${maxPlayers}`);
  return game;
}

// 匹配玩家到游戏
function matchPlayer(playerId: string, playerName: string, maxPlayers: number = 2): Game | null {
  // 查找等待中且人数要求相同的游戏
  for (const [gameId, game] of games.entries()) {
    if (game.phase === 'waiting' && 
        game.maxPlayers === maxPlayers && 
        game.players.length < game.maxPlayers) {
      if (game.addPlayer(playerId, playerName)) {
        playerToGame.set(playerId, gameId);
        return game;
      }
    }
  }

  // 没有合适的等待游戏，创建新游戏
  const newGame = createGame(maxPlayers);
  if (newGame.addPlayer(playerId, playerName)) {
    playerToGame.set(playerId, newGame.id);
    return newGame;
  }

  return null;
}

// Socket.IO事件处理
io.on('connection', (socket) => {
  console.log(`玩家连接: ${socket.id}`);

  // 请求游戏状态
  socket.on('get-game-state', () => {
    const playerId = socket.id;
    const gameId = playerToGame.get(playerId);
    
    if (gameId) {
      const game = games.get(gameId);
      if (game) {
        console.log(`获取游戏状态 for ${playerId}:`, {
          phase: game.phase,
          players: game.players.map(p => ({ id: p.id, name: p.name, cardCount: p.cards.length }))
        });
        socket.emit('game-state', game.getGameState(playerId));
      }
    }
  });

  // 加入游戏
  socket.on('join-game', (data: { playerName: string; maxPlayers?: number }) => {
    try {
      const { playerName, maxPlayers = 2 } = data;
      const playerId = socket.id;
      
      // 验证maxPlayers参数
      const validMaxPlayers = Math.min(Math.max(maxPlayers, 2), 6);
      
      // 匹配玩家到游戏
      const game = matchPlayer(playerId, playerName, validMaxPlayers);
      
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
        playerName,
        maxPlayers: game.maxPlayers,
        currentPlayers: game.players.length
      });

      // 立即发送游戏状态
      console.log(`发送游戏状态给 ${playerName} (${playerId})，房间 ${game.id}: ${game.players.length}/${game.maxPlayers}`);
      socket.emit('game-state', game.getGameState(playerId));

      // 为其他玩家也发送更新的游戏状态
      game.players.forEach(player => {
        if (player.id !== playerId) {
          io.to(player.id).emit('game-state', game.getGameState(player.id));
        }
      });

      // 如果房间满了，自动开始游戏
      if (game.players.length === game.maxPlayers) {
        console.log(`房间 ${game.id} 已满员 (${game.players.length}/${game.maxPlayers})，准备开始游戏`);
        setTimeout(() => {
          if (game.startGame()) {
            // 设置超时处理回调
            setupTurnTimer(game);
            
            // 为每个玩家发送包含自己手牌的游戏状态
            game.players.forEach(player => {
              io.to(player.id).emit('game-state', game.getGameState(player.id));
            });
            
            // 通知当前玩家轮到他了
            const currentPlayer = game.getCurrentPlayer();
            if (currentPlayer) {
              io.to(currentPlayer.id).emit('your-turn', { playerId: currentPlayer.id });
            }
            
            console.log(`游戏 ${game.id} 开始，首出玩家: ${currentPlayer?.name}`);
          }
        }, 1000); // 延迟1秒开始，让客户端准备好
      } else {
        console.log(`等待更多玩家加入房间 ${game.id}: ${game.players.length}/${game.maxPlayers}`);
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
        // 重新设置计时器
        setupTurnTimer(game);
        
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

      // 重新设置计时器
      setupTurnTimer(game);

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

  // 请求再玩一次
  socket.on('request-rematch', (data: { gameId: string }) => {
    try {
      const { gameId } = data;
      const playerId = socket.id;
      
      const game = games.get(gameId);
      if (!game) {
        socket.emit('error', { message: '游戏不存在' });
        return;
      }

      if (game.phase !== 'finished') {
        socket.emit('error', { message: '游戏还未结束' });
        return;
      }

      // 标记玩家想要再玩一次
      const player = game.players.find(p => p.id === playerId);
      if (!player) {
        socket.emit('error', { message: '玩家不在游戏中' });
        return;
      }

      player.wantsRematch = true;
      console.log(`玩家 ${player.name} 请求再玩一次`);

      // 通知所有玩家有人请求再玩一次
      game.players.forEach(p => {
        io.to(p.id).emit('rematch-requested', {
          playerId: player.id,
          playerName: player.name
        });
        io.to(p.id).emit('game-state', game.getGameState(p.id));
      });

      // 检查是否所有玩家都同意再玩一次
      const allWantRematch = game.players.every(p => p.wantsRematch);
      if (allWantRematch) {
        console.log('所有玩家同意再玩一次，开始新游戏');
        
        // 记录上一局的获胜者
        const lastWinner = game.winner;
        
        // 重置游戏状态
        game.resetForRematch(lastWinner);
        
        // 开始新游戏
        if (game.startGame()) {
          // 设置计时器
          setupTurnTimer(game);
          
          // 通知客户端再玩一次开始
          game.players.forEach(player => {
            io.to(player.id).emit('rematch-started', game.getGameState(player.id));
          });
          
          // 通知当前玩家轮到他了（应该是上局的输家）
          const currentPlayer = game.getCurrentPlayer();
          if (currentPlayer) {
            io.to(currentPlayer.id).emit('your-turn', { playerId: currentPlayer.id });
          }
        }
      }

    } catch (error) {
      console.error('再玩一次错误:', error);
      socket.emit('error', { message: '再玩一次失败' });
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

// API路由
app.get('/api', (req, res) => {
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

// 在生产环境中，所有其他请求都返回 index.html (用于支持前端路由)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, '../../client/dist/index.html');
    console.log('📄 尝试发送 index.html:', indexPath);
    res.sendFile(indexPath);
  });
} else {
  // 开发环境的基础路由
  app.get('/', (req, res) => {
    res.json({ 
      message: '干瞪眼游戏服务端运行中 (开发模式)',
      stats: {
        activeGames: games.size,
        connectedPlayers: io.engine.clientsCount
      }
    });
  });
}

// 启动服务器
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🃏 干瞪眼游戏服务端启动在端口 ${PORT}`);
  console.log(`🌍 CORS已配置为: ${process.env.CLIENT_URL || "http://localhost:5173"}`);
}); 