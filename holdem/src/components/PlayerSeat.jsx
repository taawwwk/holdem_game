import { AnimatePresence, motion } from 'framer-motion'
import { Circle, Coins, Crown, Timer } from 'lucide-react'
import PlayingCard from './PlayingCard'

const ACCENTS = {
  sky: 'from-sky-500/25 to-sky-900/10 border-sky-400/30',
  rose: 'from-rose-500/25 to-rose-900/10 border-rose-400/30',
  amber: 'from-amber-500/25 to-amber-900/10 border-amber-400/30',
  violet: 'from-violet-500/25 to-violet-900/10 border-violet-400/30',
  emerald: 'from-emerald-500/25 to-emerald-900/10 border-emerald-400/30',
  cyan: 'from-cyan-500/25 to-cyan-900/10 border-cyan-400/30',
}

const ACTION_TONE = {
  fold: 'bg-slate-600/80 text-slate-200',
  check: 'bg-slate-500/80 text-white',
  call: 'bg-sky-600/90 text-white',
  raise: 'bg-amber-500/90 text-black',
  allin: 'bg-rose-600/95 text-white',
}

function BetChips({ amount }) {
  if (!amount) return null
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.6, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.4, y: -18 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className="chip-glow flex items-center gap-1 rounded-full bg-felt-950/85 px-2.5 py-1 text-xs font-bold text-brass-400"
    >
      <Coins className="h-3 w-3" />
      {amount.toLocaleString()}
    </motion.div>
  )
}

export default function PlayerSeat({
  player,
  CardComponent = PlayingCard,
  isDealer,
  isActing,
  isWinner,
  revealCards,
  compact = false,
  showEquity = null,
}) {
  if (player.out) {
    return (
      <div className="flex w-40 flex-col items-center opacity-35">
        <div className="rounded-xl border border-slate-600/30 bg-slate-900/40 px-3 py-2 text-center">
          <div className="text-lg grayscale">{player.avatar}</div>
          <div className="text-[11px] font-medium text-slate-400 line-through">{player.name}</div>
          <div className="text-[10px] text-slate-500">탈락</div>
        </div>
      </div>
    )
  }

  const accent = ACCENTS[player.accent] ?? ACCENTS.emerald

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Cards above the plate for bots, below for the human seat. */}
      {!compact && (
        <div className="flex gap-1">
          <AnimatePresence>
            {player.hole.map((card, i) => (
              <CardComponent
                key={card.id}
                card={card}
                index={i}
                size="sm"
                faceDown={!revealCards}
                dim={player.folded}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <motion.div
        animate={
          isActing
            ? { scale: 1.04, boxShadow: '0 0 0 2px rgba(230,194,116,0.9), 0 0 24px rgba(230,194,116,0.35)' }
            : { scale: 1, boxShadow: '0 0 0 0px rgba(230,194,116,0)' }
        }
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className={`relative w-40 rounded-xl border bg-gradient-to-b ${accent} px-3 py-2 backdrop-blur-sm ${
          player.folded ? 'opacity-45 saturate-50' : ''
        } ${isWinner ? 'ring-2 ring-brass-400' : ''}`}
      >
        {isDealer && (
          <div className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-black text-black shadow-lg">
            D
          </div>
        )}
        {isWinner && (
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            className="absolute -top-3 -right-2 text-brass-400"
          >
            <Crown className="h-5 w-5 drop-shadow" />
          </motion.div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xl leading-none">{player.avatar}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 truncate text-sm font-bold text-white">
              {player.name}
              {isActing && <Timer className="h-3 w-3 animate-pulse text-brass-400" />}
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-brass-400">
              <Coins className="h-3 w-3" />
              {player.chips.toLocaleString()}
              {player.allIn && (
                <span className="ml-1 rounded bg-rose-600/90 px-1 text-[9px] font-bold text-white">
                  ALL-IN
                </span>
              )}
            </div>
          </div>
        </div>

        {player.style && (
          <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-100/45">
            <Circle className="h-2 w-2 fill-current" />
            {player.style.label}
            {showEquity != null && (
              <span className="ml-auto text-brass-400/70">승률 {Math.round(showEquity * 100)}%</span>
            )}
          </div>
        )}

        {player.handResult && revealCards && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 rounded bg-black/35 px-1.5 py-0.5 text-center text-[10px] font-semibold text-emerald-200"
          >
            {player.handResult.name}
          </motion.div>
        )}
      </motion.div>

      <div className="flex h-7 items-center gap-2">
        <AnimatePresence>
          {player.lastAction && (
            <motion.span
              key={player.lastAction.label + player.lastAction.amount}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                ACTION_TONE[player.lastAction.type] ?? ACTION_TONE.check
              }`}
            >
              {player.lastAction.label}
            </motion.span>
          )}
          <BetChips key="bet" amount={player.bet} />
        </AnimatePresence>
      </div>
    </div>
  )
}
