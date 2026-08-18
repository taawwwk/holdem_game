import { motion } from 'framer-motion'
import { ChevronRight, Spade } from 'lucide-react'
import { sfx } from '../audio/sfx.js'
import SoundToggle from './SoundToggle'

const GAMES = [
  {
    key: 'holdem',
    title: "HOLD'EM",
    subtitle: '텍사스 홀덤',
    blurb: '공용 카드 5장과 내 2장으로 최선의 다섯 장을 짓는 정통 포커.',
    facts: ['카드 52장', '프리플롭 → 리버', '최대 6명'],
    icon: <Spade className="h-7 w-7" />,
    tint: 'from-emerald-500/20 to-emerald-900/5 border-emerald-400/25 hover:border-emerald-300/60',
    accent: 'text-emerald-300',
  },
  {
    key: 'sutda',
    title: '섰다',
    subtitle: '화투 두 장 승부',
    blurb: '화투 20장 중 두 장. 광땡과 땡, 그리고 암행어사가 판을 뒤집습니다.',
    facts: ['화투 20장', '한 장씩 두 번', '최대 6명'],
    icon: <span className="text-3xl leading-none">🎴</span>,
    tint: 'from-rose-500/20 to-rose-900/5 border-rose-400/25 hover:border-rose-300/60',
    accent: 'text-rose-300',
  },
]

export default function GameSelect({ onPick }) {
  return (
    <div className="felt-surface flex min-h-screen flex-col items-center justify-center p-4">
      <div className="absolute top-3 right-4 z-10">
        <SoundToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        className="relative z-10 w-full max-w-3xl"
      >
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            CARD <span className="text-brass-400">ARENA</span>
          </h1>
          <p className="mt-2 text-sm text-emerald-100/50">
            AI를 상대로 한 판. 딜러가 되면 직접 카드를 섞습니다.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {GAMES.map((game, i) => (
            <motion.button
              key={game.key}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, type: 'spring', stiffness: 220, damping: 24 }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                sfx.click()
                onPick(game.key)
              }}
              className={`group flex flex-col rounded-2xl border bg-gradient-to-b p-6 text-left backdrop-blur transition-colors ${game.tint}`}
            >
              <span className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-felt-950/60 ${game.accent}`}>
                {game.icon}
              </span>

              <span className="text-2xl font-black tracking-tight text-white">{game.title}</span>
              <span className={`text-xs font-semibold ${game.accent}`}>{game.subtitle}</span>

              <span className="mt-3 text-sm leading-relaxed text-emerald-100/60">{game.blurb}</span>

              <span className="mt-4 flex flex-wrap gap-1.5">
                {game.facts.map((f) => (
                  <span
                    key={f}
                    className="rounded-full bg-felt-950/60 px-2 py-0.5 text-[11px] text-emerald-100/50"
                  >
                    {f}
                  </span>
                ))}
              </span>

              <span className="mt-5 flex items-center gap-1 text-sm font-bold text-brass-400">
                시작하기
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
