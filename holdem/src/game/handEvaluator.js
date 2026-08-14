import { rankLabel } from './deck.js'

export const CATEGORY = {
  HIGH_CARD: 1,
  PAIR: 2,
  TWO_PAIR: 3,
  TRIPS: 4,
  STRAIGHT: 5,
  FLUSH: 6,
  FULL_HOUSE: 7,
  QUADS: 8,
  STRAIGHT_FLUSH: 9,
}

export const CATEGORY_NAME_KO = {
  1: '하이카드',
  2: '원페어',
  3: '투페어',
  4: '트리플',
  5: '스트레이트',
  6: '플러시',
  7: '풀하우스',
  8: '포카드',
  9: '스트레이트 플러시',
}

const BASE = 15

/** Highest card of a 5-run inside a descending unique rank list. 0 when none. */
function straightHigh(uniqueDesc) {
  const r = uniqueDesc.slice()
  if (r[0] === 14) r.push(1) // wheel: A-2-3-4-5
  let run = 1
  for (let i = 1; i < r.length; i++) {
    if (r[i] === r[i - 1] - 1) {
      run += 1
      if (run >= 5) return r[i] + 4
    } else if (r[i] !== r[i - 1]) {
      run = 1
    }
  }
  return 0
}

function pickByRanks(cards, ranks, suit = null) {
  const out = []
  const pool = suit ? cards.filter((c) => c.suit === suit) : cards.slice()
  for (const rank of ranks) {
    const idx = pool.findIndex((c) => c.rank === rank)
    if (idx >= 0) out.push(pool.splice(idx, 1)[0])
  }
  return out
}

function straightRanks(high) {
  // high === 5 means the wheel, whose ace is represented as rank 14
  if (high === 5) return [5, 4, 3, 2, 14]
  return [high, high - 1, high - 2, high - 3, high - 4]
}

/**
 * Evaluates the best 5-card hand out of any 5-7 cards.
 * Returns { category, ranks, score, name, best } where `ranks` are the
 * tiebreakers in descending significance and `score` is comparable numerically.
 */
export function evaluateHand(cards) {
  const rankCount = new Map()
  const suitCount = new Map()
  for (const card of cards) {
    rankCount.set(card.rank, (rankCount.get(card.rank) ?? 0) + 1)
    suitCount.set(card.suit, (suitCount.get(card.suit) ?? 0) + 1)
  }

  const uniqueDesc = [...rankCount.keys()].sort((a, b) => b - a)
  let flushSuit = null
  for (const [suit, count] of suitCount) {
    if (count >= 5) flushSuit = suit
  }

  let result = null

  if (flushSuit) {
    const flushRanks = cards
      .filter((c) => c.suit === flushSuit)
      .map((c) => c.rank)
      .sort((a, b) => b - a)
    const sfHigh = straightHigh([...new Set(flushRanks)])
    if (sfHigh) {
      const ranks = straightRanks(sfHigh)
      result = {
        category: CATEGORY.STRAIGHT_FLUSH,
        ranks: [sfHigh],
        best: pickByRanks(cards, ranks, flushSuit),
      }
    }
  }

  // Group ranks by how many copies are held, strongest group first.
  const groups = [...rankCount.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])

  if (!result) {
    const [topRank, topCount] = groups[0]
    if (topCount === 4) {
      const kicker = uniqueDesc.find((r) => r !== topRank)
      result = {
        category: CATEGORY.QUADS,
        ranks: [topRank, kicker],
        best: pickByRanks(cards, [topRank, topRank, topRank, topRank, kicker]),
      }
    } else if (topCount === 3) {
      const pairRank = groups.slice(1).find(([, c]) => c >= 2)?.[0]
      if (pairRank !== undefined) {
        result = {
          category: CATEGORY.FULL_HOUSE,
          ranks: [topRank, pairRank],
          best: pickByRanks(cards, [topRank, topRank, topRank, pairRank, pairRank]),
        }
      }
    }
  }

  if (!result && flushSuit) {
    const flushRanks = cards
      .filter((c) => c.suit === flushSuit)
      .map((c) => c.rank)
      .sort((a, b) => b - a)
      .slice(0, 5)
    result = {
      category: CATEGORY.FLUSH,
      ranks: flushRanks,
      best: pickByRanks(cards, flushRanks, flushSuit),
    }
  }

  if (!result) {
    const high = straightHigh(uniqueDesc)
    if (high) {
      result = {
        category: CATEGORY.STRAIGHT,
        ranks: [high],
        best: pickByRanks(cards, straightRanks(high)),
      }
    }
  }

  if (!result) {
    const [topRank, topCount] = groups[0]
    if (topCount === 3) {
      const kickers = uniqueDesc.filter((r) => r !== topRank).slice(0, 2)
      result = {
        category: CATEGORY.TRIPS,
        ranks: [topRank, ...kickers],
        best: pickByRanks(cards, [topRank, topRank, topRank, ...kickers]),
      }
    } else if (topCount === 2) {
      const pairs = groups.filter(([, c]) => c === 2).map(([r]) => r)
      if (pairs.length >= 2) {
        const [hi, lo] = pairs.slice(0, 2)
        const kicker = uniqueDesc.find((r) => r !== hi && r !== lo)
        result = {
          category: CATEGORY.TWO_PAIR,
          ranks: [hi, lo, kicker],
          best: pickByRanks(cards, [hi, hi, lo, lo, kicker]),
        }
      } else {
        const kickers = uniqueDesc.filter((r) => r !== topRank).slice(0, 3)
        result = {
          category: CATEGORY.PAIR,
          ranks: [topRank, ...kickers],
          best: pickByRanks(cards, [topRank, topRank, ...kickers]),
        }
      }
    } else {
      const top5 = uniqueDesc.slice(0, 5)
      result = {
        category: CATEGORY.HIGH_CARD,
        ranks: top5,
        best: pickByRanks(cards, top5),
      }
    }
  }

  let score = result.category
  for (let i = 0; i < 5; i++) {
    score = score * BASE + (result.ranks[i] ?? 0)
  }

  return { ...result, score, name: describeHand(result) }
}

function describeHand({ category, ranks }) {
  const label = (r) => rankLabel(r)
  switch (category) {
    case CATEGORY.STRAIGHT_FLUSH:
      return ranks[0] === 14 ? '로얄 플러시' : `${label(ranks[0])} 스트레이트 플러시`
    case CATEGORY.QUADS:
      return `${label(ranks[0])} 포카드`
    case CATEGORY.FULL_HOUSE:
      return `${label(ranks[0])} 풀하우스`
    case CATEGORY.FLUSH:
      return `${label(ranks[0])} 하이 플러시`
    case CATEGORY.STRAIGHT:
      return `${label(ranks[0])} 스트레이트`
    case CATEGORY.TRIPS:
      return `${label(ranks[0])} 트리플`
    case CATEGORY.TWO_PAIR:
      return `${label(ranks[0])} & ${label(ranks[1])} 투페어`
    case CATEGORY.PAIR:
      return `${label(ranks[0])} 원페어`
    default:
      return `${label(ranks[0])} 하이카드`
  }
}

/** Numeric score only — used by the Monte Carlo loop where allocation matters. */
export function scoreHand(cards) {
  return evaluateHand(cards).score
}

export function compareHands(a, b) {
  return a.score - b.score
}
