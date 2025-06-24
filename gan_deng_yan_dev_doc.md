# 干瞪眼卡牌游戏开发文档

## 项目概述
开发一个两人实时对战的干瞪眼卡牌游戏，支持WebSocket实时通信，快速部署到Railway平台。

## 技术栈
- **前端**: React 18 + TypeScript + Vite
- **后端**: Node.js + Express + Socket.io
- **样式**: Tailwind CSS
- **部署**: Railway (后续可迁移腾讯云)
- **版本控制**: Git + GitHub

## 项目结构
```
gan-deng-yan-game/
├── client/                     # 前端React应用
│   ├── src/
│   │   ├── components/         # 游戏组件
│   │   │   ├── GameBoard.tsx   # 游戏主界面
│   │   │   ├── PlayerHand.tsx  # 玩家手牌
│   │   │   ├── PlayArea.tsx    # 出牌区域
│   │   │   └── GameControls.tsx # 游戏控制按钮
│   │   ├── hooks/              # 自定义hooks
│   │   │   └── useSocket.ts    # Socket连接管理
│   │   ├── types/              # TypeScript类型定义
│   │   │   └── game.ts         # 游戏相关类型
│   │   ├── utils/              # 工具函数
│   │   │   ├── cardUtils.ts    # 卡牌工具函数
│   │   │   └── gameLogic.ts    # 游戏逻辑
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── server/                     # 后端Node.js应用
│   ├── src/
│   │   ├── models/             # 数据模型
│   │   │   ├── Card.ts         # 卡牌模型
│   │   │   ├── Player.ts       # 玩家模型
│   │   │   └── Game.ts         # 游戏模型
│   │   ├── services/           # 业务逻辑
│   │   │   ├── GameService.ts  # 游戏逻辑服务
│   │   │   └── CardService.ts  # 卡牌逻辑服务
│   │   ├── socket/             # Socket处理
│   │   │   └── gameHandlers.ts # 游戏事件处理
│   │   └── server.ts           # 服务器入口
│   ├── package.json
│   └── tsconfig.json
├── package.json                # 根目录package.json
└── README.md
```

## 开发阶段规划

### Phase 1 - MVP版本 (1-2天)
**目标**: 快速跑通基本流程，验证技术可行性

**功能范围**:
- ✅ 基础项目搭建和WebSocket连接
- ✅ 简单的房间匹配系统
- ✅ 基础发牌功能
- ✅ 单张牌出牌逻辑
- ✅ 对子出牌逻辑
- ✅ 基本的牌型比较
- ✅ 简单的胜负判定

**不包含**: 顺子、炸弹、特殊牌规则

### Phase 2 - 完整版本 (3-5天)
**功能扩展**:
- ✅ 顺子牌型
- ✅ 炸弹系统（三张、四张、王炸）
- ✅ 特殊牌规则（2、大小王）
- ✅ 完整的游戏流程
- ✅ 美化UI界面

### Phase 2.5 - 百搭功能 (1天)
**增强功能**:
- ✅ 大小王百搭：可替代任意牌组成炸弹
- ✅ 百搭顺子：大小王可在顺子中替代任意牌
- ✅ 百搭对子：1张普通牌+1张大小王=对子
- ✅ 智能验证：验证用户选择的百搭组合是否有效
- ✅ 王炸优先：大王+小王优先识别为王炸
- ✅ 百搭提示：UI显示百搭牌的组合信息

### Phase 3 - UI/UX大幅优化 (1天) ✨
**视觉升级**:
- ✅ **动态渐变背景**: 多色渐变动画背景效果
- ✅ **毛玻璃面板**: 现代化半透明backdrop-blur效果
- ✅ **3D卡牌系统**: 卡牌hover动画、阴影、光泽效果
- ✅ **特殊效果动画**: 
  - 特殊牌发光效果(specialCardGlow)
  - 炸弹脉冲动画(bombPulse) 
  - 数字2火焰标识
  - 王牌星星标识
- ✅ **按钮增强**: 渐变按钮、hover效果、光泽扫过动画
- ✅ **加载动画**: 增强spinner带发光效果
- ✅ **响应式设计**: 移动端适配优化
- ✅ **自定义滚动条**: 渐变样式滚动条

**交互升级**:
- ✅ **快捷键支持**:
  - Space/Enter: 出牌
  - P: 过牌
  - A: 全选/取消同点数牌
  - ESC: 清空选择
- ✅ **智能卡牌操作**:
  - 单击选择卡牌
  - 双击选择同点数牌
  - 卡牌tooltip提示
