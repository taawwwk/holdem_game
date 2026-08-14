import { motion } from 'framer-motion'
import { Coins, Crown } from 'lucide-react'
import PlayingCard from './PlayingCard'

/** Seconds between one player's reveal and the next. */
export const ROW_STEP = 0.62
const CARD_STEP = 0.08
const HOLD_MS = 2600

/** How long the whole reveal takes, so the table knows when to move on. */
export function showdownDuration(contenderCount) {
  return 900 + contenderCount * ROW_STEP * 1000 + HOLD_MS
}

function HandRow({ player, rank, isWinner, payout, delay, total }) {
  const holeIds = new Set(player.hole.map((c) => c.id))
  const best = player.handResult?.best ?? []

  return (
    <motion.div
      initial={{ opacity: 0, x: -28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, type: 'spring', stiffness: 220, damping: 26 }}
      className={`relative flex items-center gap-3 rounded-xl border px-3 py-2 ${
        isWinner
          ? 'border-brass-400/70 bg-brass-500/10'
          : 'border-emerald-400/10 bg-felt-900/60'
      }`}
    >
      {/* Winner glow arrives only once every hand is face-up. */}
      {isWinner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.55] }}
          transition={{ delay: total * ROW_STEP + 0.15, duration: 0.9 }}
          className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-brass-400"
        />
      )}

      <div className="flex w-20 shrink-0 items-center gap-1.5">
        <span className="text-lg leading-none">{player.avatar}</span>
        <span className="min-w-0 truncate text-sm font-bold text-white">{player.name}</span>
      </div>

      <div className="flex items-end gap-1">
        {best.map((card, i) => (
          <div key={card.id} className="flex flex-col items-center gap-1">
            {/* Never dimmed — reading the losing hands is the whole point. */}
            <PlayingCard card={card} size="sm" index={i} baseDelay={delay + 0.12} />
            {/* Which two cards were actually theirs — the point of the reveal. */}
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.12 + i * CARD_STEP + 0.25 }}
              className={`h-1 w-6 rounded-full ${
                holeIds.has(card.id) ? 'bg-brass-400' : 'bg-emerald-400/20'
              }`}
            />
          </div>
        ))}
      </div>

      <div className="ml-auto flex shrink-0 flex-col items-end gap-0.5 pl-3 text-right">
        <motion.span
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.55 }}
          className={`text-sm font-black ${isWinner ? 'text-brass-400' : 'text-emerald-100/70'}`}
        >
          {player.handResult?.name ?? '-'}
        </motion.span>
        {payout > 0 && (
          <motion.span
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: total * ROW_STEP + 0.3, type: 'spring', stiffness: 300 }}
            className="flex items-center gap-1 text-xs font-bold text-brass-400"
          >
            <Coins className="h-3 w-3" />+{payout.toLocaleString()}
          </motion.span>
        )}
      </div>

      {isWinner && (
        <motion.div
          initial={{ scale: 0, rotate: -40, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ delay: total * ROW_STEP + 0.2, type: 'spring', stiffness: 320, damping: 14 }}
          className="absolute -top-2.5 -left-2.5 text-brass-400"
        >
          <Crown className="h-5 w-5 drop-shadow" />
        </motion.div>
      )}
    </motion.div>
  )
}

/**
 * The showdown reveal: every player still in the hand gets their best five
 * cards laid out in order, weakest first, so the winning hand lands last.
 */
export default function ShowdownBoard({ players, winnerIds, payouts, onNext }) {
  const contenders = players.filter((p) => !p.folded && !p.out && p.handResult)
  const ranked = [...contenders].sort(
    (a, b) => (a.handResult?.score ?? 0) - (b.handResult?.score ?? 0),
  )

  // The backdrop itself takes no clicks; the panel inside it does, so the board
  // can be scrolled and the next-hand button can be pressed.
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-felt-950/80 px-4 py-3 backdrop-blur-[3px]"
    >
      {/* A crowded showdown can outgrow a short screen — scroll inside the
          panel rather than pushing the reveal off the bottom of the table. */}
      <div className="pointer-events-auto flex max-h-full w-full max-w-xl flex-col overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 flex items-baseline justify-center gap-2"
        >
          <h2 className="text-lg font-black tracking-widest text-brass-400">SHOWDOWN</h2>
          <span className="text-[11px] text-emerald-100/45">약한 손부터 공개</span>
        </motion.div>

        <div className="space-y-2">
          {ranked.map((player, i) => (
            <HandRow
              key={player.id}
              player={player}
              rank={i}
              total={ranked.length}
              delay={i * ROW_STEP}
              isWinner={winnerIds.includes(player.id)}
              payout={payouts?.[player.id] ?? 0}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: ranked.length * ROW_STEP }}
          className="mt-2 flex items-center justify-center gap-4 text-[10px] text-emerald-100/40"
        >
          <span className="flex items-center gap-1">
            <span className="h-1 w-5 rounded-full bg-brass-400" /> 내 카드
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1 w-5 rounded-full bg-emerald-400/25" /> 공용 카드
          </span>
        </motion.div>

        {/* The hand is over: continue from where the player is already looking,
            instead of a button at the far bottom of the table. */}
        {onNext && (
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onNext}
            className="mt-3 shrink-0 self-center rounded-xl bg-brass-500 px-8 py-3 text-base font-black text-black shadow-lg shadow-brass-500/25 hover:bg-brass-400"
          >
            다음 핸드 →
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
