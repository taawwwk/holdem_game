/**
 * The Sutda deck: twenty hwatu cards, two per month from 1 to 10.
 *
 * Only three of them carry the 光 mark — the 1, 3 and 8 brights — and those
 * three are the only cards whose identity matters beyond its month number.
 */

/** Months whose first card is the bright (광) one. */
const GWANG_MONTHS = new Set([1, 3, 8])

export const MONTHS = [
  { month: 1, name: '송학', motif: '🕊️' },
  { month: 2, name: '매조', motif: '🐦' },
  { month: 3, name: '벚꽃', motif: '🌸' },
  { month: 4, name: '흑싸리', motif: '🌿' },
  { month: 5, name: '난초', motif: '🌱' },
  { month: 6, name: '모란', motif: '🌺' },
  { month: 7, name: '홍싸리', motif: '🍂' },
  { month: 8, name: '공산', motif: '🌕' },
  { month: 9, name: '국화', motif: '🌼' },
  { month: 10, name: '단풍', motif: '🍁' },
]

export const MONTH_INFO = Object.fromEntries(MONTHS.map((m) => [m.month, m]))

export function createDeck() {
  const deck = []
  for (const { month } of MONTHS) {
    deck.push({ month, gwang: GWANG_MONTHS.has(month), id: `${month}a` })
    deck.push({ month, gwang: false, id: `${month}b` })
  }
  return deck
}

export function shuffleDeck(deck) {
  const out = deck.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function createShuffledDeck() {
  return shuffleDeck(createDeck())
}

export function cardLabel(card) {
  return `${card.month}${card.gwang ? '광' : ''}`
}

export function monthName(card) {
  return MONTH_INFO[card.month]?.name ?? ''
}
