import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Coins, LogOut, RotateCcw, Spade, Trophy } from 'lucide-react'
import { usePokerGame } from '../hooks/usePokerGame'
import SetupScreen from '../components/SetupScreen'
import PlayerSeat from '../components/PlayerSeat'
import TableCenter from '../components/TableCenter'
import BettingControls from '../components/BettingControls'
import ShuffleStage from '../components/ShuffleStage'
import ActionLog from '../components/ActionLog'
import PlayingCard from '../components/PlayingCard'
import SoundToggle from '../components/SoundToggle'
import ShowdownBoard from '../components/ShowdownBoard'
import { sfx } from '../audio/sfx.js'

export default function HoldemTable({ onExit }) {
  const {
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
  } = usePokerGame()

  const human = state.players.find((p) => p.isHuman)
  const bots = state.players.filter((p) => !p.isHuman)
  const showdownVisible = state.phase === 'showdown' || state.phase === 'handEnd'
  const revealAll = showdownVisible && !!state.results?.showCards

  // Ring the five cards that actually made the winning hand.
  const winningCardIds = useMemo(() => {
    if (!revealAll || !state.results?.winnerIds?.length) return null
    const ids = new Set()
    for (const id of state.results.winnerIds) {
      const p = state.players.find((x) => x.id === id)
      p?.handResult?.best?.forEach((c) => ids.add(c.id))
    }
    return ids.size ? ids : null
  }, [revealAll, state.results, state.players])

  if (state.phase === 'setup') {
    return <SetupScreen onStart={startGame} onBack={onExit} />
  }

  const humanTurn =
    state.phase === 'betting' && !state.roundComplete && actingPlayer?.isHuman && !!legal

  return (
    <div className="felt-surface flex min-h-screen flex-col">
      {/* ------------------------------------------------------------ header */}
      <header className="z-20 flex items-center gap-3 border-b border-brass-500/15 bg-felt-950/70 px-4 py-2 backdrop-blur">
        <Spade className="h-5 w-5 text-brass-400" />
        <span className="text-sm font-black tracking-tight text-white">HOLD'EM ARENA</span>
        <span className="rounded-full bg-felt-800 px-2 py-0.5 text-[11px] font-semibold text-emerald-100/60">
          HAND #{state.handNumber}
        </span>
        <span className="text-[11px] text-emerald-100/40">
          SB {state.smallBlind} / BB {state.bigBlind}
        </span>
        <span className="ml-auto flex items-center gap-1 text-[11px] text-emerald-100/50">
          딜러 <b className="text-brass-400">{state.players[state.dealerIndex]?.name}</b>
        </span>
        <SoundToggle />
        <button
          onClick={resetGame}
          className="flex items-center gap-1 rounded-lg border border-emerald-400/15 px-2 py-1 text-[11px] text-emerald-100/60 transition-colors hover:border-brass-400/50 hover:text-brass-400"
        >
          <RotateCcw className="h-3 w-3" />
          새 게임
        </button>
        <button
          onClick={onExit}
          className="flex items-center gap-1 rounded-lg border border-emerald-400/15 px-2 py-1 text-[11px] text-emerald-100/60 transition-colors hover:border-brass-400/50 hover:text-brass-400"
        >
          <LogOut className="h-3 w-3" />
          나가기
        </button>
      </header>

      <div className="flex min-h-0 flex-1 gap-3 p-3 lg:p-4">
        {/* ------------------------------------------------------- the table */}
        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col items-center justify-between">
          {/* Bots along the top rail */}
          <div className="flex w-full flex-wrap items-start justify-center gap-3">
            {bots.map((bot) => (
              <PlayerSeat
                key={bot.id}
                player={bot}
                isDealer={state.players[state.dealerIndex]?.id === bot.id}
                isActing={actingPlayer?.id === bot.id && state.phase === 'betting'}
                isWinner={showdownVisible && state.results?.winnerIds?.includes(bot.id)}
                revealCards={revealAll && !bot.folded}
              />
            ))}
          </div>

          {/* Felt island with community cards and the pot */}
          <div className="table-rail relative my-2 w-full max-w-3xl shrink-0 rounded-[999px] p-1.5">
            <div className="felt-surface flex flex-col items-center justify-center rounded-[999px] px-6 py-5">
              <TableCenter
                community={state.community}
                pot={pot}
                street={state.street}
                phase={state.phase}
                winningCardIds={winningCardIds}
              />
            </div>

            <AnimatePresence>
              {/* Folded-out hands never reach the reveal board, so they keep the banner. */}
              {showdownVisible && state.results && !state.results.showCards && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-brass-400/40 bg-felt-950 px-4 py-1.5 shadow-xl"
                >
                  <Trophy className="h-4 w-4 text-brass-400" />
                  <span className="text-sm font-bold text-white">
                    {state.results.winnerIds
                      .map((id) => state.players.find((p) => p.id === id)?.name)
                      .join(', ')}
                  </span>
                  <span className="text-sm font-black text-brass-400">
                    +{state.results.potSize.toLocaleString()}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* -------------------------------------------------- human seat */}
          <div className="flex w-full shrink-0 flex-col items-center gap-1.5">
            <div className="flex items-end gap-4">
              <div className="flex gap-1.5">
                <AnimatePresence>
                  {human?.hole.map((card, i) => (
                    <PlayingCard
                      key={card.id}
                      card={card}
                      index={i}
                      size="lg"
                      dim={human.folded}
                      highlight={winningCardIds?.has(card.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
              {human && (
                <PlayerSeat
                  player={human}
                  compact
                  isDealer={state.players[state.dealerIndex]?.id === human.id}
                  isActing={humanTurn}
                  isWinner={showdownVisible && state.results?.winnerIds?.includes(human.id)}
                  revealCards={showdownVisible}
                />
              )}
            </div>

            <div className="flex min-h-[7rem] w-full items-center justify-center">
              <AnimatePresence mode="wait">
                {humanTurn && (
                  <BettingControls
                    key="controls"
                    player={actingPlayer}
                    legal={legal}
                    state={state}
                    pot={pot}
                    onAct={act}
                    disabled={false}
                  />
                )}

                {/* With a reveal on screen the button lives on the board itself. */}
                {state.phase === 'handEnd' && !revealAll && (
                  <motion.button
                    key="next"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      sfx.click()
                      nextHand()
                    }}
                    className="rounded-xl bg-brass-500 px-8 py-3 text-base font-black text-black shadow-lg shadow-brass-500/25 hover:bg-brass-400"
                  >
                    다음 핸드 →
                  </motion.button>
                )}

                {!humanTurn && state.phase === 'betting' && (
                  <motion.div
                    key="waiting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-sm text-emerald-100/45"
                  >
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    >
                      {actingPlayer
                        ? `${actingPlayer.name}이(가) 생각 중...`
                        : '카드를 정리하는 중...'}
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ------------------------------------------------------ overlays */}
          <AnimatePresence>
            {showdownVisible && state.results?.showCards && (
              <ShowdownBoard
                key={`showdown-${state.handNumber}`}
                players={state.players}
                winnerIds={state.results.winnerIds}
                payouts={state.results.payouts}
                onNext={
                  state.phase === 'handEnd'
                    ? () => {
                        sfx.click()
                        nextHand()
                      }
                    : null
                }
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {state.phase === 'shuffle' && (
              <ShuffleStage
                key={`shuffle-${state.handNumber}`}
                dealerName={state.players[state.dealerIndex]?.name ?? 'AI'}
                dealerIsHuman={dealerIsHuman}
                onComplete={finishShuffle}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {state.phase === 'gameOver' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="rounded-2xl border border-brass-500/30 bg-felt-900 p-8 text-center"
                >
                  <Trophy className="mx-auto mb-3 h-12 w-12 text-brass-400" />
                  <h2 className="text-2xl font-black text-white">
                    {human?.chips > 0 ? '승리!' : '탈락'}
                  </h2>
                  <p className="mt-1 mb-5 text-sm text-emerald-100/55">
                    {state.handNumber}핸드 진행 · 최종 칩{' '}
                    <b className="text-brass-400">{(human?.chips ?? 0).toLocaleString()}</b>
                  </p>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={resetGame}
                      className="rounded-xl bg-brass-500 px-6 py-2.5 font-bold text-black hover:bg-brass-400"
                    >
                      다시 시작
                    </button>
                    <button
                      onClick={onExit}
                      className="rounded-xl border border-emerald-400/20 px-6 py-2.5 font-bold text-emerald-100/70 hover:border-brass-400/50"
                    >
                      게임 선택
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* --------------------------------------------------------- sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col gap-3 lg:flex">
          <div className="rounded-xl border border-emerald-400/12 bg-felt-950/60 p-3">
            <div className="mb-2 text-[11px] font-bold tracking-widest text-emerald-100/40">
              CHIP COUNT
            </div>
            <div className="space-y-1.5">
              {state.players.map((p) => (
                <div key={p.id} className="flex items-center gap-2 text-xs">
                  <span>{p.avatar}</span>
                  <span className={`flex-1 truncate ${p.out ? 'text-slate-500 line-through' : 'text-emerald-50/80'}`}>
                    {p.name}
                  </span>
                  <span className="flex items-center gap-1 font-bold tabular-nums text-brass-400">
                    <Coins className="h-3 w-3" />
                    {p.chips.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <ActionLog log={state.log} />
          </div>
        </aside>
      </div>
    </div>
  )
}
