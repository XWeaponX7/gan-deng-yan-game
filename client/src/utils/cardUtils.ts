// client/src/utils/cardUtils.ts
// 客户端卡牌工具函数

import { Card, CardType } from '../types/game';

export class ClientCardUtils {
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

  // 检查是否是百搭对子（1张普通牌+1张大小王）
  static isWildcardPair(cards: Card[]): boolean {
    if (cards.length !== 2) return false;
    const jokers = cards.filter(c => c.rank === 'small_joker' || c.rank === 'big_joker');
    const normalCards = cards.filter(c => c.rank !== 'small_joker' && c.rank !== 'big_joker');
    
    // 1张普通牌 + 1张大小王 = 对子
    return jokers.length === 1 && normalCards.length === 1;
  }

  // 验证是否是王炸（大王+小王）
  static isJokerBomb(cards: Card[]): boolean {
    if (cards.length !== 2) return false;
    const ranks = cards.map(c => c.rank).sort();
    return ranks[0] === 'small_joker' && ranks[1] === 'big_joker';
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
    
    // 计算最小可能的顺子范围
    const minValue = sortedNormal[0].value;
    const maxValue = sortedNormal[sortedNormal.length - 1].value;
    const currentSpan = maxValue - minValue + 1;
    
    // 需要的牌数应该等于总牌数
    const neededGaps = currentSpan - sortedNormal.length;
    
    return neededGaps <= jokerCount && currentSpan === totalLength;
  }

  // 检查是否是炸弹类型
  static isBomb(cardType: CardType): boolean {
    return [CardType.TRIPLE, CardType.QUADRUPLE, CardType.JOKER_BOMB].includes(cardType);
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

  // 验证是否是合法的牌型
  static validateCards(cards: Card[]): boolean {
    return this.identifyCardType(cards) !== null;
  }

  // 按数值排序卡牌
  static sortCards(cards: Card[]): Card[] {
    return [...cards].sort((a, b) => a.value - b.value);
  }

  // 获取牌型显示名称
  static getCardTypeName(type: CardType): string {
    switch (type) {
      case CardType.SINGLE:
        return '单张';
      case CardType.PAIR:
        return '对子';
      case CardType.STRAIGHT:
        return '顺子';
      case CardType.TRIPLE:
        return '三张炸弹';
      case CardType.QUADRUPLE:
        return '四张炸弹';
      case CardType.JOKER_BOMB:
        return '王炸';
      default:
        return '未知';
    }
  }

  // 获取牌型的颜色样式（用于前端显示）
  static getCardTypeColor(type: CardType): string {
    switch (type) {
      case CardType.SINGLE:
      case CardType.PAIR:
        return 'text-blue-400';
      case CardType.STRAIGHT:
        return 'text-green-400';
      case CardType.TRIPLE:
        return 'text-orange-400';
      case CardType.QUADRUPLE:
        return 'text-red-400';
      case CardType.JOKER_BOMB:
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  }
} 