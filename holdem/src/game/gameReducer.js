import { createShuffledDeck, cardLabel } from './deck.js'
import { evaluateHand } from './handEvaluator.js'
import { BOT_PROFILES } from './aiLogic.js'

export const STREETS = ['preflop', 'flop', 'turn', 'river']

let logSeq = 0
function logLine(state, text, tone = 'info') {
  logSeq += 1
  return [...state.log, { id: logSeq, text, tone }].slice(-40)
}

export const initialState = {
  phase: 'setup', // setup | shuffle | dealing | betting | reveal | showdown | handEnd | gameOver
  street: 'preflop',
  players: [],
  deck: [],
  community: [],
  currentBet: 0,
  minRaise: 0,
  actingIndex: -1,
  dealerIndex: 0,
  handNumber: 0,
  smallBlind: 10,
  bigBlind: 20,
  startingChips: 1000,
  roundComplete: false,
  runout: false,
  results: null,
  shuffleMethod: null,
  log: [],
}

/* ------------------------------------------------------------------ seats */

function seatOrder(players) {
  return players.map((p, i) => i).filter((i) => !players[i].out)
}

/** Next seat after `from` (exclusive) that still has a decision to make. */
function nextActor(players, from) {
  const n = players.length
  for (let step = 1; step <= n; step++) {
    const idx = (from + step) % n
    const p = players[idx]
    if (!p.out && !p.folded && !p.allIn) return idx
  }
  return -1
}

function contenders(players) {
  return players.filter((p) => !p.out && !p.folded)
}

function canStillAct(players) {
  return players.filter((p) => !p.out && !p.folded && !p.allIn)
}

function isRoundComplete(state) {
  const live = contenders(state.players)
  if (live.length <= 1) return true
  const actors = canStillAct(state.players)
  if (actors.length === 0) return true
  // One player left to act while everyone else is all-in: nothing left to call.
  if (actors.length === 1 && actors[0].bet >= state.currentBet) return true
  return actors.every((p) => p.acted && p.bet === state.currentBet)
}

/* ------------------------------------------------------------------- pots */

export function buildPots(players) {
  const committed = players.filter((p) => p.committed > 0)
  if (committed.length === 0) return []
  const levels = [...new Set(committed.map((p) => p.committed))].sort((a, b) => a - b)

  const pots = []
  let prev = 0
  for (const level of levels) {
    // Who put chips into this slice, and how many — needed to refund a slice
    // that no live player can win.
    const contributions = {}
    let amount = 0
    for (const p of players) {
      const part = Math.min(Math.max(p.committed - prev, 0), level - prev)
      if (part > 0) {
        contributions[p.id] = part
        amount += part
      }
    }
    const eligible = players
      .filter((p) => !p.folded && p.committed >= level)
      .map((p) => p.id)
    if (amount > 0) pots.push({ amount, eligible, contributions })
    prev = level
  }

  // Merge neighbouring pots that share the same eligible set.
  const merged = []
  for (const pot of pots) {
    const last = merged[merged.length - 1]
    const sameEligible =
      last &&
      last.eligible.length === pot.eligible.length &&
      last.eligible.every((id) => pot.eligible.includes(id))
    if (sameEligible) {
      last.amount += pot.amount
      for (const [id, part] of Object.entries(pot.contributions)) {
        last.contributions[id] = (last.contributions[id] ?? 0) + part
      }
    } else {
      merged.push({ ...pot, contributions: { ...pot.contributions } })
    }
  }
  return merged
}

function totalPot(players) {
  return players.reduce((sum, p) => sum + p.committed, 0)
}

/* ------------------------------------------------------------- hand setup */

function freshHandPlayers(players) {
  return players.map((p) => ({
    ...p,
    out: p.chips <= 0,
    hole: [],
    bet: 0,
    committed: 0,
    folded: p.chips <= 0,
    allIn: false,
    acted: false,
    lastAction: null,
    handResult: null,
  }))
}

