import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { SUIT_SYMBOL, isRed, rankLabel } from '../game/deck.js'

const SIZES = {
  xs: { box: 'w-7 h-10', round: 'rounded-[4px]', corner: 'text-[8px]', pip: 'text-sm' },
  sm: { box: 'w-10 h-14', round: 'rounded-[5px]', corner: 'text-[10px]', pip: 'text-lg' },
  md: { box: 'w-14 h-20', round: 'rounded-md', corner: 'text-xs', pip: 'text-2xl' },
  lg: { box: 'w-[4.6rem] h-[6.5rem]', round: 'rounded-lg', corner: 'text-sm', pip: 'text-3xl' },
}

export function CardBack({ size = 'md', className = '' }) {
  const s = SIZES[size]
  return (
    <div className={`card-back ${s.box} ${s.round} ${className}`}>
      <div className="flex h-full w-full items-center justify-center">
        <span className="text-brass-400/50 text-[10px] font-bold">♠</span>
      </div>
    </div>
  )
}

/**
 * A single card. `faceDown` shows the back, `dim` greys out cards that did not
 * make the winning five, `highlight` rings the ones that did.
 *
 * Forwards its ref so it can sit directly inside <AnimatePresence>.
 */
const PlayingCard = forwardRef(function PlayingCard(
  {
    card,
    size = 'md',
    faceDown = false,
    dim = false,
    highlight = false,
    index = 0,
    animate = true,
    baseDelay = 0,
  },
  ref,
) {
  const s = SIZES[size]
  const red = card ? isRed(card) : false

  return (
    <motion.div
      ref={ref}
      initial={animate ? { opacity: 0, y: -34, rotateY: 140, scale: 0.85 } : false}
      animate={{ opacity: 1, y: 0, rotateY: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 210,
        damping: 21,
        delay: animate ? baseDelay + index * 0.09 : 0,
      }}
      className={`${s.box} shrink-0`}
    >
      <div
        className={`h-full w-full transition-all duration-300 ${
          dim ? 'opacity-45 grayscale' : 'opacity-100'
        } ${highlight ? 'ring-2 ring-brass-400 ring-offset-2 ring-offset-felt-800 ' + s.round : ''}`}
      >
        {faceDown || !card ? (
          <div className={`card-back h-full w-full ${s.round}`}>
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-brass-400/50 text-[10px] font-bold">♠</span>
            </div>
          </div>
        ) : (
          <div
            className={`card-face relative flex h-full w-full flex-col justify-between p-1 ${s.round} ${
              red ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            <div className={`flex flex-col items-center leading-none ${s.corner}`}>
              <span className="font-black">{rankLabel(card.rank)}</span>
              <span>{SUIT_SYMBOL[card.suit]}</span>
            </div>
            <div
              className={`pointer-events-none absolute inset-0 flex items-center justify-center ${s.pip} opacity-90`}
            >
              {SUIT_SYMBOL[card.suit]}
            </div>
            <div className={`flex rotate-180 flex-col items-center leading-none ${s.corner}`}>
              <span className="font-black">{rankLabel(card.rank)}</span>
              <span>{SUIT_SYMBOL[card.suit]}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
})

export default PlayingCard
