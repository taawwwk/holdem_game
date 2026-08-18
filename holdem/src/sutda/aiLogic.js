import { createDeck } from './deck.js'
import { DEFAULT_RULES, compareHands, evaluateHand } from './handEvaluator.js'

export const BOT_PROFILES = [
  {
    name: '타짜',
    avatar: '🎴',
    accent: 'rose',
    style: { aggression: 0.62, bluff: 0.22, tightness: 0.04, label: '승부사' },
  },
  {
    name: '영감',
    avatar: '🧓',
    accent: 'amber',
    style: { aggression: 0.26, bluff: 0.04, tightness: 0.15, label: '신중' },
  },
  {
    name: '먹쇠',
    avatar: '🐗',
    accent: 'violet',
    style: { aggression: 0.58, bluff: 0.34, tightness: -0.08, label: '허풍' },
  },
  {
    name: '셈돌',
    avatar: '🧮',
    accent: 'emerald',
    style: { aggression: 0.42, bluff: 0.07, tightness: 0.02, label: '계산' },
  },
  {
    name: '막내',
    avatar: '🐣',
    accent: 'cyan',
    style: { aggression: 0.31, bluff: 0.15, tightness: -0.1, label: '초짜' },
  },
  {
    name: '점쟁이',
    avatar: '🔮',
    accent: 'sky',
    style: { aggression: 0.48, bluff: 0.18, tightness: -0.02, label: '변덕' },
  },
]

/**
 * Win rate against `opponents` unknown holdings, by simulation.
 *
 * Whatever is still face down gets drawn from the same stub the opponents draw
 * from — the shared card while it is unrevealed, and the player's own second
 * card before the last street — so an early-street estimate accounts for the
 * board that has yet to arrive.
 */
export function estimateEquity({
  hole,
  community,
  opponents,
  rules = DEFAULT_RULES,
  iterations = 320,
}) {
  if (opponents <= 0) return 1

  const known = new Set([...hole, ...community].map((c) => c.id))
  const stub = createDeck().filter((c) => !known.has(c.id))

  const needMine = Math.max(0, 2 - hole.length)
  const needBoard = Math.max(0, 1 - community.length)
  const needed = needMine + needBoard + opponents * 2
  if (stub.length < needed) return 0.5

  let equity = 0
  for (let iter = 0; iter < iterations; iter++) {
    // Partial Fisher-Yates: only draw as many cards as this trial needs.
    const pool = stub.slice()
    const drawn = []
    for (let i = 0; i < needed; i++) {
      const j = i + Math.floor(Math.random() * (pool.length - i))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
      drawn.push(pool[i])
    }

    let at = 0
    const board = community.concat(drawn.slice(at, at + needBoard))
    at += needBoard
    const mine = evaluateHand([...hole, ...drawn.slice(at, at + needMine), ...board])
    at += needMine

    let lost = false
    let tied = 0
    for (let o = 0; o < opponents; o++) {
      const theirs = evaluateHand([drawn[at], drawn[at + 1], ...board])
      at += 2
      const cmp = compareHands(mine, theirs, rules)
      if (cmp < 0) {
        lost = true
        break
      }
      if (cmp === 0) tied += 1
    }

    if (!lost) equity += tied === 0 ? 1 : 1 / (tied + 1)
  }

  return equity / iterations
}

function pick(probability) {
  return Math.random() < probability
}

/**
 * Decides a bot's action. Returns { type, amount, equity } where `amount` is
 * the total bet the bot wants to reach this round.
 */
export function decideAction({ player, state, legal, opponents }) {
  const { style } = player
  const pot = state.players.reduce((sum, p) => sum + p.committed, 0) + (state.carryPot ?? 0)
  const toCall = legal.callAmount

  const equity = estimateEquity({
    hole: player.hole,
    community: state.community ?? [],
    opponents,
    rules: state.rules,
    // The first street has the most unknowns and the least at stake.
    iterations: player.hole.length < 2 ? 220 : 320,
  })

  const potOdds = toCall > 0 ? toCall / (pot + toCall) : 0
  const edge = equity - potOdds - style.tightness

  const raiseTotal = (fraction) => {
    const target = state.currentBet + Math.max(state.minRaise, Math.round(pot * fraction))
    return Math.min(Math.max(target, legal.minRaiseTotal), legal.maxRaiseTotal)
  }

  if (legal.canCheck) {
    if (equity > 0.8 && legal.canRaise && pick(0.85)) {
      return { type: 'raise', amount: raiseTotal(0.75), equity }
    }
    if (equity > 0.6 && legal.canRaise && pick(style.aggression)) {
      return { type: 'raise', amount: raiseTotal(0.5), equity }
    }
    if (equity < 0.38 && legal.canRaise && pick(style.bluff)) {
      return { type: 'raise', amount: raiseTotal(0.45), equity }
    }
    return { type: 'check', equity }
  }

  // A 광땡, or a big 땡 nobody can catch, is worth the whole stack.
  if (equity > 0.9 && legal.canRaise) {
    if (legal.maxRaiseTotal <= pot || pick(0.35)) {
      return { type: 'allin', amount: legal.maxRaiseTotal, equity }
    }
    return { type: 'raise', amount: raiseTotal(0.9), equity }
  }

  if (edge > 0.18 && legal.canRaise && pick(style.aggression + 0.2)) {
    return { type: 'raise', amount: raiseTotal(0.6), equity }
  }

  if (edge > 0.02) {
    // Calling off the whole stack needs a real edge, not a coin flip.
    if (legal.isAllInCall && equity < 0.58 + style.tightness) {
      return { type: 'fold', equity }
    }
    return { type: 'call', equity }
  }

  if (potOdds < 0.16 && equity > 0.3 && pick(0.6)) {
    return { type: 'call', equity }
  }
  if (legal.canRaise && pick(style.bluff * 0.5)) {
    return { type: 'raise', amount: raiseTotal(0.55), equity }
  }

  return { type: 'fold', equity }
}

export function thinkingDelay() {
  return 700 + Math.random() * 800
}