function setupGame(state, { botCount, startingChips, smallBlind }) {
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
    smallBlind,
    bigBlind: smallBlind * 2,
    // First BEGIN_HAND rotates to seat 0, so the human takes the first button.
    dealerIndex: players.length - 1,
    handNumber: 0,
    phase: 'shuffle',
    log: [],
  }
}

function beginHand(state) {
  const players = freshHandPlayers(state.players)
  const seats = seatOrder(players)
  if (seats.length < 2) {
    return { ...state, players, phase: 'gameOver' }
  }

  // Rotate the button to the next seat that is still in the game.
  let dealerIndex = state.dealerIndex
  for (let step = 1; step <= players.length; step++) {
    const idx = (state.dealerIndex + step) % players.length
    if (!players[idx].out) {
      dealerIndex = idx
      break
    }
  }

  return {
    ...state,
    players,
    dealerIndex,
    handNumber: state.handNumber + 1,
    community: [],
    deck: [],
    street: 'preflop',
    currentBet: 0,
    minRaise: state.bigBlind,
    actingIndex: -1,
    roundComplete: false,
    runout: false,
    results: null,
    shuffleMethod: null,
    phase: 'shuffle',
  }
}

function postBlind(player, amount) {
  const paid = Math.min(amount, player.chips)
  player.chips -= paid
  player.bet += paid
  player.committed += paid
  if (player.chips === 0) player.allIn = true
  return paid
}

function dealHand(state, method) {
  const deck = createShuffledDeck()
  const players = state.players.map((p) => ({ ...p, hole: [] }))
  const seats = seatOrder(players)

  // Two cards each, one at a time, starting left of the button.
  const dealerPos = seats.indexOf(state.dealerIndex)
  const order = seats.map((_, i) => seats[(dealerPos + 1 + i) % seats.length])
  let cursor = 0
  for (let round = 0; round < 2; round++) {
    for (const seat of order) {
      players[seat].hole.push(deck[cursor++])
    }
  }

  const n = seats.length
  let sbSeat
  let bbSeat
  let firstToAct
  if (n === 2) {
    sbSeat = state.dealerIndex
    bbSeat = seats[(dealerPos + 1) % n]
    firstToAct = sbSeat
  } else {
    sbSeat = seats[(dealerPos + 1) % n]
    bbSeat = seats[(dealerPos + 2) % n]
    firstToAct = seats[(dealerPos + 3) % n]
  }

  postBlind(players[sbSeat], state.smallBlind)
  postBlind(players[bbSeat], state.bigBlind)

  // The blinds are posted, not acted — the big blind still gets an option.
  const actingIndex = players[firstToAct].allIn
    ? nextActor(players, (firstToAct + players.length - 1) % players.length)
    : firstToAct

  const draft = {
    ...state,
    players,
    currentBet: state.bigBlind,
    minRaise: state.bigBlind,
  }
  // Short stacks can be all-in from the blinds alone, leaving nothing to decide.
  const preComplete = isRoundComplete(draft)

  let next = {
    ...state,
    deck,
    deckCursor: cursor,
    players,
    currentBet: state.bigBlind,
    minRaise: state.bigBlind,
    actingIndex: preComplete ? -1 : actingIndex,
    street: 'preflop',
    roundComplete: preComplete,
    runout: preComplete,
    shuffleMethod: method,
    phase: 'dealing',
  }
  next.log = logLine(
    next,
    `핸드 #${next.handNumber} — 딜러: ${players[state.dealerIndex].name} · SB ${state.smallBlind} / BB ${state.bigBlind}`,
    'system',
  )
  return next
}

/* ----------------------------------------------------------- player action */

