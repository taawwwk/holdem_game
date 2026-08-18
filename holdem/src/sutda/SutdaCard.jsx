import { forwardRef } from 'react'
import { motion } from 'framer-motion'

import HwatuArt from './HwatuArt'

const SIZES = {
  sm: { box: 'w-10 h-14', round: 'rounded-[5px]', num: 'text-[9px]', name: 'hidden' },
  md: { box: 'w-14 h-20', round: 'rounded-md', num: 'text-xs', name: 'text-[8px]' },
  lg: { box: 'w-[4.6rem] h-[6.5rem]', round: 'rounded-lg', num: 'text-sm', name: 'text-[9px]' },
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
            className={`hwatu-face relative h-full w-full overflow-hidden ${s.round} ${
              card.gwang ? 'hwatu-gwang' : ''
            }`}
          >
            <HwatuArt month={card.month} gwang={card.gwang} />

            {/* Month index in the corner — the painting alone is hard to read
                at seat size, and Sutda is decided by the number. Nothing else
                sits on top of the art, so no legs or cups get covered. */}
            <span
              className={`absolute top-0 left-0 ${s.num} rounded-br bg-stone-900/75 px-1 font-black leading-tight text-amber-50`}
            >
              {card.month}
            </span>

            {card.gwang && (
              <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-700 text-[8px] font-black text-amber-200 shadow ring-1 ring-amber-200/70">
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
