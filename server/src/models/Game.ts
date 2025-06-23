// server/src/models/Game.ts
// 干瞪眼游戏模型

import { Card, CardType, CardUtils } from './Card';

export interface Player {
  id: string;
  name: string;
  cards: Card[];
  isReady: boolean;
}

export interface CardPlay {
  playerId: string;
  cards: Card[];
  type: CardType;
  timestamp: number;
}

export type GamePhase = 'waiting' | 'playing' | 'finished';

export class Game {
  public id: string;
  public players: Player[] = [];
  public currentPlayerIndex: number = 0;
  public lastPlay: CardPlay | null = null;
  public phase: GamePhase = 'waiting';
  public winner: string | null = null;
  public createdAt: number;
  public deck: Card[] = []; // 剩余牌堆

  constructor(gameId: string) {
    this.id = gameId;
    this.createdAt = Date.now();
  }

  // 添加玩家到游戏
  addPlayer(playerId: string, playerName: string): boolean {
    // 检查是否已经存在
    if (this.players.find(p => p.id === playerId)) {
      return false;
    }

    // 检查房间是否已满 (最多2人)
    if (this.players.length >= 2) {
      return false;
    }

    const player: Player = {
      id: playerId,
      name: playerName,
      cards: [],
      isReady: false
    };

    this.players.push(player);
    return true;
  }

  // 移除玩家
  removePlayer(playerId: string): boolean {
    const index = this.players.findIndex(p => p.id === playerId);
    if (index === -1) return false;

    this.players.splice(index, 1);
    
    // 如果当前玩家被移除，调整索引
    if (this.currentPlayerIndex >= this.players.length) {
      this.currentPlayerIndex = 0;
    }

    // 如果游戏进行中且玩家不足，结束游戏
    if (this.phase === 'playing' && this.players.length < 2) {
      this.phase = 'finished';
    }

    return true;
  }

  // 开始游戏 - 发牌
  startGame(): boolean {
    if (this.players.length !== 2) return false;
    if (this.phase !== 'waiting') return false;

    // 创建并洗牌
    this.deck = CardUtils.shuffleDeck(CardUtils.createDeck());
    
    // 随机决定首出玩家
    this.currentPlayerIndex = Math.floor(Math.random() * 2);
    
    // 每个玩家先发5张牌
    this.players[0].cards = this.deck.splice(0, 5);
    this.players[1].cards = this.deck.splice(0, 5);
    
    // 首出玩家额外获得1张牌
    this.players[this.currentPlayerIndex].cards.push(this.deck.splice(0, 1)[0]);

    // 对每个玩家的手牌排序
    this.players.forEach(player => {
      player.cards = CardUtils.sortCards(player.cards);
    });

    this.phase = 'playing';
    this.lastPlay = null;

    return true;
  }

