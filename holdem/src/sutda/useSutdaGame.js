import { useCallback, useEffect, useReducer, useRef } from 'react'
import {
  initialState,
  selectActingPlayer,
  selectLegalActions,
  selectPot,
  sutdaReducer,
} from './reducer.js'
import { decideAction, thinkingDelay } from './aiLogic.js'
import { sfx } from '../audio/sfx.js'
import { ROW_STEP, showdownDuration } from '../components/ShowdownBoard'

const DEAL_ANIMATION_MS = 1000
const STREET_PAUSE_MS = 850
const RUNOUT_PAUSE_MS = 1100
const FOLDED_OUT_MS = 2600
const VOID_MS = 3400

export function useSutdaGame() {
  const [state, dispatch] = useReducer(sutdaReducer, initialState)
  const timerRef = useRef(null)

  const schedule = useCallback((fn, ms) => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(fn, ms)
  }, [])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const actingPlayer = selectActingPlayer(state)
  const legal = selectLegalActions(state, actingPlayer)
  const pot = selectPot(state)

  useEffect(() => {
    if (state.phase !== 'dealing') return
    schedule(() => dispatch({ type: 'DEAL_DONE' }), DEAL_ANIMATION_MS)
  }, [state.phase, state.handNumber, schedule])

  useEffect(() => {
    if (state.phase !== 'betting' || !state.roundComplete) return
    schedule(
      () => dispatch({ type: 'ADVANCE_STREET' }),
      state.runout ? RUNOUT_PAUSE_MS : STREET_PAUSE_MS,
    )
  }, [state.phase, state.roundComplete, state.runout, state.street, schedule])

  useEffect(() => {
    if (state.phase !== 'betting' || state.roundComplete) return
    if (!actingPlayer || actingPlayer.isHuman || !legal) return

    const opponents = state.players.filter(
      (p) => !p.out && !p.folded && p.id !== actingPlayer.id,
    ).length

    schedule(() => {
      dispatch({ type: 'ACT', payload: decideAction({ player: actingPlayer, state, legal, opponents }) })
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

  useEffect(() => {
    if (state.phase !== 'showdown') return
    const revealed = state.results?.showCards
      ? state.players.filter((p) => !p.folded && !p.out && p.handResult).length
      : 0
    const ms = state.results?.voided
      ? VOID_MS
      : revealed > 0
        ? showdownDuration(revealed)
        : FOLDED_OUT_MS
    schedule(() => dispatch({ type: 'END_HAND' }), ms)
  }, [state.phase, state.handNumber, state.results, state.players, schedule])

  /* ------------------------------------------------------------------ sound */

  const seenLogId = useRef(0)
  const dealtStreet = useRef('')
  const settledHand = useRef(0)

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

  // One flick per card as each street's cards go out.
  useEffect(() => {
    const key = `${state.handNumber}:${state.street}`
    if (state.phase === 'setup' || dealtStreet.current === key) return
    if (state.phase !== 'dealing' && state.phase !== 'betting') return
    dealtStreet.current = key
    const cards = state.players.filter((p) => !p.out && !p.folded).length
    for (let i = 0; i < cards; i++) sfx.card(i * 0.085)
  }, [state.phase, state.handNumber, state.street, state.players])

  useEffect(() => {
    if (state.phase !== 'showdown' || !state.results) return
    if (settledHand.current === state.handNumber) return
    settledHand.current = state.handNumber

    if (state.results.voided) {
      sfx.knock()
      sfx.lose(0.3)
      return
    }

    const human = state.players.find((p) => p.isHuman)
    const won = state.results.winnerIds.includes(human?.id)
    const revealed = state.results.showCards
      ? state.players.filter((p) => !p.folded && !p.out && p.handResult).length
      : 0

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

  const nextHand = useCallback(() => dispatch({ type: 'BEGIN_HAND' }), [])

  const resetGame = useCallback(() => {
    clearTimeout(timerRef.current)
    dispatch({ type: 'RESET' })
  }, [])

  return {
    state,
    pot,
    actingPlayer,
    legal,
    dealerIsHuman: state.players[state.dealerIndex]?.isHuman ?? false,
    startGame,
    finishShuffle,
    act,
    nextHand,
    resetGame,
  }
}