- ✅ **状态管理增强**: 防重复请求、详细连接状态

**技术解决**:
- ✅ React Hooks错误修复
- ✅ WebSocket连接优化
- ✅ 服务器端日志增强
- ✅ 端口冲突解决方案

## 核心数据模型

### 卡牌模型 (Card)
```typescript
interface Card {
  id: string;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'joker';
  rank: string; // '3'-'10', 'J', 'Q', 'K', 'A', '2', 'small_joker', 'big_joker'
  value: number; // 用于比较大小: 3=3, 4=4, ..., K=13, A=14, 2=15, 小王=16, 大王=17
  display: string; // 显示文本
}
```

### 牌型枚举
```typescript
enum CardType {
  SINGLE = 'single',        // 单张
  PAIR = 'pair',           // 对子
  STRAIGHT = 'straight',    // 顺子
  TRIPLE = 'triple',       // 三张炸弹
  QUADRUPLE = 'quadruple', // 四张炸弹
  JOKER_BOMB = 'joker_bomb' // 王炸
}
```

### 游戏状态
```typescript
interface GameState {
  gameId: string;
  players: Player[];
  currentPlayer: number;
  lastPlay: {
    playerId: string;
    cards: Card[];
    type: CardType;
  } | null;
  phase: 'waiting' | 'playing' | 'finished';
  winner: string | null;
}
```

## WebSocket事件定义

### 客户端发送事件
```typescript
// 加入游戏
'join-game': { playerName: string }

// 出牌
'play-cards': { 
  gameId: string;
  cards: Card[];
  type: CardType;
}

// 过牌
'pass': { gameId: string }

// 准备开始新局
'ready': { gameId: string }
```

### 服务端发送事件
```typescript
// 游戏状态更新
'game-state': GameState

// 轮到某玩家
'your-turn': { playerId: string }

// 游戏结束
'game-over': { 
  winner: string;
  scores: { [playerId: string]: number };
}

// 错误信息
'error': { message: string }

// 连接成功
'player-joined': { 
  playerId: string;
  gameId: string;
  playerName: string;
}
```

## 核心算法实现

### 卡牌比较逻辑
```typescript
// 比较两组牌的大小
function compareCards(play1: CardPlay, play2: CardPlay): number {
  // 1. 炸弹 > 非炸弹
  if (isBomb(play1.type) && !isBomb(play2.type)) return 1;
  if (!isBomb(play1.type) && isBomb(play2.type)) return -1;
  
  // 2. 相同牌型比较
  if (play1.type === play2.type) {
    return compareValue(play1.cards, play2.cards);
  }
  
  // 3. 不同非炸弹牌型不能比较
  return 0;
}
```

### 牌型识别
```typescript
function identifyCardType(cards: Card[]): CardType | null {
  if (cards.length === 1) return CardType.SINGLE;
  if (cards.length === 2) {
    if (isPair(cards)) return CardType.PAIR;
    if (isJokerBomb(cards)) return CardType.JOKER_BOMB;
  }
  if (cards.length === 3 && isTriple(cards)) return CardType.TRIPLE;
  if (cards.length === 4 && isQuadruple(cards)) return CardType.QUADRUPLE;
  if (cards.length >= 3 && isStraight(cards)) return CardType.STRAIGHT;
  
  return null; // 无效牌型
}
```

## 百搭功能技术实现

### 百搭牌型验证逻辑

#### 对子百搭
```typescript
// 检查是否是百搭对子（1张普通牌+1张大小王）
static isWildcardPair(cards: Card[]): boolean {
  if (cards.length !== 2) return false;
  const jokers = cards.filter(c => c.rank === 'small_joker' || c.rank === 'big_joker');
  const normalCards = cards.filter(c => c.rank !== 'small_joker' && c.rank !== 'big_joker');
  
  // 1张普通牌 + 1张大小王 = 对子
  return jokers.length === 1 && normalCards.length === 1;
}
```

#### 三张炸弹百搭
```typescript
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
```

#### 顺子百搭
```typescript
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
```

### 百搭牌型比较算法
```typescript
// 获取百搭牌型的实际数值（以普通牌为准）
static getTripleValue(cards: Card[]): number {
  const normalCards = cards.filter(c => c.rank !== 'small_joker' && c.rank !== 'big_joker');
  if (normalCards.length > 0) {
    // 以普通牌的数值为准
    return normalCards[0].value;
  }
  // 如果全是大小王，则按大王的数值
  return this.VALUE_MAP['big_joker'];
}
```

