export const SUITS = ['s', 'h', 'd', 'c']
export const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

export const SUIT_SYMBOL = { s: '♠', h: '♥', d: '♦', c: '♣' }
export const RANK_LABEL = {
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'A',
}

export function rankLabel(rank) {
  return RANK_LABEL[rank] ?? String(rank)
}

export function cardLabel(card) {
  return `${rankLabel(card.rank)}${SUIT_SYMBOL[card.suit]}`
}

export function isRed(card) {
  return card.suit === 'h' || card.suit === 'd'
}

export function createDeck() {
  const deck = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit, id: `${rank}${suit}` })
    }
  }
  return deck
}

/** Fisher-Yates. Returns a new array; does not mutate the input. */
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