  // 出牌
  playCards(playerId: string, cards: Card[]): { success: boolean; error?: string } {
    // 基础验证
    if (this.phase !== 'playing') {
      return { success: false, error: '游戏未开始' };
    }

    const player = this.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, error: '玩家不存在' };
    }

    if (this.players[this.currentPlayerIndex].id !== playerId) {
      return { success: false, error: '不是你的回合' };
    }

    // 验证手牌
    if (!this.hasCards(player, cards)) {
      return { success: false, error: '手牌不足' };
    }

    // 识别牌型
    const cardType = CardUtils.identifyCardType(cards);
    if (!cardType) {
      return { success: false, error: '无效的牌型' };
    }

    // 验证出牌合法性
    const validation = this.validatePlay(cards, cardType);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // 执行出牌
    this.removeCardsFromPlayer(player, cards);
    
    this.lastPlay = {
      playerId,
      cards,
      type: cardType,
      timestamp: Date.now()
    };

    // 检查是否获胜
    if (player.cards.length === 0) {
      this.winner = playerId;
      this.phase = 'finished';
      return { success: true };
    }

    // 切换到下一个玩家
    this.nextPlayer();
    return { success: true };
  }

  // 过牌
  pass(playerId: string): { success: boolean; error?: string } {
    if (this.phase !== 'playing') {
      return { success: false, error: '游戏未开始' };
    }

    if (this.players[this.currentPlayerIndex].id !== playerId) {
      return { success: false, error: '不是你的回合' };
    }

    // 如果没有上一次出牌记录，不能过牌 (首出必须出牌)
    if (!this.lastPlay) {
      return { success: false, error: '首出不能过牌' };
    }

    // 切换到下一个玩家
    this.nextPlayer();

    // 检查是否所有其他玩家都过牌了
    // 在两人游戏中，一方过牌就轮到对方重新出牌
    if (this.isNewRound()) {
      this.lastPlay = null; // 清空上次出牌，获得新的出牌权
      
      // 获得新出牌权的玩家摸一张牌
      if (this.deck.length > 0) {
        const currentPlayer = this.getCurrentPlayer();
        if (currentPlayer) {
          const drawnCard = this.deck.splice(0, 1)[0];
          currentPlayer.cards.push(drawnCard);
          currentPlayer.cards = CardUtils.sortCards(currentPlayer.cards);
        }
      }
    }

    return { success: true };
  }

  // 验证出牌是否合法
  private validatePlay(cards: Card[], cardType: CardType): { valid: boolean; error?: string } {
    // 首出可以出任意合法牌型
    if (!this.lastPlay) {
      return { valid: true };
    }

    // 炸弹可以压制任何非炸弹牌型
    if (CardUtils.isBomb(cardType) && !CardUtils.isBomb(this.lastPlay.type)) {
      return { valid: true };
    }

    // 非炸弹不能压制炸弹
    if (!CardUtils.isBomb(cardType) && CardUtils.isBomb(this.lastPlay.type)) {
      return { valid: false, error: '需要更大的炸弹才能压制' };
    }

    // 炸弹之间的比较
    if (CardUtils.isBomb(cardType) && CardUtils.isBomb(this.lastPlay.type)) {
      const comparison = this.compareBombs(cards, cardType, this.lastPlay);
      if (comparison <= 0) {
        return { valid: false, error: '炸弹太小了' };
      }
      return { valid: true };
    }

    // 普通牌型必须相同
    if (cardType !== this.lastPlay.type) {
      return { valid: false, error: '牌型不匹配' };
    }

    // 比较大小
    const comparison = this.compareCardPlays(cards, cardType, this.lastPlay);
    if (comparison <= 0) {
      return { valid: false, error: '牌太小了' };
    }

    return { valid: true };
  }

  // 比较两次出牌的大小
  private compareCardPlays(newCards: Card[], newType: CardType, lastPlay: CardPlay): number {
    if (newType !== lastPlay.type) return 0;

    switch (newType) {
      case CardType.SINGLE:
        // 使用特殊规则进行单张比较
        if (CardUtils.canBeatSingleCard(newCards[0], lastPlay.cards[0])) {
          return 1; // 可以压制
        } else {
          return newCards[0].value === lastPlay.cards[0].value ? 0 : -1;
        }
      
      case CardType.PAIR:
        return CardUtils.comparePairs(newCards, lastPlay.cards);
      
      case CardType.STRAIGHT:
        return CardUtils.compareStraights(newCards, lastPlay.cards);
      
      default:
        return 0;
    }
  }

  // 比较炸弹大小
  private compareBombs(newCards: Card[], newType: CardType, lastPlay: CardPlay): number {
    // 王炸最大，可以压制任何炸弹
    if (newType === CardType.JOKER_BOMB) {
      return lastPlay.type === CardType.JOKER_BOMB ? 0 : 1;
    }

    // 任何炸弹都不能压制王炸
    if (lastPlay.type === CardType.JOKER_BOMB) {
      return -1;
    }

    // 四张炸弹 vs 三张炸弹
    if (newType === CardType.QUADRUPLE && lastPlay.type === CardType.TRIPLE) {
      return 1;
    }
    if (newType === CardType.TRIPLE && lastPlay.type === CardType.QUADRUPLE) {
      return -1;
    }

    // 同类型炸弹比较数值
    if (newType === lastPlay.type) {
      switch (newType) {
        case CardType.TRIPLE:
          return CardUtils.compareTriples(newCards, lastPlay.cards);
        case CardType.QUADRUPLE:
          return CardUtils.compareQuadruples(newCards, lastPlay.cards);
        default:
          return 0;
      }
    }

    return 0;
  }

  // 检查玩家是否拥有指定卡牌
  private hasCards(player: Player, cards: Card[]): boolean {
    for (const card of cards) {
      if (!player.cards.find(c => c.id === card.id)) {
        return false;
      }
    }
    return true;
  }

  // 从玩家手牌中移除卡牌
  private removeCardsFromPlayer(player: Player, cards: Card[]): void {
    for (const card of cards) {
      const index = player.cards.findIndex(c => c.id === card.id);
      if (index !== -1) {
        player.cards.splice(index, 1);
      }
    }
  }

  // 切换到下一个玩家
  private nextPlayer(): void {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
  }

  // 检查是否开始新一轮 (所有其他玩家都过牌)
  private isNewRound(): boolean {
    // 在两人游戏中，对方过牌就意味着新一轮开始
    return true;
  }

  // 获取当前玩家
  getCurrentPlayer(): Player | null {
    return this.players[this.currentPlayerIndex] || null;
  }

  // 获取游戏状态 (用于发送给客户端)
  getGameState(forPlayerId?: string): any {
    console.log(`获取游戏状态 for ${forPlayerId}:`, {
      phase: this.phase,
      players: this.players.map(p => ({ id: p.id, name: p.name, cardCount: p.cards.length }))
    });
    
    return {
      gameId: this.id,
      players: this.players.map(player => ({
        id: player.id,
        name: player.name,
        cards: forPlayerId === player.id ? player.cards : [], // 只发送自己的手牌
        cardCount: player.cards.length,
        isReady: player.isReady
      })),
      currentPlayerIndex: this.currentPlayerIndex,
      lastPlay: this.lastPlay,
      phase: this.phase,
      winner: this.winner,
      createdAt: this.createdAt,
      deckCount: this.deck.length // 剩余牌堆数量
    };
  }
} 