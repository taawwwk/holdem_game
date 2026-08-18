/**
 * Hold'em Sutda hand ranking.
 *
 * A hand is two private cards plus the one shared card, and the player uses
 * whichever two of those three make the best pair. Most of the ladder is a
 * plain total order, captured by `score`. Two optional house rules break it on
 * purpose — 암행어사 beats the lesser 광땡, 땡잡이 beats any 땡, and both are
 * feeble 끗 hands against anything else — so they live in `compareHands`
 * rather than in the score.
 *
 * Because a player holds three cards, more than one combination is available
 * at once. That is what makes a shared 7 interesting: with a 3 and a 4 in hand
 * you hold 땡잡이 and 암행어사 simultaneously, and which one matters depends
 * entirely on what you are up against.
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

/** House rules that can be switched off. */
export const DEFAULT_RULES = {
  amhaengeosa: true, // 4+7 beats 13광땡 / 18광땡
  ttaengjabi: true, // 3+7 beats any 땡
  gusa: false, // 4+9 lets a loser void the hand
}

function is(months, a, b) {
  return months[0] === a && months[1] === b
}

/** Ranks one specific pair of cards. */
export function evaluateCombo(cards) {
  const [a, b] = cards
  const months = [a.month, b.month].sort((x, y) => x - y)
  const [lo, hi] = months

  const amhaengeosa = is(months, 4, 7)
  const ttaengjabi = is(months, 3, 7)
  const gusa = is(months, 4, 9)

  let category
  let sub
  let name

  const bothGwang = a.gwang && b.gwang
  if (bothGwang && is(months, 3, 8)) {
    category = CATEGORY.GWANGTTAENG
    sub = 3
    name = '38광땡'
  } else if (bothGwang && is(months, 1, 8)) {
    category = CATEGORY.GWANGTTAENG
    sub = 2
    name = '18광땡'
  } else if (bothGwang && is(months, 1, 3)) {
    category = CATEGORY.GWANGTTAENG
    sub = 1
    name = '13광땡'
  } else if (lo === hi) {
    category = CATEGORY.TTAENG
    sub = lo
    name = lo === 10 ? '장땡' : `${lo}땡`
  } else {
    const special = SPECIAL_PAIRS.find((s) => is(months, s.pair[0], s.pair[1]))
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

function pairsOf(cards) {
  const out = []
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) out.push([cards[i], cards[j]])
  }
  return out
}

/**
 * Evaluates a whole holding (two private cards plus the shared one, or fewer
 * while the hand is still being dealt). The top-level fields describe the
 * best combination by rank; the override flags say what *else* is available,
 * since a weaker pair can still be the winning one against the right opponent.
 */
export function evaluateHand(cards) {
  const combos = pairsOf(cards).map(evaluateCombo)
  if (combos.length === 0) return null

  const best = combos.reduce((top, c) => (c.score > top.score ? c : top), combos[0])

  return {
    ...best,
    combos,
    // "Do I hold this combination at all", not "is it my best hand".
    amhaengeosa: combos.some((c) => c.amhaengeosa),
    ttaengjabi: combos.some((c) => c.ttaengjabi),
    gusa: combos.some((c) => c.gusa),
  }
}

/** True when `hand` holds a pair that beats `other` by special rule alone. */
function overrides(hand, other, rules) {
  if (!hand || !other || !rules) return false
  if (rules.amhaengeosa && hand.amhaengeosa) {
    // The 3-8 brights outrank even the royal inspector.
    if (other.category === CATEGORY.GWANGTTAENG && other.sub < 3) return true
  }
  if (rules.ttaengjabi && hand.ttaengjabi) {
    if (other.category === CATEGORY.TTAENG) return true
  }
  return false
}

/**
 * Pairwise comparison against a specific opponent. Positive when `a` wins.
 * A special pair is only reached for when it actually has a target — with
 * nothing to catch, 4·7 is simply a 1끗 hand.
 */
export function compareHands(a, b, rules = DEFAULT_RULES) {
  const aBeats = overrides(a, b, rules)
  const bBeats = overrides(b, a, rules)
  if (aBeats && !bBeats) return 1
  if (bBeats && !aBeats) return -1
  return (a?.score ?? -1) - (b?.score ?? -1)
}

/** Which special rule, if any, decided this particular duel. */
export function overrideUsed(hand, other, rules = DEFAULT_RULES) {
  if (!overrides(hand, other, rules)) return null
  if (rules.amhaengeosa && hand.amhaengeosa && other.category === CATEGORY.GWANGTTAENG) {
    return 'amhaengeosa'
  }
  if (rules.ttaengjabi && hand.ttaengjabi && other.category === CATEGORY.TTAENG) {
    return 'ttaengjabi'
  }
  return null
}

/**
 * Resolves a contested pot. The overrides are deliberately circular —
 * 암행어사 beats 18광땡, which beats 장땡, which beats 암행어사 — so a
 * three-way showdown can have no undisputed winner. Only then does the pot
 * fall back to plain rank, which always resolves.
 */
export function pickWinners(ids, handOf, rules = DEFAULT_RULES) {
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

/** Whether this holding can void the pot under the 구사 rule. */
export function canVoid(hand, rules = DEFAULT_RULES) {
  return !!rules.gusa && !!hand?.gusa
}
