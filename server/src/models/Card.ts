// server/src/models/Card.ts
// 干瞪眼游戏卡牌模型

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'joker';
export type Rank = '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '2' | 'small_joker' | 'big_joker';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number;
  display: string;
}

export enum CardType {
  SINGLE = 'single',
  PAIR = 'pair',
  STRAIGHT = 'straight',
  TRIPLE = 'triple',
  QUADRUPLE = 'quadruple',
  JOKER_BOMB = 'joker_bomb'
}

// 卡牌工具类
export class CardUtils {
  // 数值映射 - 按照干瞪眼规则: 3最小，2是最大的数字牌，小王大王最大
  private static readonly VALUE_MAP: { [key in Rank]: number } = {
    '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15,
    'small_joker': 16, 'big_joker': 17
  };

  // 花色符号
  private static readonly SUIT_SYMBOLS: { [key in Suit]: string } = {
    'hearts': '♥',
    'diamonds': '♦',
    'clubs': '♣',
    'spades': '♠',
    'joker': ''
  };

  // 创建标准54张牌组
  static createDeck(): Card[] {
    const cards: Card[] = [];
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks: Rank[] = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
    
    // 创建普通牌 (52张)
    suits.forEach(suit => {
      ranks.forEach(rank => {
        const card: Card = {
          id: `${suit}_${rank}`,
          suit,
          rank,
          value: this.VALUE_MAP[rank],
          display: `${rank}${this.SUIT_SYMBOLS[suit]}`
        };
        cards.push(card);
      });
    });

    // 添加大小王 (2张)
    cards.push({
      id: 'joker_small',
      suit: 'joker',
      rank: 'small_joker',
      value: this.VALUE_MAP['small_joker'],
      display: '小王'
    });

    cards.push({
      id: 'joker_big',
      suit: 'joker',
      rank: 'big_joker',
      value: this.VALUE_MAP['big_joker'],
      display: '大王'
    });

    return cards;
  }

