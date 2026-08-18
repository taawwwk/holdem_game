import { motion } from 'framer-motion'
import { Coins, Crown, ShieldAlert, Swords } from 'lucide-react'
import SutdaCard from './SutdaCard'
import { ROW_STEP } from '../components/ShowdownBoard'

const OVERRIDE_BADGE = {
  amhaengeosa: { label: '암행어사', icon: ShieldAlert, tone: 'bg-sky-600/90 text-white' },
  ttaengjabi: { label: '땡잡이', icon: Swords, tone: 'bg-violet-600/90 text-white' },
  gusa: { label: '구사', icon: ShieldAlert, tone: 'bg-amber-500/90 text-black' },
}

function badgesFor(hand, rules) {
  const out = []
  if (rules?.amhaengeosa && hand?.amhaengeosa) out.push('amhaengeosa')
  if (rules?.ttaengjabi && hand?.ttaengjabi) out.push('ttaengjabi')
  if (rules?.gusa && hand?.gusa) out.push('gusa')
  return out
}

function HandRow({ player, isWinner, payout, delay, total, rules }) {
  const hand = player.handResult
  const badges = badgesFor(hand, rules)

  return (
    <motion.div
      initial={{ opacity: 0, x: -28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, type: 'spring', stiffness: 220, damping: 26 }}
      className={`relative flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-3 py-2 ${
        isWinner ? 'border-brass-400/70 bg-brass-500/10' : 'border-emerald-400/10 bg-felt-900/60'
      }`}
    >
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

      <div className="flex items-end gap-1.5">
        {player.hole.map((card, i) => (
          <SutdaCard key={card.id} card={card} size="sm" index={i} baseDelay={delay + 0.12} />
        ))}
      </div>

      <div className="ml-auto flex shrink-0 flex-col items-end gap-0.5 pl-3 text-right">
        <motion.span
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.5 }}
          className={`text-sm font-black ${isWinner ? 'text-brass-400' : 'text-emerald-100/70'}`}
        >
          {hand?.name ?? '-'}
        </motion.span>

        {badges.length > 0 && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.6 }}
            className="flex gap-1"
          >
            {badges.map((key) => {
              const b = OVERRIDE_BADGE[key]
              const Icon = b.icon
              return (
                <span
                  key={key}
                  className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold ${b.tone}`}
                >
                  <Icon className="h-2.5 w-2.5" />
                  {b.label}
                </span>
              )
            })}
          </motion.span>
        )}

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

/** Every live hand turned face up, weakest first, winner last. */
export default function SutdaShowdown({ players, results, rules, onNext }) {
  const contenders = players.filter((p) => !p.folded && !p.out && p.handResult)
  const ranked = [...contenders].sort(
    (a, b) => (a.handResult?.score ?? 0) - (b.handResult?.score ?? 0),
  )
  const voidedBy = results.voided ? players.find((p) => p.id === results.voidedBy) : null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-felt-950/80 px-4 py-3 backdrop-blur-[3px]"
    >
      <div className="pointer-events-auto flex max-h-full w-full max-w-xl flex-col overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 flex items-baseline justify-center gap-2"
        >
          <h2 className="text-lg font-black tracking-widest text-brass-400">
            {results.voided ? '무효' : '승부'}
          </h2>
          <span className="text-[11px] text-emerald-100/45">
            {results.voided ? '판돈은 다음 판으로' : '낮은 패부터 공개'}
          </span>
        </motion.div>

        {voidedBy && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-2 rounded-xl border border-amber-400/50 bg-amber-500/10 px-4 py-2 text-center"
          >
            <span className="text-sm font-bold text-amber-300">
              {voidedBy.name}의 구사 — 판을 무릅니다
            </span>
            <span className="mt-0.5 block text-[11px] text-amber-100/60">
              판돈 {results.potSize.toLocaleString()}이 다음 판으로 넘어갑니다
            </span>
          </motion.div>
        )}

        <div className="space-y-2">
          {ranked.map((player, i) => (
            <HandRow
              key={player.id}
              player={player}
              total={ranked.length}
              delay={i * ROW_STEP}
              rules={rules}
              isWinner={results.winnerIds.includes(player.id)}
              payout={results.payouts?.[player.id] ?? 0}
            />
          ))}
        </div>

        {onNext && (
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onNext}
            className="mt-3 shrink-0 self-center rounded-xl bg-brass-500 px-8 py-3 text-base font-black text-black shadow-lg shadow-brass-500/25 hover:bg-brass-400"
          >
            {results.voided ? '다시 돌리기 →' : '다음 판 →'}
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
