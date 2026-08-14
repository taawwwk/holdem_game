import { createDeck } from './deck.js'
import { evaluateHand } from './handEvaluator.js'

export const BOT_PROFILES = [
  {
    name: '샤크',
    avatar: '🦈',
    accent: 'rose',
    style: { aggression: 0.62, bluff: 0.18, tightness: 0.05, label: '공격형' },
  },
  {
    name: '스톤',
    avatar: '🗿',
    accent: 'amber',
    style: { aggression: 0.28, bluff: 0.05, tightness: 0.14, label: '타이트' },
  },
  {
    name: '블러퍼',
    avatar: '🃏',
    accent: 'violet',
    style: { aggression: 0.55, bluff: 0.32, tightness: -0.06, label: '허세형' },
  },
  {
    name: '캘큘',
    avatar: '🤖',
    accent: 'emerald',
    style: { aggression: 0.4, bluff: 0.08, tightness: 0.02, label: '계산형' },
  },
  {
    name: '루키',
    avatar: '🐣',
    accent: 'cyan',
    style: { aggression: 0.33, bluff: 0.14, tightness: -0.1, label: '초보' },
  },
]

/**
 * Monte Carlo win-rate estimate for one hand against `opponents` random hands.
 * Ties count as a fractional win so the number reads as pot equity.
 */
export function estimateEquity(hole, community, opponents, iterations = 220) {
  if (opponents <= 0) return 1
  const known = new Set([...hole, ...community].map((c) => c.id))
  const stub = createDeck().filter((c) => !known.has(c.id))

  const needBoard = 5 - community.length
  const needed = needBoard + opponents * 2
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

    const board = community.concat(drawn.slice(0, needBoard))
    const mine = evaluateHand([...hole, ...board]).score

    let better = 0
    let tied = 0
    for (let o = 0; o < opponents; o++) {
      const at = needBoard + o * 2
      const theirs = evaluateHand([drawn[at], drawn[at + 1], ...board]).score
      if (theirs > mine) {
        better += 1
        break
      }
      if (theirs === mine) tied += 1
    }

    if (better === 0) equity += tied === 0 ? 1 : 1 / (tied + 1)
  }

  return equity / iterations
}

/** Cheap pre-flop strength score in the 0..1 range (Chen-formula flavoured). */
export function preflopStrength(hole) {
  const [a, b] = hole
  const hi = Math.max(a.rank, b.rank)
  const lo = Math.min(a.rank, b.rank)
  const suited = a.suit === b.suit
  const gap = hi - lo

  let score = hi === 14 ? 10 : hi === 13 ? 8 : hi === 12 ? 7 : hi === 11 ? 6 : hi / 2
  if (hi === lo) score = Math.max(5, score * 2)
  if (suited) score += 2
  if (gap === 1 && hi < 12) score += 1
  else if (gap === 2) score -= 1
  else if (gap === 3) score -= 2
  else if (gap >= 4) score -= 4

  return Math.max(0, Math.min(1, score / 20))
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
  const pot = state.players.reduce((sum, p) => sum + p.committed, 0)
  const toCall = legal.callAmount

  const equity =
    state.street === 'preflop' && state.community.length === 0
      ? 0.35 + preflopStrength(player.hole) * 0.55
      : estimateEquity(player.hole, state.community, opponents, 200)

  const potOdds = toCall > 0 ? toCall / (pot + toCall) : 0
  const edge = equity - potOdds - style.tightness

  const raiseTotal = (fraction) => {
    const target = state.currentBet + Math.max(state.minRaise, Math.round(pot * fraction))
    return Math.min(Math.max(target, legal.minRaiseTotal), legal.maxRaiseTotal)
  }

  // No bet to face: check, or take the betting lead.
  if (legal.canCheck) {
    if (equity > 0.78 && legal.canRaise && pick(0.85)) {
      return { type: 'raise', amount: raiseTotal(0.75), equity }
    }
    if (equity > 0.58 && legal.canRaise && pick(style.aggression)) {
      return { type: 'raise', amount: raiseTotal(0.5), equity }
    }
    if (equity < 0.4 && legal.canRaise && pick(style.bluff)) {
      return { type: 'raise', amount: raiseTotal(0.45), equity }
    }
    return { type: 'check', equity }
  }

  // Monsters: raise for value, and jam when the stack is short enough.
  if (equity > 0.82 && legal.canRaise) {
    if (legal.maxRaiseTotal <= pot * 0.9 || pick(0.25)) {
      return { type: 'allin', amount: legal.maxRaiseTotal, equity }
    }
    return { type: 'raise', amount: raiseTotal(0.8), equity }
  }

  if (edge > 0.2 && legal.canRaise && pick(style.aggression + 0.2)) {
    return { type: 'raise', amount: raiseTotal(0.6), equity }
  }

  if (edge > 0.02) {
    // Calling off the whole stack needs a real edge, not a coin flip.
    if (legal.isAllInCall && equity < 0.55 + style.tightness) {
      return { type: 'fold', equity }
    }
    return { type: 'call', equity }
  }

  // Behind, but a small price plus fold equity can still justify continuing.
  if (potOdds < 0.18 && equity > 0.3 && pick(0.6)) {
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