function applyAction(state, { type, amount }) {
  const players = state.players.map((p) => ({ ...p }))
  const idx = state.actingIndex
  if (idx < 0) return state
  const player = players[idx]
  let { currentBet, minRaise } = state
  let text = ''
  let tone = 'info'

  const toCall = Math.max(0, currentBet - player.bet)

  if (type === 'fold') {
    player.folded = true
    player.acted = true
    player.lastAction = { type: 'fold', label: 'Fold' }
    text = `${player.name} 폴드`
    tone = 'fold'
  } else if (type === 'check') {
    player.acted = true
    player.lastAction = { type: 'check', label: 'Check' }
    text = `${player.name} 체크`
    tone = 'check'
  } else if (type === 'call') {
    const paid = Math.min(toCall, player.chips)
    player.chips -= paid
    player.bet += paid
    player.committed += paid
    player.acted = true
    if (player.chips === 0) player.allIn = true
    player.lastAction = {
      type: 'call',
      label: player.allIn ? 'All-in' : 'Call',
      amount: paid,
    }
    text = player.allIn
      ? `${player.name} 콜 올인 ${paid}`
      : `${player.name} 콜 ${paid}`
    tone = 'call'
  } else {
    // raise / all-in — `amount` is the total bet this player wants to reach.
    const maxTotal = player.bet + player.chips
    let target = Math.min(Math.max(amount, currentBet + minRaise), maxTotal)
    if (type === 'allin') target = maxTotal
    const paid = target - player.bet
    player.chips -= paid
    player.bet = target
    player.committed += paid
    player.acted = true
    if (player.chips === 0) player.allIn = true

    const raiseSize = target - currentBet
    const isFullRaise = raiseSize >= minRaise
    if (target > currentBet) {
      if (isFullRaise) minRaise = raiseSize
      currentBet = target
      // A full raise reopens the action for everyone still holding cards.
      if (isFullRaise) {
        for (const p of players) {
          if (p.id !== player.id && !p.folded && !p.allIn && !p.out) p.acted = false
        }
      }
    }
    const label = player.allIn ? 'All-in' : currentBet > state.currentBet ? 'Raise' : 'Call'
    player.lastAction = { type: player.allIn ? 'allin' : 'raise', label, amount: target }
    text = player.allIn
      ? `${player.name} 올인 ${target}`
      : `${player.name} 레이즈 → ${target}`
    tone = 'raise'
  }

  let next = { ...state, players, currentBet, minRaise }
  next.log = logLine(next, text, tone)

  const live = contenders(players)
  if (live.length <= 1) {
    return { ...next, roundComplete: true, actingIndex: -1 }
  }

  if (isRoundComplete(next)) {
    return { ...next, roundComplete: true, actingIndex: -1 }
  }

  return { ...next, actingIndex: nextActor(players, idx) }
}

/* ---------------------------------------------------------------- streets */

function collectBets(players) {
  return players.map((p) => ({ ...p, bet: 0, acted: false, lastAction: null }))
}

function advanceStreet(state) {
  const live = contenders(state.players)

  // Everyone folded but one — pay them out without a showdown.
  if (live.length <= 1) {
    return settle(state, { uncontested: true })
  }

  const stillBetting = canStillAct(state.players)
  const runout = stillBetting.length <= 1

  const streetIdx = STREETS.indexOf(state.street)
  if (streetIdx >= STREETS.length - 1) {
    return settle(state, { uncontested: false })
  }

  const nextStreet = STREETS[streetIdx + 1]
  const cursor = state.deckCursor
  const drawCount = nextStreet === 'flop' ? 3 : 1
  const burned = 1 // burn one card before each street, as at a live table
  const drawn = state.deck.slice(cursor + burned, cursor + burned + drawCount)

  const players = collectBets(state.players)
  const seats = seatOrder(players)
  const dealerPos = seats.indexOf(state.dealerIndex)
  const firstSeat = seats[(dealerPos + 1) % seats.length]
  const actingIndex = runout
    ? -1
    : players[firstSeat].folded || players[firstSeat].allIn
      ? nextActor(players, firstSeat - 1 < 0 ? players.length - 1 : firstSeat - 1)
      : firstSeat

  let next = {
    ...state,
    players,
    community: [...state.community, ...drawn],
    deckCursor: cursor + burned + drawCount,
    street: nextStreet,
    currentBet: 0,
    minRaise: state.bigBlind,
    actingIndex,
    roundComplete: runout,
    runout,
    phase: 'betting',
  }
  next.log = logLine(
    next,
    `${nextStreet.toUpperCase()} — ${drawn.map(cardLabel).join(' ')}`,
    'system',
  )
  return next
}

