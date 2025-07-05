// server/src/models/Game.ts
// 干瞪眼游戏模型

import { Card, CardType, CardUtils } from './Card';

export interface Player {
  id: string;
  name: string;
  cards: Card[];
  isReady: boolean;
  wantsRematch?: boolean; // 是否想要再玩一次
}

export type GamePhase = 'waiting' | 'playing' | 'finished';

export interface CardPlay {
  playerId: string;
  cards: Card[];
  type: CardType;
  timestamp: number;
}

export class Game {
  public id: string;
  public players: Player[] = [];
  public currentPlayerIndex: number = 0;
  public lastPlay: CardPlay | null = null;
  public phase: GamePhase = 'waiting';
  public winner: string | null = null;
  public lastWinner: string | null = null; // 上一局的获胜者
  public createdAt: number;
  public deck: Card[] = []; // 剩余牌堆
  public discardPile: Card[] = []; // 已出牌堆，用于重新洗牌
  public maxPlayers: number; // 房间最大人数 (2-6)
  public consecutivePasses: number = 0; // 连续过牌计数
  public lastPlayerId: string | null = null; // 最后出牌的玩家ID

  constructor(gameId: string, maxPlayers: number = 2) {
    this.id = gameId;
    this.maxPlayers = Math.min(Math.max(maxPlayers, 2), 6); // 确保在2-6之间
    this.createdAt = Date.now();
  }

  // 添加玩家到游戏
  addPlayer(playerId: string, playerName: string): boolean {
    // 检查是否已经存在
    if (this.players.find(p => p.id === playerId)) {
      return false;
    }

    // 检查房间是否已满
    if (this.players.length >= this.maxPlayers) {
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
    if (this.players.length < 2) return false;
    if (this.phase !== 'waiting') return false;

    // 创建并洗牌
    this.deck = CardUtils.shuffleDeck(CardUtils.createDeck());
    this.discardPile = [];
    
    // 随机决定首出玩家
    this.currentPlayerIndex = Math.floor(Math.random() * this.players.length);
    
    // 每个玩家先发5张牌
    for (let i = 0; i < this.players.length; i++) {
      this.players[i].cards = this.deck.splice(0, 5);
    }
    
    // 首出玩家额外获得1张牌
    this.players[this.currentPlayerIndex].cards.push(this.deck.splice(0, 1)[0]);

    // 对每个玩家的手牌排序
    this.players.forEach(player => {
      player.cards = CardUtils.sortCards(player.cards);
    });

    this.phase = 'playing';
    this.lastPlay = null;
    this.consecutivePasses = 0;
    this.lastPlayerId = null;

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
    
    // 将出的牌加入弃牌堆
    this.discardPile.push(...cards);
    
    this.lastPlay = {
      playerId,
      cards,
      type: cardType,
      timestamp: Date.now()
    };

    // 更新多人游戏状态
    this.lastPlayerId = playerId;
    this.consecutivePasses = 0; // 重置连续过牌计数

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

    // 增加连续过牌计数
    this.consecutivePasses++;

    // 切换到下一个玩家
    this.nextPlayer();

    // 检查是否所有其他玩家都过牌了
    if (this.isNewRound()) {
      this.lastPlay = null; // 清空上次出牌，获得新的出牌权
      this.consecutivePasses = 0; // 重置过牌计数
      
      // 获得新出牌权的玩家摸一张牌
      this.drawCardForCurrentPlayer();
    }

    return { success: true };
  }

  // 为当前玩家摸牌（包含牌堆耗尽时的重新洗牌逻辑）
  private drawCardForCurrentPlayer(): void {
    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer) return;

    // 如果牌堆为空，重新洗牌
    if (this.deck.length === 0 && this.discardPile.length > 0) {
      // 保留最后一次出牌不参与洗牌
      const lastPlayCards = this.lastPlay ? [...this.lastPlay.cards] : [];
      const cardsToShuffle = this.discardPile.filter(card => 
        !lastPlayCards.some(lastCard => lastCard.id === card.id)
      );
      
      if (cardsToShuffle.length > 0) {
        this.deck = CardUtils.shuffleDeck(cardsToShuffle);
        this.discardPile = lastPlayCards; // 只保留最后出的牌
        console.log(`牌堆重新洗牌，新牌堆: ${this.deck.length}张，弃牌堆: ${this.discardPile.length}张`);
      }
    }

    // 摸牌
    if (this.deck.length > 0) {
      const drawnCard = this.deck.splice(0, 1)[0];
      currentPlayer.cards.push(drawnCard);
      currentPlayer.cards = CardUtils.sortCards(currentPlayer.cards);
      console.log(`${currentPlayer.name} 摸了一张牌，剩余手牌: ${currentPlayer.cards.length}张`);
    }
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
    // 如果连续过牌次数等于除了最后出牌者外的所有玩家数，则开始新轮次
    return this.consecutivePasses >= this.players.length - 1;
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
        isReady: player.isReady,
        wantsRematch: player.wantsRematch || false
      })),
      currentPlayerIndex: this.currentPlayerIndex,
      lastPlay: this.lastPlay,
      phase: this.phase,
      winner: this.winner,
      lastWinner: this.lastWinner,
      createdAt: this.createdAt,
      deckCount: this.deck.length, // 剩余牌堆数量
      discardPileCount: this.discardPile.length, // 已出牌堆数量
      consecutivePasses: this.consecutivePasses, // 连续过牌次数
      lastPlayerId: this.lastPlayerId
    };
  }

  // 重置游戏为再玩一次状态
  resetForRematch(lastWinner: string | null): void {
    // 保存上一局获胜者
    this.lastWinner = lastWinner;
    
    // 重置游戏状态
    this.phase = 'waiting';
    this.winner = null;
    this.lastPlay = null;
    this.deck = [];
    this.discardPile = [];
    this.consecutivePasses = 0;
    this.lastPlayerId = null;
    
    // 重置所有玩家状态
    this.players.forEach(player => {
      player.cards = [];
      player.isReady = false;
      player.wantsRematch = false;
    });
    
    // 设置首出玩家为上一局的输家
    if (lastWinner) {
      const loserIndex = this.players.findIndex(p => p.id !== lastWinner);
      this.currentPlayerIndex = loserIndex >= 0 ? loserIndex : 0;
    } else {
      this.currentPlayerIndex = 0;
    }
    
    console.log(`游戏重置完成，下一局由 ${this.players[this.currentPlayerIndex]?.name} 先出牌`);
  }
} 