  // 洗牌算法 (Fisher-Yates)
  static shuffleDeck(cards: Card[]): Card[] {
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // 识别牌型 - 完整版本支持所有牌型
  static identifyCardType(cards: Card[]): CardType | null {
    if (!cards || cards.length === 0) return null;

    const sortedCards = this.sortCards(cards);

    // 单张
    if (cards.length === 1) {
      return CardType.SINGLE;
    }

    // 两张牌的情况
    if (cards.length === 2) {
      // 王炸：大王+小王
      if (this.isJokerBomb(sortedCards)) {
        return CardType.JOKER_BOMB;
      }
      // 对子：两张相同点数
      if (this.isValidPair(sortedCards)) {
        return CardType.PAIR;
      }
    }

    // 三张牌的情况
    if (cards.length === 3) {
      // 三张炸弹：三张相同点数
      if (this.isTriple(sortedCards)) {
        return CardType.TRIPLE;
      }
      // 顺子：三张连续
      if (this.isStraight(sortedCards)) {
        return CardType.STRAIGHT;
      }
    }

    // 四张牌的情况
    if (cards.length === 4) {
      // 四张炸弹：四张相同点数
      if (this.isQuadruple(sortedCards)) {
        return CardType.QUADRUPLE;
      }
      // 顺子：四张连续
      if (this.isStraight(sortedCards)) {
        return CardType.STRAIGHT;
      }
    }

    // 五张及以上：只能是顺子
    if (cards.length >= 5) {
      if (this.isStraight(sortedCards)) {
        return CardType.STRAIGHT;
      }
    }

    return null;
  }

  // 比较两张单牌的大小
  static compareSingleCards(card1: Card, card2: Card): number {
    return card1.value - card2.value;
  }

  // 检查是否可以压制指定的单张牌（特殊规则）
  static canBeatSingleCard(newCard: Card, lastCard: Card): boolean {
    // 数字2的特殊规则：只能被小王、大王或炸弹压制
    if (lastCard.rank === '2') {
      return newCard.rank === 'small_joker' || newCard.rank === 'big_joker';
    }
    
    // 普通牌按数值比较
    return newCard.value > lastCard.value;
  }

  // 检查是否是特殊牌（2、大小王）
  static isSpecialCard(card: Card): boolean {
    return ['2', 'small_joker', 'big_joker'].includes(card.rank);
  }

  // 比较两个对子的大小
  static comparePairs(pair1: Card[], pair2: Card[]): number {
    if (pair1.length !== 2 || pair2.length !== 2) return 0;
    const value1 = this.getPairValue(pair1);
    const value2 = this.getPairValue(pair2);
    return value1 - value2;
  }

  // 验证是否是合法的对子（包含百搭）
  static isValidPair(cards: Card[]): boolean {
    if (cards.length !== 2) return false;
    
    // 普通对子
    if (cards[0].rank === cards[1].rank) {
      return true;
    }
    
    // 百搭对子
    return this.isWildcardPair(cards);
  }

  // 验证是否是王炸（大王+小王）
  static isJokerBomb(cards: Card[]): boolean {
    if (cards.length !== 2) return false;
    const ranks = cards.map(c => c.rank).sort();
    return ranks[0] === 'small_joker' && ranks[1] === 'big_joker';
  }

  // 检查是否是百搭对子（1张普通牌+1张大小王）
  static isWildcardPair(cards: Card[]): boolean {
    if (cards.length !== 2) return false;
    const jokers = cards.filter(c => c.rank === 'small_joker' || c.rank === 'big_joker');
    const normalCards = cards.filter(c => c.rank !== 'small_joker' && c.rank !== 'big_joker');
    
    // 1张普通牌 + 1张大小王 = 对子
    return jokers.length === 1 && normalCards.length === 1;
  }

  // 验证是否是三张炸弹（包含百搭）
  static isTriple(cards: Card[]): boolean {
    if (cards.length !== 3) return false;
    
    // 先检查是否全是相同点数
    if (cards.every(card => card.rank === cards[0].rank)) {
      return true;
    }
    
    // 检查百搭组合
    return this.isWildcardTriple(cards);
  }

  // 验证是否是四张炸弹（包含百搭）
  static isQuadruple(cards: Card[]): boolean {
    if (cards.length !== 4) return false;
    
    // 先检查是否全是相同点数
    if (cards.every(card => card.rank === cards[0].rank)) {
      return true;
    }
    
    // 检查百搭组合
    return this.isWildcardQuadruple(cards);
  }

  // 检查是否是百搭三张炸弹
  static isWildcardTriple(cards: Card[]): boolean {
    if (cards.length !== 3) return false;
    const jokers = cards.filter(c => c.rank === 'small_joker' || c.rank === 'big_joker');
    const normalCards = cards.filter(c => c.rank !== 'small_joker' && c.rank !== 'big_joker');
    
    // 2张相同普通牌 + 1张大小王 = 三张炸弹
    if (jokers.length === 1 && normalCards.length === 2) {
      return normalCards[0].rank === normalCards[1].rank;
    }
    
    // 1张普通牌 + 2张大小王 = 三张炸弹
    if (jokers.length === 2 && normalCards.length === 1) {
      return true;
    }
    
    return false;
  }

  // 检查是否是百搭四张炸弹
  static isWildcardQuadruple(cards: Card[]): boolean {
    if (cards.length !== 4) return false;
    const jokers = cards.filter(c => c.rank === 'small_joker' || c.rank === 'big_joker');
    const normalCards = cards.filter(c => c.rank !== 'small_joker' && c.rank !== 'big_joker');
    
    // 3张相同普通牌 + 1张大小王 = 四张炸弹
    if (jokers.length === 1 && normalCards.length === 3) {
      return normalCards.every(card => card.rank === normalCards[0].rank);
    }
    
    // 2张相同普通牌 + 2张大小王 = 四张炸弹  
    if (jokers.length === 2 && normalCards.length === 2) {
      return normalCards[0].rank === normalCards[1].rank;
    }
    
    return false;
  }

  // 验证是否是顺子（包含百搭）
  static isStraight(cards: Card[]): boolean {
    if (cards.length < 3) return false;
    
    // 数字2仍然不能参与顺子
    if (cards.some(card => card.rank === '2')) {
      return false;
    }

    // 分离大小王和普通牌
    const jokers = cards.filter(c => c.rank === 'small_joker' || c.rank === 'big_joker');
    const normalCards = cards.filter(c => c.rank !== 'small_joker' && c.rank !== 'big_joker');
    
    // 如果没有大小王，按原逻辑检查
    if (jokers.length === 0) {
      return this.isNormalStraight(normalCards);
    }
    
    // 有大小王的情况，检查是否能组成顺子
    return this.isWildcardStraight(normalCards, jokers.length);
  }

  // 检查普通顺子（无百搭）
  static isNormalStraight(cards: Card[]): boolean {
    if (cards.length < 3) return false;
    
    const sortedCards = this.sortCards(cards);
    for (let i = 1; i < sortedCards.length; i++) {
      if (sortedCards[i].value - sortedCards[i-1].value !== 1) {
        return false;
      }
    }
    return true;
  }

  // 检查百搭顺子
  static isWildcardStraight(normalCards: Card[], jokerCount: number): boolean {
    if (normalCards.length + jokerCount < 3) return false;
    
    const sortedNormal = this.sortCards(normalCards);
    const totalLength = normalCards.length + jokerCount;
    
    // 如果普通牌有重复，无法组成顺子
    for (let i = 1; i < sortedNormal.length; i++) {
      if (sortedNormal[i].value === sortedNormal[i-1].value) {
        return false;
      }
    }
    
    // 检查是否能用大小王填补空隙组成连续顺子
    if (sortedNormal.length === 0) {
      // 全是大小王，可以组成任意顺子
      return jokerCount >= 3;
    }
    
    // 尝试所有可能的顺子起点
    const minPossibleStart = Math.max(3, sortedNormal[0].value - jokerCount);
    const maxPossibleStart = Math.min(14 - totalLength + 1, sortedNormal[sortedNormal.length - 1].value);
    
    for (let start = minPossibleStart; start <= maxPossibleStart && start >= 3; start++) {
      const end = start + totalLength - 1;
    
      // 检查这个范围是否有效（不能超过A=14，除非包含2但2不能在顺子中）
      if (end > 14) continue;
      
      // 检查是否能用现有牌+大小王填满这个范围
      let neededJokers = 0;
      let normalIndex = 0;
      
      for (let pos = start; pos <= end; pos++) {
        if (normalIndex < sortedNormal.length && sortedNormal[normalIndex].value === pos) {
          // 这个位置有普通牌
          normalIndex++;
        } else {
          // 这个位置需要大小王
          neededJokers++;
        }
      }
      
      // 如果需要的大小王数量不超过实际拥有的，且所有普通牌都被使用
      if (neededJokers <= jokerCount && normalIndex === sortedNormal.length) {
        return true;
      }
    }
    
    return false;
  }

  // 比较顺子大小（按最小的牌比较）
  static compareStraights(straight1: Card[], straight2: Card[]): number {
    const minValue1 = this.getStraightMinValue(straight1);
    const minValue2 = this.getStraightMinValue(straight2);
    
    // 如果新顺子包含大小王，检查是否能智能选择更优的解释
    const hasJoker1 = straight1.some(c => c.rank === 'small_joker' || c.rank === 'big_joker');
    
    if (hasJoker1) {
      // 对于百搭顺子，尝试找到能够压制目标顺子的最优数值
      const bestValue = this.getBestStraightValueToBeat(straight1, minValue2);
      if (bestValue !== null) {
        return bestValue - minValue2;
      }
    }
    
    return minValue1 - minValue2;
  }

  // 检查百搭顺子是否能压制指定顺子
  static canWildcardStraightBeat(newCards: Card[], lastCards: Card[]): boolean {
    if (newCards.length !== lastCards.length) return false;
    
    const lastMinValue = this.getStraightMinValue(lastCards);
    const newPossibleValues = this.getAllPossibleStraightValues(newCards);
    
    // 检查新顺子是否有任何一种解释能够压制目标顺子
    return newPossibleValues.some(value => value > lastMinValue);
  }

  // 获取百搭顺子的所有可能数值（用于接牌时智能选择）
  static getAllPossibleStraightValues(cards: Card[]): number[] {
    const normalCards = cards.filter(c => c.rank !== 'small_joker' && c.rank !== 'big_joker');
    const jokerCount = cards.length - normalCards.length;
    
    if (normalCards.length === 0) {
      // 全是大小王，可以组成任意顺子，返回所有可能的起始值
      const possibilities: number[] = [];
      const totalLength = cards.length;
      for (let start = 3; start + totalLength - 1 <= 14; start++) {
        possibilities.push(start);
      }
      return possibilities;
    }
    
    const sortedNormal = this.sortCards(normalCards);
    const totalLength = cards.length;
    const possibilities: number[] = [];
    
    // 尝试所有可能的顺子起点，收集有效的起始值
    const minPossibleStart = Math.max(3, sortedNormal[0].value - jokerCount);
    const maxPossibleStart = Math.min(14 - totalLength + 1, sortedNormal[sortedNormal.length - 1].value);
    
    for (let start = minPossibleStart; start <= maxPossibleStart && start >= 3; start++) {
      const end = start + totalLength - 1;
      if (end > 14) continue; // 不能超过A
      
      // 检查是否能用现有牌+大小王填满这个范围
      let neededJokers = 0;
      let normalIndex = 0;
      let canForm = true;
      
      for (let pos = start; pos <= end; pos++) {
        if (normalIndex < sortedNormal.length && sortedNormal[normalIndex].value === pos) {
          normalIndex++;
        } else {
          neededJokers++;
        }
      }
      
      // 如果这种组合可行，记录起始值
      if (neededJokers <= jokerCount && normalIndex === sortedNormal.length) {
        possibilities.push(start);
      }
    }
    
    return possibilities;
  }

  // 获取顺子的最小数值（处理百搭） - 主动出牌时使用
  static getStraightMinValue(cards: Card[]): number {
    const possibilities = this.getAllPossibleStraightValues(cards);
    return possibilities.length > 0 ? Math.min(...possibilities) : 3;
  }

  // 获取百搭顺子用于接牌的最优数值
  static getBestStraightValueToBeat(newCards: Card[], targetMinValue: number): number | null {
    const possibilities = this.getAllPossibleStraightValues(newCards);
    
    // 找到能够压制目标顺子的最小值
    const validValues = possibilities.filter(value => value > targetMinValue);
    
    if (validValues.length === 0) return null;
    return Math.min(...validValues);
  }

  // 比较三张炸弹大小
  static compareTriples(triple1: Card[], triple2: Card[]): number {
    const value1 = this.getTripleValue(triple1);
    const value2 = this.getTripleValue(triple2);
    return value1 - value2;
  }

  // 比较四张炸弹大小
  static compareQuadruples(quad1: Card[], quad2: Card[]): number {
    const value1 = this.getQuadrupleValue(quad1);
    const value2 = this.getQuadrupleValue(quad2);
    return value1 - value2;
  }

  // 获取三张炸弹的实际数值（处理百搭）
  static getTripleValue(cards: Card[]): number {
    const normalCards = cards.filter(c => c.rank !== 'small_joker' && c.rank !== 'big_joker');
    if (normalCards.length > 0) {
      // 以普通牌的数值为准
      return normalCards[0].value;
    }
    // 如果全是大小王，则按大王的数值
    return this.VALUE_MAP['big_joker'];
  }

  // 获取四张炸弹的实际数值（处理百搭）
  static getQuadrupleValue(cards: Card[]): number {
    const normalCards = cards.filter(c => c.rank !== 'small_joker' && c.rank !== 'big_joker');
    if (normalCards.length > 0) {
      // 以普通牌的数值为准
      return normalCards[0].value;
    }
    // 如果全是大小王，则按大王的数值
    return this.VALUE_MAP['big_joker'];
  }

  // 获取百搭对子的实际数值
  static getPairValue(cards: Card[]): number {
    const normalCards = cards.filter(c => c.rank !== 'small_joker' && c.rank !== 'big_joker');
    if (normalCards.length > 0) {
      // 以普通牌的数值为准
      return normalCards[0].value;
    }
    // 如果全是大小王，则按大王的数值
    return this.VALUE_MAP['big_joker'];
  }

  // 检查是否是炸弹类型
  static isBomb(cardType: CardType): boolean {
    return [CardType.TRIPLE, CardType.QUADRUPLE, CardType.JOKER_BOMB].includes(cardType);
  }

  // 对手牌按数值排序
  static sortCards(cards: Card[]): Card[] {
    return [...cards].sort((a, b) => a.value - b.value);
  }
} 