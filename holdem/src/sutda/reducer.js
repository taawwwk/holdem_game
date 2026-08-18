import { createShuffledDeck, cardLabel } from './deck.js'
import { DEFAULT_RULES, canVoid, evaluateHand, pickWinners } from './handEvaluator.js'
import { BOT_PROFILES } from './aiLogic.js'
import {
  applyBettingAction,
  awardPots,
  canStillAct,
  collectBets,
  contenders,
  freshHandPlayers,
  isRoundComplete,
  logLine,
  nextActor,
  postAnte,
  rotateButton,
  seatOrder,
  selectLegalActions,
  totalPot,
} from '../engine/betting.js'

export { selectLegalActions }

/** One card each, a round of betting, the second card, then another round. */
export const STREETS = ['first', 'second']
export const STREET_LABEL = { first: '첫 장', second: '두 번째 장' }

const LABELS = { fold: '다이', foldLog: '다이', raiseLog: '레이즈' }

export const initialState = {
  phase: 'setup', // setup | shuffle | dealing | betting | showdown | handEnd | gameOver
  street: 'first',
  players: [],
  deck: [],
  deckCursor: 0,
  currentBet: 0,
  minRaise: 0,
  actingIndex: -1,
  dealerIndex: 0,
  handNumber: 0,
  ante: 10,
  startingChips: 1000,
  carryPot: 0, // dead money rolled over from a hand voided by 구사
  rules: DEFAULT_RULES,
  roundComplete: false,
  runout: false,
  results: null,
  shuffleMethod: null,
  log: [],
}

/* ------------------------------------------------------------- hand setup */

function setupGame(state, { botCount, startingChips, ante, rules }) {
  const players = [
    {
      id: 'you',
      name: '나',
      isHuman: true,
      avatar: '🧑',
      accent: 'sky',
      chips: startingChips,
      style: null,
    },
    ...Array.from({ length: botCount }, (_, i) => {
      const profile = BOT_PROFILES[i % BOT_PROFILES.length]
      return {
        id: `bot${i + 1}`,
        name: profile.name,
        isHuman: false,
        avatar: profile.avatar,
        accent: profile.accent,
        chips: startingChips,
        style: profile.style,
      }
    }),
  ].map((p) => ({
    ...p,
    out: false,
    hole: [],
    bet: 0,
    committed: 0,
    folded: false,
    allIn: false,
    acted: false,
    lastAction: null,
    handResult: null,
  }))

  return {
    ...initialState,
    players,
    startingChips,
    ante,
    rules: { ...DEFAULT_RULES, ...rules },
    // First BEGIN_HAND rotates to seat 0, so the human takes the first button.
    dealerIndex: players.length - 1,
    handNumber: 0,
    phase: 'shuffle',
    log: [],
  }
}

function beginHand(state, { keepDealer = false, carryPot = 0 } = {}) {
  const players = freshHandPlayers(state.players)
  if (seatOrder(players).length < 2) {
    return { ...state, players, phase: 'gameOver' }
  }

  return {
    ...state,
    players,
    dealerIndex: keepDealer ? state.dealerIndex : rotateButton(players, state.dealerIndex),
    handNumber: state.handNumber + 1,
    deck: [],
    deckCursor: 0,
    street: 'first',
    currentBet: 0,
    minRaise: state.ante,
    actingIndex: -1,
    carryPot,
    roundComplete: false,
    runout: false,
    results: null,
    shuffleMethod: null,
    phase: 'shuffle',
  }
}

function dealHand(state, method) {
  const deck = createShuffledDeck()
  const players = state.players.map((p) => ({ ...p, hole: [] }))
  const seats = seatOrder(players)
  const dealerPos = seats.indexOf(state.dealerIndex)
  const order = seats.map((_, i) => seats[(dealerPos + 1 + i) % seats.length])

  // Everyone antes up, then takes a single card face down.
  for (const seat of order) postAnte(players[seat], state.ante)

  let cursor = 0
  for (const seat of order) players[seat].hole.push(deck[cursor++])

  // The ante is not a bet, so the first round opens with nothing to call.
  const firstSeat = order[0]
  const draft = { ...state, players, currentBet: 0, minRaise: state.ante }
  const preComplete = isRoundComplete(draft)
  const actingIndex = players[firstSeat].folded || players[firstSeat].allIn
    ? nextActor(players, (firstSeat + players.length - 1) % players.length)
    : firstSeat

  let next = {
    ...state,
    deck,
    deckCursor: cursor,
    players,
    currentBet: 0,
    minRaise: state.ante,
    actingIndex: preComplete ? -1 : actingIndex,
    street: 'first',
    roundComplete: preComplete,
    runout: preComplete,
    shuffleMethod: method,
    phase: 'dealing',
  }
  const carry = state.carryPot > 0 ? ` · 이월 ${state.carryPot}` : ''
  next.log = logLine(
    next,
    `${next.handNumber}판 — 딜러: ${players[state.dealerIndex].name} · 앤티 ${state.ante}${carry}`,
    'system',
  )
  return next
}

/* ---------------------------------------------------------------- streets */