### 前端百搭提示实现
```typescript
// 百搭牌型提示组件
{(() => {
  const jokers = selectedCards.filter(c => c.rank === 'small_joker' || c.rank === 'big_joker');
  if (jokers.length > 0 && cardType !== CardType.JOKER_BOMB) {
    const normalCards = selectedCards.filter(c => c.rank !== 'small_joker' && c.rank !== 'big_joker');
    return (
      <p className="mt-1 text-cyan-300 text-xs">
        🎭 百搭组合：{jokers.length}张大小王 + {normalCards.length}张普通牌
      </p>
    );
  }
  return null;
})()}
```

## MVP版本实现重点

### 1. 基础WebSocket连接
```typescript
// 客户端连接逻辑
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected to server');
  socket.emit('join-game', { playerName: 'Player1' });
});
```

### 2. 简单房间匹配
- 服务器维护一个等待队列
- 两个玩家连接后自动匹配
- 创建游戏实例并开始

### 3. 基础出牌逻辑
```typescript
// 只实现单张和对子
function validatePlay(cards: Card[], lastPlay: CardPlay | null): boolean {
  const type = identifyCardType(cards);
  
  if (!lastPlay) return type !== null; // 首出任意合法牌型
  
  if (type === lastPlay.type) {
    return compareCards({cards, type}, lastPlay) > 0;
  }
  
  return false; // MVP版本不支持炸弹
}
```

## 部署配置

### Railway部署
1. **准备工作**
   ```bash
   # 根目录package.json
   {
     "name": "gan-deng-yan-game",
     "scripts": {
       "build": "cd client && npm run build && cd ../server && npm run build",
       "start": "cd server && npm start"
     }
   }
   ```

2. **环境变量**
   ```
   NODE_ENV=production
   PORT=3001
   CLIENT_URL=https://your-app.railway.app
   ```

3. **Railway配置文件** (railway.toml)
   ```toml
   [build]
   builder = "NIXPACKS"
   
   [deploy]
   startCommand = "npm start"
   ```

### 腾讯云迁移准备
```bash
# 服务器配置脚本 (deploy.sh)
#!/bin/bash
# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装PM2
sudo npm install -g pm2

# 克隆代码
git clone [your-repo-url]
cd gan-deng-yan-game

# 安装依赖并构建
npm install
npm run build

# 启动服务
pm2 start server/dist/server.js --name "gan-deng-yan"
pm2 startup
pm2 save
```

## 开发优先级

### Day 1 - 核心框架
1. ✅ 搭建React + Node.js项目结构
2. ✅ 配置WebSocket连接
3. ✅ 实现基础卡牌模型
4. ✅ 简单的游戏状态管理

### Day 2 - 基础游戏逻辑
1. ✅ 发牌逻辑
2. ✅ 单张牌出牌
3. ✅ 对子出牌
4. ✅ 简单的轮流出牌

### Day 3 - 部署和测试
1. ✅ Railway部署配置
2. ✅ 端到端测试
3. ✅ 基础UI优化

## 注意事项

### 开发建议
- **优先功能后UI**: 先实现核心游戏逻辑，界面可以很简陋
- **增量开发**: 每个功能都要能独立测试
- **状态管理**: 使用React的useState + useReducer，避免复杂状态库
- **错误处理**: WebSocket断线重连、无效操作提示

### 性能考虑
- 游戏状态只在必要时广播
- 卡牌图片使用CSS绘制，避免大量图片资源
- 客户端做基础验证，服务端做权威验证

### 测试策略
- 单人模式调试游戏逻辑
- 两个浏览器窗口测试实时对战
- 手机浏览器测试响应式布局

## UI/UX 优化方向 🎨

### Phase 3 - 视觉与交互升级 (3-5天)

#### 🎭 动画与过渡效果
- **卡牌动画**：
  - 发牌动画：从牌堆飞向玩家手牌
  - 出牌动画：卡牌从手牌飞向中央区域
  - 翻牌效果：卡牌翻转显示
  - 胜利动画：获胜玩家卡牌发光特效
  
- **状态过渡**：
  - 轮次切换时的平滑过渡
  - 牌型识别时的颜色渐变
  - 按钮hover和点击的微交互
  - 加载状态的骨架屏

#### 🎵 音效系统
- **游戏音效**：
  - 发牌声音：洗牌、发牌的真实音效
  - 出牌声音：不同牌型的特色音效
  - 炸弹音效：爆炸声 + 震动效果
  - 胜利音效：庆祝音乐
  
