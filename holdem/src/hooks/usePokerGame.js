import { useCallback, useEffect, useReducer, useRef } from 'react'
import {
  gameReducer,
  initialState,
  selectActingPlayer,
  selectLegalActions,
  selectPot,
} from '../game/gameReducer.js'
import { decideAction, thinkingDelay } from '../game/aiLogic.js'
import { sfx } from '../audio/sfx.js'
import { ROW_STEP, showdownDuration } from '../components/ShowdownBoard'

const DEAL_ANIMATION_MS = 1300
const STREET_PAUSE_MS = 850
const RUNOUT_PAUSE_MS = 1100
const FOLDED_OUT_MS = 2600

export function usePokerGame() {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  const timerRef = useRef(null)

  const schedule = useCallback((fn, ms) => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(fn, ms)
  }, [])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const actingPlayer = selectActingPlayer(state)
  const legal = selectLegalActions(state, actingPlayer)
  const pot = selectPot(state)

  // Deal animation -> open the pre-flop betting round.
  useEffect(() => {
    if (state.phase !== 'dealing') return
    schedule(() => dispatch({ type: 'DEAL_DONE' }), DEAL_ANIMATION_MS)
  }, [state.phase, state.handNumber, schedule])

  // Betting round finished -> next street (or showdown).
  useEffect(() => {
    if (state.phase !== 'betting' || !state.roundComplete) return
    schedule(
      () => dispatch({ type: 'ADVANCE_STREET' }),
      state.runout ? RUNOUT_PAUSE_MS : STREET_PAUSE_MS,
    )
  }, [state.phase, state.roundComplete, state.runout, state.street, schedule])

  // A bot is on the clock.
  useEffect(() => {
    if (state.phase !== 'betting' || state.roundComplete) return
    if (!actingPlayer || actingPlayer.isHuman || !legal) return

    const opponents = state.players.filter(
      (p) => !p.out && !p.folded && p.id !== actingPlayer.id,
    ).length

    schedule(() => {
      const decision = decideAction({ player: actingPlayer, state, legal, opponents })
      dispatch({ type: 'ACT', payload: decision })
    }, thinkingDelay())
  }, [
    state.phase,
    state.roundComplete,
    state.actingIndex,
    state.handNumber,
    state.street,
    actingPlayer,
    legal,
    schedule,
  ])

  // Showdown -> let the reveal play out before releasing the table.
  useEffect(() => {
    if (state.phase !== 'showdown') return
    const revealed = state.results?.showCards
      ? state.players.filter((p) => !p.folded && !p.out && p.handResult).length
      : 0
    schedule(
      () => dispatch({ type: 'END_HAND' }),
      revealed > 0 ? showdownDuration(revealed) : FOLDED_OUT_MS,
    )
  }, [state.phase, state.handNumber, state.results, state.players, schedule])

  /* ------------------------------------------------------------------ sound */

  const seenLogId = useRef(0)
  const dealtHand = useRef(0)
  const settledHand = useRef(0)
  const boardCount = useRef(0)

  // One sound per new log line, so bots and the player are treated the same.
  useEffect(() => {
    const fresh = state.log.filter((entry) => entry.id > seenLogId.current)
    if (fresh.length === 0) return
    seenLogId.current = state.log[state.log.length - 1].id

    for (const entry of fresh) {
      const allIn = entry.text.includes('올인')
      if (entry.tone === 'fold') sfx.fold()
      else if (entry.tone === 'check') sfx.knock()
      else if (entry.tone === 'call') sfx.chips(allIn ? 8 : 3)
      else if (entry.tone === 'raise') allIn ? sfx.allin() : sfx.chips(5)
    }
  }, [state.log])

  // Hole cards going out, one flick per card.
  useEffect(() => {
    if (state.phase !== 'dealing' || dealtHand.current === state.handNumber) return
    dealtHand.current = state.handNumber
    const cards = state.players.filter((p) => !p.out).length * 2
    for (let i = 0; i < cards; i++) sfx.card(i * 0.085)
  }, [state.phase, state.handNumber, state.players])

  // Flop, turn and river hitting the felt.
  useEffect(() => {
    const added = state.community.length - boardCount.current
    boardCount.current = state.community.length
    if (added > 0) {
      for (let i = 0; i < added; i++) sfx.card(i * 0.14)
    }
  }, [state.community.length])

  // Pot pushed to the winner, then a verdict sting.
  useEffect(() => {
    if (state.phase !== 'showdown' || !state.results) return
    if (settledHand.current === state.handNumber) return
    settledHand.current = state.handNumber

    const human = state.players.find((p) => p.isHuman)
    const won = state.results.winnerIds.includes(human?.id)
    const revealed = state.results.showCards
      ? state.players.filter((p) => !p.folded && !p.out && p.handResult).length
      : 0

    // One flick per hand turned face up, then the verdict once the last one lands.
    for (let i = 0; i < revealed; i++) sfx.card(i * ROW_STEP)
    const verdictAt = revealed * ROW_STEP + 0.2
    sfx.chips(7, verdictAt)
    if (won) sfx.win(verdictAt + 0.25)
    else sfx.lose(verdictAt + 0.25)
  }, [state.phase, state.handNumber, state.results, state.players])

  const startGame = useCallback((config) => {
    dispatch({ type: 'SETUP_GAME', payload: config })
    dispatch({ type: 'BEGIN_HAND' })
  }, [])

  const finishShuffle = useCallback((method) => {
    dispatch({ type: 'SHUFFLE_DONE', payload: { method } })
  }, [])

  const act = useCallback((type, amount) => {
    dispatch({ type: 'ACT', payload: { type, amount } })
  }, [])

  const nextHand = useCallback(() => {
    dispatch({ type: 'BEGIN_HAND' })
  }, [])

  const resetGame = useCallback(() => {
    clearTimeout(timerRef.current)
    dispatch({ type: 'RESET' })
  }, [])

  const dealerIsHuman = state.players[state.dealerIndex]?.isHuman ?? false

  return {
    state,
    pot,
    actingPlayer,
    legal,
    dealerIsHuman,
    startGame,
    finishShuffle,
    act,
    nextHand,
    resetGame,
  }
}
