/**
 * Sutda hand ranking.
 *
 * Two cards make one hand. Most of the ladder is a plain total order and is
 * captured by `score`, but three optional house rules deliberately break it:
 * 암행어사 beats the lesser 광땡, and 땡잡이 beats any 땡, while both are weak
 * 끗 hands against everything else. Those live in `compareHands`, never in the
 * score, so ordinary comparisons stay cheap and honest.
 */

export const CATEGORY = {
  KKEUT: 2, // 끗 · 갑오 · 망통
  SPECIAL: 3, // 알리 · 독사 · 구삥 · 장삥 · 장사 · 세륙
  TTAENG: 4, // 땡
  GWANGTTAENG: 5, // 광땡
}

const SPECIAL_PAIRS = [
  { pair: [1, 2], sub: 6, name: '알리' },
  { pair: [1, 4], sub: 5, name: '독사' },
  { pair: [1, 9], sub: 4, name: '구삥' },
  { pair: [1, 10], sub: 3, name: '장삥' },
  { pair: [4, 10], sub: 2, name: '장사' },
  { pair: [4, 6], sub: 1, name: '세륙' },
]

/** House rules that can be switched off; all three are on by default. */
export const DEFAULT_RULES = {
  amhaengeosa: true, // 4+7 beats 13광땡 / 18광땡
  ttaengjabi: true, // 3+7 beats any 땡
  gusa: false, // 4+9 lets a loser void the hand
}

function has(months, a, b) {
  return months[0] === a && months[1] === b
}

/**
 * Evaluates a two-card Sutda hand.
 * Returns { category, sub, score, name, amhaengeosa, ttaengjabi, gusa }.
 */
export function evaluateHand(cards) {
  const [a, b] = cards
  const months = [a.month, b.month].sort((x, y) => x - y)
  const [lo, hi] = months

  // The three special two-card combinations, flagged for compareHands.
  const amhaengeosa = has(months, 4, 7)
  const ttaengjabi = has(months, 3, 7)
  const gusa = has(months, 4, 9)

  let category
  let sub
  let name

  const bothGwang = a.gwang && b.gwang
  if (bothGwang && has(months, 3, 8)) {
    category = CATEGORY.GWANGTTAENG
    sub = 3
    name = '38광땡'
  } else if (bothGwang && has(months, 1, 8)) {
    category = CATEGORY.GWANGTTAENG
    sub = 2
    name = '18광땡'
  } else if (bothGwang && has(months, 1, 3)) {
    category = CATEGORY.GWANGTTAENG
    sub = 1
    name = '13광땡'
  } else if (lo === hi) {
    category = CATEGORY.TTAENG
    sub = lo
    name = lo === 10 ? '장땡' : `${lo}땡`
  } else {
    const special = SPECIAL_PAIRS.find((s) => has(months, s.pair[0], s.pair[1]))
    if (special) {
      category = CATEGORY.SPECIAL
      sub = special.sub
      name = special.name
    } else {
      category = CATEGORY.KKEUT
      sub = (lo + hi) % 10
      name = sub === 0 ? '망통' : sub === 9 ? '갑오' : `${sub}끗`
    }
  }

  return {
    category,
    sub,
    score: category * 100 + sub,
    name,
    amhaengeosa,
    ttaengjabi,
    gusa,
    cards: [a, b],
  }
}

/** True when `hand` beats `other` purely through a special-rule override. */
function overrides(hand, other, rules) {
  if (!hand || !other || !rules) return false
  if (rules.amhaengeosa && hand.amhaengeosa) {
    // The 3-8 bright pair outranks even the royal inspector.
    if (other.category === CATEGORY.GWANGTTAENG && other.sub < 3) return true
  }
  if (rules.ttaengjabi && hand.ttaengjabi) {
    if (other.category === CATEGORY.TTAENG) return true
  }
  return false
}

/**
 * Pairwise comparison. Positive when `a` wins, negative when `b` does, zero on
 * a genuine tie. Special rules are checked before raw rank.
 */
export function compareHands(a, b, rules = DEFAULT_RULES) {
  const aBeats = overrides(a, b, rules)
  const bBeats = overrides(b, a, rules)
  if (aBeats && !bBeats) return 1
  if (bBeats && !aBeats) return -1
  return (a?.score ?? -1) - (b?.score ?? -1)
}

/**
 * Resolves a contested pot. The overrides above are intentionally circular —
 * 암행어사 beats 18광땡, 18광땡 beats 장땡, 장땡 beats 암행어사 — so a three-way
 * showdown can have no undisputed winner. When that happens the pot falls back
 * to plain rank, which always resolves.
 */
export function pickWinners(ids, handOf, rules = DEFAULT_RULES) {
  // A hand should always be there; rank a missing one last rather than
  // letting the whole table crash on it.
  const scoreOf = (id) => handOf(id)?.score ?? -1

  let best = [ids[0]]
  for (const id of ids.slice(1)) {
    const cmp = compareHands(handOf(id), handOf(best[0]), rules)
    if (cmp > 0) best = [id]
    else if (cmp === 0) best.push(id)
  }

  const champion = handOf(best[0])
  const undisputed = ids.every((id) => compareHands(champion, handOf(id), rules) >= 0)
  if (undisputed) return best

  const top = Math.max(...ids.map(scoreOf))
  return ids.filter((id) => scoreOf(id) === top)
}

/** Whether this hand can void the pot under the 구사 rule. */
export function canVoid(hand, rules = DEFAULT_RULES) {
  return !!rules.gusa && hand.gusa
}
