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
]

/**
 * Exact win rate against one unknown hand: with only twenty cards in the deck
 * every opponent holding can be enumerated, so there is no need to sample.
 * Ties count as a half so the number reads as pot equity.
 */
export function headsUpEquity(hole, rules = DEFAULT_RULES) {
  const known = new Set(hole.map((c) => c.id))
  const stub = createDeck().filter((c) => !known.has(c.id))
  const mine = evaluateHand(hole)

  let wins = 0
  let total = 0
  for (let i = 0; i < stub.length; i++) {
    for (let j = i + 1; j < stub.length; j++) {
      const cmp = compareHands(mine, evaluateHand([stub[i], stub[j]]), rules)
      wins += cmp > 0 ? 1 : cmp === 0 ? 0.5 : 0
      total += 1
    }
  }
  return wins / total
}

/**
 * Win rate against `opponents` unknown hands. Card removal between opponents
 * makes the exact figure expensive, so the heads-up number is compounded —
 * close enough for a bot's decision and far cheaper than sampling.
 */
export function estimateEquity(hole, opponents, rules = DEFAULT_RULES) {
  if (opponents <= 0) return 1
  return headsUpEquity(hole, rules) ** opponents
}

/** Only one card is face up in the first round; judge it on rank alone. */
export function singleCardStrength(card) {
  // A bright card is worth more than its month: it is half of a 광땡.
  const base = card.month / 10
  return Math.min(1, card.gwang ? base * 0.6 + 0.45 : base * 0.75)
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

  const equity =
    player.hole.length < 2
      ? 0.3 + singleCardStrength(player.hole[0]) * 0.45
      : estimateEquity(player.hole, opponents, state.rules)

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

  // A 광땡 or a big 땡 is worth the whole stack.
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
