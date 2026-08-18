/**
 * Betting machinery shared by every game at this table.
 *
 * Nothing here knows what a hand *is* — no deck, no ranking, no streets. It
 * only moves chips, decides who acts next, and splits the pot among whoever a
 * game says has won. Hold'em and Sutda both drive it.
 *
 * A player is `{ id, name, chips, bet, committed, folded, allIn, acted, out }`
 * where `bet` is this round's wager and `committed` is the whole hand's.
 */

let logSeq = 0

/** Appends a line to a capped action log. */
export function logLine(state, text, tone = 'info') {
  logSeq += 1
  return [...state.log, { id: logSeq, text, tone }].slice(-40)
}

/* ------------------------------------------------------------------- seats */

export function seatOrder(players) {
  return players.map((p, i) => i).filter((i) => !players[i].out)
}

/** Next seat after `from` (exclusive) that still has a decision to make. */
export function nextActor(players, from) {
  const n = players.length
  const start = ((from % n) + n) % n
  for (let step = 1; step <= n; step++) {
    const idx = (start + step) % n
    const p = players[idx]
    if (!p.out && !p.folded && !p.allIn) return idx
  }
  return -1
}

export function contenders(players) {
  return players.filter((p) => !p.out && !p.folded)
}

export function canStillAct(players) {
  return players.filter((p) => !p.out && !p.folded && !p.allIn)
}

export function isRoundComplete(state) {
  const live = contenders(state.players)
  if (live.length <= 1) return true
  const actors = canStillAct(state.players)
  if (actors.length === 0) return true
  // One player left to act while everyone else is all-in: nothing left to call.
  if (actors.length === 1 && actors[0].bet >= state.currentBet) return true
  return actors.every((p) => p.acted && p.bet === state.currentBet)
}

/* -------------------------------------------------------------------- pots */

/**
 * Splits everything committed into main and side pots, one slice per distinct
 * commitment level, and records who paid into each slice so a slice nobody
 * live can win is refundable.
 */
export function buildPots(players) {
  const committed = players.filter((p) => p.committed > 0)
  if (committed.length === 0) return []
  const levels = [...new Set(committed.map((p) => p.committed))].sort((a, b) => a - b)

  const pots = []
  let prev = 0
  for (const level of levels) {
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

export function totalPot(players) {
  return players.reduce((sum, p) => sum + p.committed, 0)
}

/* -------------------------------------------------------------- hand setup */

/** Clears per-hand state and drops anyone who ran out of chips. */
export function freshHandPlayers(players) {
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

/** Moves the button to the next seat still in the game. Mutates nothing. */
export function rotateButton(players, dealerIndex) {
  for (let step = 1; step <= players.length; step++) {
    const idx = (dealerIndex + step) % players.length
    if (!players[idx].out) return idx
  }
  return dealerIndex
}

/**
 * An ante: dead money that goes straight into the pot without counting as a
 * wager in the opening round. Keeping it out of `bet` is what lets the round
 * still close on a check, since `bet` has to reach `currentBet` (0) for that.
 */
export function postAnte(player, amount) {
  const paid = Math.min(amount, player.chips)
  player.chips -= paid
  player.committed += paid
  if (player.chips === 0) player.allIn = true
  return paid
}

/** Forced bet that *is* live for the round, i.e. a blind. Mutates the player. */
export function postForcedBet(player, amount) {
  const paid = Math.min(amount, player.chips)
  player.chips -= paid
  player.bet += paid
  player.committed += paid
  if (player.chips === 0) player.allIn = true
  return paid
}

/** Sweeps this round's bets into the pot and reopens everyone's action. */
export function collectBets(players) {
  return players.map((p) => ({ ...p, bet: 0, acted: false, lastAction: null }))
}

/* ------------------------------------------------------------------ action */

/**
 * Applies one betting action and works out who is on the clock next. `amount`
 * is the *total* bet the player wants to reach this round, not the increment.
 */
export function applyBettingAction(state, { type, amount }) {
  const players = state.players.map((p) => ({ ...p }))
  const idx = state.actingIndex
  if (idx < 0) return state
  const player = players[idx]
  let { currentBet, minRaise } = state
  let text = ''
  let tone = 'info'

  const labels = state.labels ?? {}
  const foldLabel = labels.fold ?? 'Fold'
  const toCall = Math.max(0, currentBet - player.bet)

  if (type === 'fold') {
    player.folded = true
    player.acted = true
    player.lastAction = { type: 'fold', label: foldLabel }
    text = `${player.name} ${labels.foldLog ?? '폴드'}`
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
    text = player.allIn ? `${player.name} 콜 올인 ${paid}` : `${player.name} 콜 ${paid}`
    tone = 'call'
  } else {
    // raise / all-in
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
      // Only a full raise reopens the action for everyone still holding cards.
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
      : `${player.name} ${labels.raiseLog ?? '레이즈'} → ${target}`
    tone = 'raise'
  }

  let next = { ...state, players, currentBet, minRaise }
  next.log = logLine(next, text, tone)

  if (contenders(players).length <= 1 || isRoundComplete(next)) {
    return { ...next, roundComplete: true, actingIndex: -1 }
  }
  return { ...next, actingIndex: nextActor(players, idx) }
}

/* ----------------------------------------------------------------- payouts */

/**
 * Awards every pot. `pickWinners(eligibleIds)` returns the id(s) that take a
 * contested pot — a plain score maximum for Hold'em, a pairwise duel for a
 * game like Sutda where some hands beat others out of rank order. It is only
 * consulted when a pot is genuinely contested.
 *
 * `carry` is dead money riding on this hand from an earlier voided one; it
 * rides along with the main pot.
 *
 * Returns the updated players plus everything the UI needs to narrate it.
 */
export function awardPots({ players: input, pickWinners, uncontested, carry = 0 }) {
  const players = input.map((p) => ({ ...p }))
  const byId = Object.fromEntries(players.map((p) => [p.id, p]))
  const pots = buildPots(players)
  if (carry > 0 && pots.length > 0) pots[0] = { ...pots[0], amount: pots[0].amount + carry }

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

    const winners =
      uncontested || eligible.length === 1 ? [eligible[0]] : pickWinners(eligible)

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
  }

  return {
    players,
    payouts,
    potResults,
    refunded,
    winnerIds: [...new Set(potResults.flatMap((r) => r.winners))],
    potSize: totalPot(input) + carry - refunded,
  }
}

/** pickWinners for any game whose hands form a plain total order. */
export function highestScoreWins(scoreOf) {
  return (ids) => {
    const best = Math.max(...ids.map((id) => scoreOf(id)))
    return ids.filter((id) => scoreOf(id) === best)
  }
}

/* --------------------------------------------------------------- selectors */

export function selectLegalActions(state, player) {
  if (!player) return null
  const toCall = Math.max(0, state.currentBet - player.bet)
  const maxTotal = player.bet + player.chips
  return {
    canCheck: toCall === 0,
    canCall: toCall > 0,
    callAmount: Math.min(toCall, player.chips),
    canRaise: maxTotal > state.currentBet,
    minRaiseTotal: Math.min(state.currentBet + state.minRaise, maxTotal),
    maxRaiseTotal: maxTotal,
    isAllInCall: toCall >= player.chips,
  }
}
