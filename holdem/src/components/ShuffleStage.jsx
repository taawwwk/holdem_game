import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Hand, Layers, Scissors, Shuffle, Sparkles } from 'lucide-react'
import { sfx } from '../audio/sfx.js'

export const SHUFFLE_METHODS = {
  riffle: {
    key: 'riffle',
    name: 'Riffle',
    ko: '리플 셔플',
    desc: '덱을 좌우로 가른 뒤 번갈아 교차시켜 겹칩니다.',
    icon: Shuffle,
    duration: 2300,
  },
  overhand: {
    key: 'overhand',
    name: 'Overhand',
    ko: '오버핸드 셔플',
    desc: '윗부분을 조금씩 떨어뜨려 순서를 뒤집습니다.',
    icon: Hand,
    duration: 2500,
  },
  mash: {
    key: 'mash',
    name: 'Mash',
    ko: '매쉬 셔플',
    desc: '두 뭉치를 측면에서 부드럽게 맞물려 넣습니다.',
    icon: Layers,
    duration: 2100,
  },
  strip: {
    key: 'strip',
    name: 'Strip',
    ko: '스트립 셔플',
    desc: '얇은 뭉치를 여러 번 떼어내 앞으로 옮깁니다.',
    icon: Scissors,
    duration: 2700,
  },
}

const CARD_COUNT = 20

/** Per-card keyframes for each shuffle style. */
function cardMotion(method, i) {
  switch (method) {
    case 'riffle': {
      // Halves split left/right, arc out, then zip back interleaved.
      const isLeft = i < CARD_COUNT / 2
      const side = isLeft ? -1 : 1
      const k = i % (CARD_COUNT / 2)
      return {
        animate: {
          x: [0, side * 86, side * 86, side * 14, 0],
          y: [0, -4, -4, 2, 0],
          rotate: [0, side * -11, side * -11, side * -2, 0],
        },
        transition: {
          duration: 1.05,
          times: [0, 0.22, 0.46, 0.78, 1],
          delay: k * 0.028 + (isLeft ? 0 : 0.014),
          repeat: 1,
          repeatDelay: 0.05,
          ease: 'easeInOut',
        },
      }
    }
    case 'overhand': {
      // Packets peel off the top and drop to the bottom of the stack.
      const packet = Math.floor(i / 5)
      return {
        animate: {
          x: [0, 66, 66, 4, 0],
          y: [0, -34, 10, 16, 0],
          rotate: [0, 9, 5, 2, 0],
        },
        transition: {
          duration: 0.85,
          times: [0, 0.25, 0.55, 0.8, 1],
          delay: packet * 0.34 + (i % 5) * 0.02,
          repeat: 1,
          repeatDelay: 0.3,
          ease: 'easeInOut',
        },
      }
    }
    case 'mash': {
      // Two packets slide in from the sides and mesh together.
      const side = i % 2 === 0 ? -1 : 1
      return {
        animate: {
          x: [0, side * 92, side * 34, 0],
          y: [0, side * 9, side * 3, 0],
          rotate: [0, side * 15, side * 5, 0],
        },
        transition: {
          duration: 1,
          times: [0, 0.3, 0.68, 1],
          delay: i * 0.018,
          repeat: 1,
          repeatDelay: 0.08,
          ease: 'easeInOut',
        },
      }
    }
    case 'strip':
    default: {
      // Thin packets stripped off the deck and dropped in front, over and over.
      const packet = Math.floor(i / 4)
      return {
        animate: {
          y: [0, -52, -52, 12, 0],
          x: [0, 26, 26, 2, 0],
          rotate: [0, -7, -7, -1, 0],
          scale: [1, 1.04, 1.04, 1, 1],
        },
        transition: {
          duration: 0.72,
          times: [0, 0.24, 0.5, 0.82, 1],
          delay: (4 - packet) * 0.28,
          repeat: 2,
          repeatDelay: 1.1,
          ease: 'easeInOut',
        },
      }
    }
  }
}