- **环境音乐**：
  - 背景音乐：轻松的休闲游戏BGM
  - 紧张音效：剩余卡牌较少时的紧张音乐
  - 音量控制：独立的音效和音乐音量调节

#### 🎨 视觉设计升级
- **卡牌设计**：
  - 3D卡牌效果：阴影、倾斜、反光
  - 特殊卡牌：2、大小王的独特视觉设计
  - 卡牌背面：精美的图案设计
  - 手牌排列：扇形排列更加自然

- **界面美化**：
  - 毛玻璃效果：现代化的半透明面板
  - 渐变背景：动态的颜色渐变
  - 图标系统：统一的图标风格
  - 字体优化：更好的中文字体渲染

#### 📱 响应式设计
- **多设备适配**：
  - 桌面端：大屏幕优化布局
  - 平板端：横屏和竖屏适配
  - 手机端：触摸友好的操作
  - PWA支持：可安装的Web应用

- **触控优化**：
  - 手势操作：滑动选牌、双击出牌
  - 震动反馈：出牌成功的触觉反馈
  - 大拇指区域：重要按钮在易触及区域
  - 防误操作：确认对话框

#### 🔥 高级交互功能
- **智能提示系统**：
  - 出牌建议：高亮可出的牌型
  - 牌型预览：实时显示选中牌的牌型
  - 对手信息：显示对手剩余牌数
  - 历史记录：显示最近几轮的出牌

- **个性化设置**：
  - 主题切换：深色/浅色模式
  - 卡牌风格：多种卡牌皮肤
  - 桌面背景：可更换的游戏背景
  - 快捷操作：自定义按键映射

#### 💫 社交功能
- **表情系统**：
  - 快速表情：常用的游戏表情
  - 动画表情：生动的动画反馈
  - 语音消息：短语音消息功能
  - 聊天功能：简单的文字聊天

- **成就系统**：
  - 游戏成就：各种游戏里程碑
  - 徽章收集：特殊成就的徽章
  - 统计数据：胜率、游戏次数等
  - 分享功能：分享精彩时刻

### Phase 4 - 高级功能 (5-7天)

#### 🤖 AI对手系统
- **AI难度等级**：
  - 新手AI：基础策略，出牌较保守
  - 中级AI：智能牌型选择
  - 高级AI：复杂策略，会算牌
  - 大师AI：接近人类高手水平

#### 🏆 竞技系统
- **排位赛**：
  - 等级系统：青铜到王者的晋升
  - 赛季奖励：每赛季的专属奖励
  - 匹配机制：相似水平的对手匹配
  - 防掉分保护：连胜保护机制

#### 👥 房间系统
- **多样化房间**：
  - 好友房：邀请好友对战
  - 快速匹配：随机匹配对手
  - 观战模式：观看其他玩家对战
  - 锦标赛：定期举办的比赛

## 当前待优化的细节 ⚡

### 🔧 即时改进建议 (1-2天内可完成)

#### 交互体验
- [ ] 卡牌选中时的视觉反馈更明显
- [ ] 出牌按钮的状态优化（禁用/启用）
- [ ] 添加"撤销选择"按钮
- [ ] 优化过牌确认流程
- [ ] 游戏结束后的重新开始功能

#### 视觉细节
- [ ] 手牌区域的固定高度，避免布局跳动
- [ ] 对手出牌区域的美化
- [ ] 当前轮次的明确指示
- [ ] 倒计时功能（防止长时间等待）
- [ ] 网络连接状态指示器

#### 用户体验
- [ ] 游戏规则说明页面
- [ ] 快捷键支持（空格键出牌、ESC取消选择）
- [ ] 错误提示的优化（更友好的错误信息）
- [ ] 加载状态的改进
- [ ] 断线重连机制

#### 性能优化
- [ ] 卡牌图片的懒加载
- [ ] WebSocket消息的防抖处理
- [ ] 内存泄漏检查和修复
- [ ] 移动端的性能优化

### 💡 创意功能建议

#### 游戏体验增强
- **智能出牌助手**：新手模式下提示最优出牌
- **回放系统**：可以回看整局游戏的过程
- **牌局分析**：游戏结束后的数据分析
- **练习模式**：与AI对战来熟悉规则

#### 视觉特效
- **粒子效果**：出牌时的粒子动画
- **卡牌光影**：根据牌型显示不同光效
- **环境渲染**：动态的背景场景
- **节日主题**：节假日的特殊界面主题

这份文档涵盖了从MVP到完整版本的所有技术细节，以及详细的UI/UX优化路线图。当前游戏的核心功能已经完善，接下来的重点应该放在提升用户体验和视觉表现上。