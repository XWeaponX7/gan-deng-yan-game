// client/src/types/game.ts
// 干瞪眼游戏的核心类型定义

// 卡牌花色
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'joker';

// 卡牌等级
export type Rank = '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '2' | 'small_joker' | 'big_joker';

// 卡牌接口
export interface Card {
  id: string;           // 唯一标识符
  suit: Suit;          // 花色
  rank: Rank;          // 等级
  value: number;       // 比较用数值: 3=3, 4=4, ..., K=13, A=14, 2=15, 小王=16, 大王=17
  display: string;     // 显示文本，如 "3♠", "K♥"
}

// 牌型枚举 - MVP版本先实现单张和对子
export enum CardType {
  SINGLE = 'single',        // 单张
  PAIR = 'pair',           // 对子
  STRAIGHT = 'straight',    // 顺子 (后续实现)
  TRIPLE = 'triple',       // 三张炸弹 (后续实现)
  QUADRUPLE = 'quadruple', // 四张炸弹 (后续实现)
  JOKER_BOMB = 'joker_bomb' // 王炸 (后续实现)
}

// 出牌记录
export interface CardPlay {
  playerId: string;
  cards: Card[];
  type: CardType;
  timestamp: number;
}

// 玩家信息
export interface Player {
  id: string;
  name: string;
  cards: Card[];        // 手牌
  cardCount: number;    // 手牌数量 (对手只能看到数量)
  isReady: boolean;
  wantsRematch?: boolean; // 是否想要再玩一次
}

// 游戏状态
export interface GameState {
  gameId: string;
  players: Player[];
  currentPlayerIndex: number;  // 当前出牌玩家索引
  lastPlay: CardPlay | null;   // 上一次出牌
  phase: 'waiting' | 'playing' | 'finished';
  winner: string | null;
  lastWinner?: string | null;  // 上一局的获胜者
  createdAt: number;
  deckCount?: number;         // 剩余牌堆数量
  discardPileCount?: number;  // 已出牌堆数量
  maxPlayers?: number;        // 房间最大人数
  consecutivePasses?: number; // 连续过牌次数
  lastPlayerId?: string | null; // 最后出牌的玩家ID
}

// WebSocket 事件类型
export interface SocketEvents {
  // 客户端发送的事件
  'join-game': { playerName: string };
  'play-cards': { gameId: string; cards: Card[]; type: CardType };
  'pass': { gameId: string };
  'ready': { gameId: string };
  'request-rematch': { gameId: string }; // 请求再玩一次
  
  // 服务端发送的事件
  'game-state': GameState;
  'your-turn': { playerId: string };
  'game-over': { winner: string; scores: { [playerId: string]: number } };
  'error': { message: string };
  'player-joined': { playerId: string; gameId: string; playerName: string };
  'rematch-requested': { playerId: string; playerName: string }; // 有玩家请求再玩一次
  'rematch-started': GameState; // 再玩一次开始
}

// 玩家加入事件
export interface PlayerJoinedEvent {
  playerId: string;
  gameId: string;
  playerName: string;
  maxPlayers: number;
  currentPlayers: number;
} 