function advanceStreet(state) {
  if (contenders(state.players).length <= 1) {
    return settle(state, { uncontested: true })
  }

  if (state.street === STREETS[STREETS.length - 1]) {
    return settle(state, { uncontested: false })
  }

  const runout = canStillAct(state.players).length <= 1
  const players = collectBets(state.players)
  const seats = seatOrder(players)
  const dealerPos = seats.indexOf(state.dealerIndex)
  const order = seats.map((_, i) => seats[(dealerPos + 1 + i) % seats.length])

  // Second card goes to everyone still holding; a folded seat burns its card
  // so the deal stays honest. Rebuild `hole` rather than pushing into it —
  // collectBets only shallow-copies, so the array is still shared with the
  // previous state and a re-run of this reducer would deal the card twice.
  let cursor = state.deckCursor
  for (const seat of order) {
    if (!players[seat].folded) {
      players[seat] = { ...players[seat], hole: [...players[seat].hole, state.deck[cursor]] }
    }
    cursor += 1
  }

  const firstSeat = order[0]
  const actingIndex = runout
    ? -1
    : players[firstSeat].folded || players[firstSeat].allIn
      ? nextActor(players, (firstSeat + players.length - 1) % players.length)
      : firstSeat

  let next = {
    ...state,
    players,
    deckCursor: cursor,
    street: 'second',
    currentBet: 0,
    minRaise: state.ante,
    actingIndex,
    roundComplete: runout,
    runout,
    phase: 'betting',
  }
  next.log = logLine(next, '두 번째 장', 'system')
  return next
}

/* --------------------------------------------------------------- showdown */

function settle(state, { uncontested }) {
  const evaluated = {}
  for (const p of state.players) {
    if (!p.folded && !p.out && p.hole.length === 2) {
      evaluated[p.id] = evaluateHand(p.hole)
    }
  }
  const handOf = (id) => evaluated[id]

  const {
    players,
    payouts,
    potResults,
    winnerIds,
    potSize,
  } = awardPots({
    players: state.players,
    pickWinners: (ids) => pickWinners(ids, handOf, state.rules),
    uncontested,
    carry: state.carryPot,
  })

  for (const p of players) p.handResult = evaluated[p.id] ?? null

  // 구사: a loser holding 4+9 can tear the hand up. The money stays on the
  // table and rides on the next deal, which the same dealer puts out.
  const voider = uncontested
    ? null
    : players.find(
        (p) => !p.folded && !p.out && !winnerIds.includes(p.id) && canVoid(evaluated[p.id], state.rules),
      )

  if (voider) {
    let next = {
      ...state,
      players: state.players.map((p) => ({ ...p, handResult: evaluated[p.id] ?? null })),
      phase: 'showdown',
      actingIndex: -1,
      roundComplete: false,
      runout: false,
      results: {
        uncontested: false,
        voided: true,
        voidedBy: voider.id,
        pots: [],
        payouts: {},
        winnerIds: [],
        potSize: totalPot(state.players) + state.carryPot,
        showCards: true,
      },
    }
    next.log = logLine(next, `${voider.name} 구사 — 판 무효, 판돈 이월`, 'win')
    return next
  }

  let next = {
    ...state,
    players,
    phase: 'showdown',
    actingIndex: -1,
    roundComplete: false,
    runout: false,
    results: {
      uncontested,
      voided: false,
      pots: potResults,
      payouts,
      winnerIds,
      potSize,
      showCards: !uncontested,
    },
  }

  const byId = Object.fromEntries(players.map((p) => [p.id, p]))
  const summary = winnerIds
    .map((id) => {
      const detail = !uncontested && evaluated[id] ? ` (${evaluated[id].name})` : ''
      return `${byId[id].name}${detail} +${payouts[id]}`
    })
    .join(', ')
  next.log = logLine(next, `승부 — ${summary}`, 'win')

  if (players.filter((p) => p.chips > 0).length <= 1) {
    next.gameOverPending = true
  }
  return next
}

/* ---------------------------------------------------------------- reducer */

export function sutdaReducer(state, action) {
  switch (action.type) {
    case 'SETUP_GAME':
      return setupGame(state, action.payload)

    case 'BEGIN_HAND': {
      // A voided hand is redealt by the same dealer with the pot still down.
      if (state.results?.voided) {
        return beginHand(state, { keepDealer: true, carryPot: state.results.potSize })
      }
      return beginHand(state)
    }

    case 'SHUFFLE_DONE':
      return dealHand(state, action.payload?.method ?? 'riffle')

    case 'DEAL_DONE':
      return { ...state, phase: 'betting' }

    case 'ACT': {
      if (state.phase !== 'betting' || state.actingIndex < 0) return state
      return applyBettingAction({ ...state, labels: LABELS }, action.payload)
    }

    case 'ADVANCE_STREET': {
      if (!state.roundComplete && !state.runout) return state
      return advanceStreet({ ...state, roundComplete: false })
    }

    case 'END_HAND': {
      if (state.gameOverPending) return { ...state, phase: 'gameOver' }
      return { ...state, phase: 'handEnd' }
    }

    case 'RESET':
      return { ...initialState }

    default:
      return state
  }
}

/* ------------------------------------------------------------- selectors */

export function selectPot(state) {
  return totalPot(state.players) + (state.carryPot ?? 0)
}

export function selectActingPlayer(state) {
  return state.actingIndex >= 0 ? state.players[state.actingIndex] : null
}
