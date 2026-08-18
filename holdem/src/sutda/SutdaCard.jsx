import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { MONTH_INFO } from './deck.js'

const SIZES = {
  sm: { box: 'w-10 h-14', round: 'rounded-[5px]', num: 'text-sm', motif: 'text-base', name: 'text-[7px]' },
  md: { box: 'w-14 h-20', round: 'rounded-md', num: 'text-lg', motif: 'text-2xl', name: 'text-[9px]' },
  lg: { box: 'w-[4.6rem] h-[6.5rem]', round: 'rounded-lg', num: 'text-xl', motif: 'text-3xl', name: 'text-[10px]' },
}

/**
 * A hwatu card, drawn rather than pictured — month number, the month's motif
 * and its name, with a 光 seal on the three brights. No image assets, so the
 * deck stays legible at any size and ships with nothing to download.
 */
const SutdaCard = forwardRef(function SutdaCard(
  { card, size = 'md', faceDown = false, dim = false, highlight = false, index = 0, animate = true, baseDelay = 0 },
  ref,
) {
  const s = SIZES[size]
  const info = card ? MONTH_INFO[card.month] : null

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
          <div className={`hwatu-back h-full w-full ${s.round}`}>
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-[10px] font-black text-rose-200/70">花</span>
            </div>
          </div>
        ) : (
          <div
            className={`hwatu-face relative flex h-full w-full flex-col items-center justify-between overflow-hidden py-1 ${s.round} ${
              card.gwang ? 'hwatu-gwang' : ''
            }`}
          >
            <span className={`${s.num} font-black leading-none text-rose-800`}>{card.month}</span>
            <span className={`${s.motif} leading-none`}>{info.motif}</span>
            <span className={`${s.name} font-semibold leading-none text-stone-600`}>
              {info.name}
            </span>

            {card.gwang && (
              <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-700 text-[8px] font-black text-amber-200 shadow">
                光
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
})

export default SutdaCard