export function ShuffleAnimation({ method = 'riffle' }) {
  const cards = useMemo(() => Array.from({ length: CARD_COUNT }, (_, i) => i), [])

  return (
    <div className="relative flex h-44 w-full items-center justify-center overflow-hidden">
      <div className="relative h-24 w-16">
        {cards.map((i) => {
          const { animate, transition } = cardMotion(method, i)
          return (
            <motion.div
              key={i}
              className="card-back absolute inset-0 rounded-md"
              // `top` (not translateY) holds the stack offset so it survives the
              // transform keyframes below.
              style={{ zIndex: CARD_COUNT - i, top: i * -0.9 }}
              animate={animate}
              transition={transition}
            />
          )
        })}
      </div>
      {/* Felt shadow under the deck to ground the motion. */}
      <div className="pointer-events-none absolute bottom-8 h-4 w-40 rounded-[100%] bg-black/45 blur-md" />
    </div>
  )
}

const METHOD_KEYS = Object.keys(SHUFFLE_METHODS)

/** Whoever holds the button, the deck decides how it gets mixed. */
export function randomMethod() {
  return METHOD_KEYS[Math.floor(Math.random() * METHOD_KEYS.length)]
}

/** Kept for reference; the table now always picks the style at random. */
function ShuffleChoiceModal({ onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.92, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="w-full max-w-2xl rounded-2xl border border-brass-500/30 bg-felt-900/95 p-6 shadow-2xl"
      >
        <div className="mb-1 flex items-center justify-center gap-2 text-brass-400">
          <Sparkles className="h-5 w-5" />
          <h2 className="text-xl font-bold tracking-tight">당신이 딜러입니다</h2>
        </div>
        <p className="mb-5 text-center text-sm text-emerald-100/60">
          카드를 어떻게 섞을지 선택하세요
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Object.values(SHUFFLE_METHODS).map((m, i) => {
            const Icon = m.icon
            return (
              <motion.button
                key={m.key}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  sfx.click()
                  onSelect(m.key)
                }}
                className="group flex items-start gap-3 rounded-xl border border-emerald-400/15 bg-felt-800/70 p-4 text-left transition-colors hover:border-brass-400/60 hover:bg-felt-700/70"
              >
                <span className="rounded-lg bg-brass-500/15 p-2 text-brass-400 transition-colors group-hover:bg-brass-500/25">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-emerald-50">
                    {m.name}
                    <span className="ml-2 text-xs font-normal text-emerald-200/50">{m.ko}</span>
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-emerald-100/55">
                    {m.desc}
                  </span>
                </span>
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}

/**
 * Drives the whole shuffle beat: pick a style (human dealer) or announce the
 * bot's shuffle, play it, then hand control back for the deal.
 */
export default function ShuffleStage({ dealerName, onComplete }) {
  // One style is drawn at random per hand, for the player and the bots alike.
  const [playing] = useState(randomMethod)

  useEffect(() => {
    sfx.shuffle(playing)
    const t = setTimeout(() => onComplete(playing), SHUFFLE_METHODS[playing].duration)
    return () => clearTimeout(t)
  }, [playing, onComplete])

  const method = SHUFFLE_METHODS[playing]

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-felt-950/75 backdrop-blur-[2px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex w-full max-w-md flex-col items-center px-6"
      >
        <div className="mb-1 flex items-center gap-2 text-brass-400">
          <motion.span
            animate={{ rotate: [0, 12, -12, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Shuffle className="h-5 w-5" />
          </motion.span>
          <span className="text-lg font-semibold">{dealerName}이(가) 카드를 섞는 중...</span>
        </div>

        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-brass-500/15 px-2.5 py-0.5 text-xs font-bold text-brass-400">
            {method.name}
          </span>
          <span className="text-xs text-emerald-100/50">{method.desc}</span>
        </div>

        <ShuffleAnimation method={playing} />

        <div className="mt-2 h-1 w-56 overflow-hidden rounded-full bg-emerald-950/70">
          <motion.div
            className="h-full bg-brass-400"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: method.duration / 1000, ease: 'linear' }}
          />
        </div>
      </motion.div>
    </div>
  )
}
