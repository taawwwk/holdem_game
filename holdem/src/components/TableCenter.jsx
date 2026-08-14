import { AnimatePresence, motion } from 'framer-motion'
import { Coins } from 'lucide-react'
import PlayingCard from './PlayingCard'

const STREET_LABEL = {
  preflop: 'PRE-FLOP',
  flop: 'FLOP',
  turn: 'TURN',
  river: 'RIVER',
}

function EmptySlot({ index }) {
  return (
    <div
      className="w-14 h-20 shrink-0 rounded-md border border-dashed border-emerald-300/15 bg-emerald-950/25"
      aria-hidden
      data-slot={index}
    />
  )
}

export default function TableCenter({ community, pot, street, phase, winningCardIds }) {
  const slots = Array.from({ length: 5 }, (_, i) => community[i] ?? null)

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        layout
        className="flex items-center gap-2 rounded-full border border-brass-500/25 bg-felt-950/70 px-4 py-1.5"
      >
        <Coins className="h-4 w-4 text-brass-400" />
        <span className="text-xs font-semibold tracking-widest text-emerald-100/50">POT</span>
        <motion.span
          key={pot}
          initial={{ scale: 1.25, color: '#e6c274' }}
          animate={{ scale: 1, color: '#ffffff' }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          className="text-lg font-black tabular-nums"
        >
          {pot.toLocaleString()}
        </motion.span>
      </motion.div>

      <div className="flex items-center gap-2">
        {/* Plain `sync` mode: popLayout would hand refs to the slot placeholders. */}
        <AnimatePresence>
          {slots.map((card, i) =>
            card ? (
              <PlayingCard
                key={card.id}
                card={card}
                index={i < 3 ? i : 0}
                size="md"
                highlight={winningCardIds?.has(card.id)}
                dim={winningCardIds ? !winningCardIds.has(card.id) : false}
              />
            ) : (
              <EmptySlot key={`slot-${i}`} index={i} />
            ),
          )}
        </AnimatePresence>
      </div>

      <div className="flex h-5 items-center">
        {phase !== 'setup' && (
          <motion.span
            key={street}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] font-bold tracking-[0.3em] text-emerald-200/40"
          >
            {STREET_LABEL[street]}
          </motion.span>
        )}
      </div>
    </div>
  )
}
