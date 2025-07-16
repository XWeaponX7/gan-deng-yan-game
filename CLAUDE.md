# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a real-time card game called "干瞪眼" (Gan Deng Yan) - a Chinese shedding-type card game for 2-6 players. The project is built with React + TypeScript frontend and Node.js + Socket.io backend, featuring real-time multiplayer gameplay with WebSocket communication.

## Common Development Commands

### Development
```bash
# Install all dependencies (root, client, server)
npm run install:all

# Start development servers (both frontend and backend)
npm run dev

# Start individual services
npm run dev:client    # Frontend only (port 5173)
npm run dev:server    # Backend only (port 3001)
```

### Building and Type Checking
```bash
# Build production version
npm run build

# Type checking
cd client && npm run tsc    # Frontend TypeScript check
cd server && npm run tsc    # Backend TypeScript check

# Linting (client only)
cd client && npm run lint
```

### Testing and Development
```bash
# Test server health
curl http://localhost:3001

# Test with two browser windows at http://localhost:5173
# Use different nicknames to test multiplayer functionality
```

## Architecture Overview

### Project Structure
```
gan_deng_yan/
├── client/                 # React frontend (port 5173)
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/         # Custom hooks (useSocket.ts)
│   │   ├── utils/         # Utility functions (cardUtils.ts, uiUtils.ts)
│   │   ├── types/         # TypeScript definitions (game.ts)
│   │   └── App.tsx        # Main application
├── server/                # Node.js backend (port 3001)
│   ├── src/
│   │   ├── models/        # Data models (Card.ts, Game.ts)
│   │   ├── services/      # Business logic services
│   │   ├── socket/        # WebSocket event handlers
│   │   └── server.ts      # Server entry point
├── docs/                  # Comprehensive documentation
└── .cursorrules          # Development standards and rules
```

### Core Components

**Frontend (client/src/)**:
- `GameBoard.tsx` - Main game interface component
- `TurnTimer.tsx` - 20-second turn timer component
- `VictoryEffect.tsx` - Victory animation component
- `useSocket.ts` - WebSocket connection management hook
- `cardUtils.ts` - Client-side card logic (must match server)
- `uiUtils.ts` - UI utility functions

**Backend (server/src/)**:
- `Game.ts` - Core game logic and state management
- `Card.ts` - Card model and game rule implementations
- `server.ts` - Express server with Socket.io integration

### Game Architecture

The game implements a sophisticated card game with:

**Card Types & Rules**:
- Standard 54-card deck (52 cards + 2 jokers)
- Six card types: Single, Pair, Straight, Triple Bomb, Quadruple Bomb, Joker Bomb
- Special rules for card "2" (only beaten by jokers or bombs)
- Wildcard system where jokers can substitute any card
- Complex straight validation with wildcard support

**Game Flow**:
1. Players join and are auto-matched
2. Cards dealt (5 to each player, +1 to first player)
3. Turn-based gameplay with 20-second time limit
4. Draw card when gaining new play rights
5. Victory when first player empties hand

## Critical Development Guidelines

### Frontend-Backend Consistency
**ALWAYS ensure card logic is identical between client and server**:
- `client/src/utils/cardUtils.ts` (ClientCardUtils class)
- `server/src/models/Card.ts` (CardUtils class)

Any changes to game rules must be updated in BOTH files simultaneously.

### WebSocket Events
Key Socket.io events:
- `join-game` - Player joins with nickname
- `play-cards` - Player plays cards
- `pass` - Player passes turn
- `game-state` - Server broadcasts game state
- `turn-timeout` - 20-second turn timer expires

### Card Type System
The game uses an enum-based card type system:
```typescript
enum CardType {
  SINGLE = 'single',        // Single card
  PAIR = 'pair',           // Two same rank cards
  STRAIGHT = 'straight',    // 3+ consecutive cards
  TRIPLE = 'triple',       // Three same rank (bomb)
  QUADRUPLE = 'quadruple', // Four same rank (bomb)
  JOKER_BOMB = 'joker_bomb' // Big joker + small joker (strongest)
}
```

### Wildcard Logic
Complex wildcard substitution rules:
- Jokers can substitute in pairs, triples, quadruples, and straights
- Joker bomb (big + small joker) takes priority over wildcard pairs
- Wildcard straights cannot include card "2"
- Multiple possible interpretations for wildcard cards are intelligently handled

## Development Workflow

### Before Making Changes
1. Run `npm run tsc` in both client and server to check types
2. Understand the existing game rules in `docs/gan_deng_yan_rules.md`
3. Check `.cursorrules` for detailed development standards

### When Modifying Game Logic
1. **ALWAYS** update both client and server card utilities
2. Test wildcard combinations thoroughly
3. Verify bomb beating logic works correctly
4. Update documentation if rules change

### When Adding Features
1. Consider mobile responsiveness (game is mobile-optimized)
2. Follow existing UI patterns (glassmorphism, gradients)
3. Maintain 60fps animations and fast interaction response (80ms)
4. Update relevant docs files when complete

### Commit Standards
Use Chinese commit messages with this format:
```
feat: 新功能描述
fix: Bug修复描述  
docs: 文档更新描述
```

Always run `npm run build` before committing to ensure build success.

## Key Technical Details

### State Management
- React hooks-based state management (no external libraries)
- Game state synchronized via WebSocket
- Client-side validation with server-side authority

### UI/UX Features
- Modern glassmorphism design with dynamic gradients
- 3D card effects with hover animations
- Special card visual indicators (borders, glows, particles)
- Responsive design optimized for mobile and desktop
- Keyboard shortcuts (Space/Enter, P, A, ESC)
- 80ms click feedback for enhanced responsiveness

### Performance Considerations
- Efficient card sorting and validation algorithms
- Optimized WebSocket message handling
- Hardware-accelerated CSS animations
- Careful memory management for game state

### Testing Strategy
- Use two browser windows for multiplayer testing
- Test wildcard combinations extensively
- Verify special card rules (card "2" restrictions)
- Test mobile touch interactions
- Validate WebSocket connection stability

## Important Files to Review

When working on this project, familiarize yourself with:
- `docs/gan_deng_yan_rules.md` - Complete game rules
- `.cursorrules` - Detailed development standards
- `client/src/types/game.ts` - Core type definitions
- `docs/gan_deng_yan_dev_doc.md` - Technical implementation details

## Deployment

The project is configured for Railway deployment:
- Build command: `npm run build`
- Start command: `npm start`
- Environment variables: `NODE_ENV`, `PORT`, `CLIENT_URL`

The game is production-ready with proper error handling, reconnection logic, and optimized performance.