/* --------------------------------------------------------------- showdown */

function settle(state, { uncontested }) {
  const players = state.players.map((p) => ({ ...p }))
  const pots = buildPots(players)
  const byId = Object.fromEntries(players.map((p) => [p.id, p]))

  const evaluated = {}
  if (!uncontested) {
    for (const p of players) {
      if (!p.folded && !p.out && p.hole.length === 2) {
        evaluated[p.id] = evaluateHand([...p.hole, ...state.community])
      }
    }
  }

  const payouts = {}
  const potResults = []
  let refunded = 0
  for (const pot of pots) {
    const eligible = pot.eligible.filter((id) => !byId[id].folded)

    // No live player reached this slice — it is an uncalled bet, so it goes
    // back to whoever put it in rather than being swept into someone's stack.
    if (eligible.length === 0) {
      for (const [id, part] of Object.entries(pot.contributions)) {
        payouts[id] = (payouts[id] ?? 0) + part
        refunded += part
      }
      continue
    }

    let winners
    if (uncontested || eligible.length === 1) {
      winners = [eligible[0]]
    } else {
      const best = Math.max(...eligible.map((id) => evaluated[id].score))
      winners = eligible.filter((id) => evaluated[id].score === best)
    }

    const share = Math.floor(pot.amount / winners.length)
    let remainder = pot.amount - share * winners.length
    for (const id of winners) {
      // Odd chips go to the first winner left of the button.
      const extra = remainder > 0 ? 1 : 0
      remainder -= extra
      payouts[id] = (payouts[id] ?? 0) + share + extra
    }
    potResults.push({ amount: pot.amount, winners })
  }

  for (const p of players) {
    if (payouts[p.id]) p.chips += payouts[p.id]
    p.handResult = evaluated[p.id] ?? null
  }

  const winnerIds = [...new Set(potResults.flatMap((r) => r.winners))]
  const potSize = totalPot(state.players) - refunded

  let next = {
    ...state,
    players,
    phase: 'showdown',
    actingIndex: -1,
    roundComplete: false,
    runout: false,
    results: {
      uncontested,
      pots: potResults,
      payouts,
      winnerIds,
      potSize,
      showCards: !uncontested,
    },
  }

  const summary = winnerIds
    .map((id) => {
      const name = byId[id].name
      const detail = !uncontested && evaluated[id] ? ` (${evaluated[id].name})` : ''
      return `${name}${detail} +${payouts[id]}`
    })
    .join(', ')
  next.log = logLine(next, `쇼다운 — ${summary}`, 'win')

  const alive = players.filter((p) => p.chips > 0)
  if (alive.length <= 1) {
    next.phase = 'showdown'
    next.gameOverPending = true
  }
  return next
}

/* ---------------------------------------------------------------- reducer */

export function gameReducer(state, action) {
  switch (action.type) {
    case 'SETUP_GAME':
      return setupGame(state, action.payload)

    case 'BEGIN_HAND':
      return beginHand(state)

    case 'SHUFFLE_DONE':
      return dealHand(state, action.payload?.method ?? 'riffle')

    case 'DEAL_DONE':
      return { ...state, phase: 'betting' }

    case 'ACT': {
      if (state.phase !== 'betting' || state.actingIndex < 0) return state
      return applyAction(state, action.payload)
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
  return totalPot(state.players)
}

export function selectActingPlayer(state) {
  return state.actingIndex >= 0 ? state.players[state.actingIndex] : null
}

export function selectLegalActions(state, player) {
  if (!player) return null
  const toCall = Math.max(0, state.currentBet - player.bet)
  const maxTotal = player.bet + player.chips
  const minRaiseTotal = Math.min(state.currentBet + state.minRaise, maxTotal)
  return {
    canCheck: toCall === 0,
    canCall: toCall > 0,
    callAmount: Math.min(toCall, player.chips),
    canRaise: maxTotal > state.currentBet,
    minRaiseTotal,
    maxRaiseTotal: maxTotal,
    isAllInCall: toCall >= player.chips,
  }
}
