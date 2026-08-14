import { useState } from 'react'
import { motion } from 'framer-motion'
import { Coins, Play, Spade, Users } from 'lucide-react'
import { BOT_PROFILES } from '../game/aiLogic.js'
import { sfx } from '../audio/sfx.js'

const CHIP_OPTIONS = [500, 1000, 2000, 5000]
const BLIND_OPTIONS = [5, 10, 25, 50]

function OptionRow({ icon: Icon, label, hint, children }) {
  return (
    <div className="rounded-xl border border-emerald-400/12 bg-felt-900/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-brass-400" />
        <span className="text-sm font-semibold text-emerald-50">{label}</span>
        {hint && <span className="ml-auto text-[11px] text-emerald-100/40">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

export default function SetupScreen({ onStart }) {
  const [botCount, setBotCount] = useState(1)
  const [startingChips, setStartingChips] = useState(1000)
  const [smallBlind, setSmallBlind] = useState(10)

  const chipClass = (active) =>
    `rounded-lg px-3 py-2 text-sm font-bold transition-all ${
      active
        ? 'bg-brass-500 text-black shadow-lg shadow-brass-500/20'
        : 'bg-felt-800/80 text-emerald-100/60 hover:bg-felt-700'
    }`

  return (
    <div className="felt-surface flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        className="relative z-10 w-full max-w-lg rounded-3xl border border-brass-500/25 bg-felt-950/85 p-7 shadow-2xl backdrop-blur"
      >
        <div className="mb-6 text-center">
          <motion.div
            initial={{ rotate: -12, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
            className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-brass-500/15 text-brass-400"
          >
            <Spade className="h-8 w-8" />
          </motion.div>
          <h1 className="text-3xl font-black tracking-tight text-white">HOLD'EM ARENA</h1>
          <p className="mt-1 text-sm text-emerald-100/50">
            딜러 버튼이 매 핸드 돌아갑니다 — 당신 차례엔 직접 카드를 섞으세요
          </p>
        </div>

        <div className="space-y-3">
          <OptionRow icon={Users} label="AI 봇 수" hint={`총 ${botCount + 1}명`}>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setBotCount(n)} className={chipClass(botCount === n)}>
                  {n}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {BOT_PROFILES.slice(0, botCount).map((b) => (
                <motion.span
                  key={b.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1 rounded-full bg-felt-800 px-2 py-1 text-[11px] text-emerald-100/70"
                >
                  <span>{b.avatar}</span>
                  {b.name}
                  <span className="text-emerald-100/35">· {b.style.label}</span>
                </motion.span>
              ))}
            </div>
            {botCount === 1 && (
              <p className="mt-2 text-[11px] text-brass-400/70">1v1 헤즈업 — 딜러가 SB를 냅니다</p>
            )}
          </OptionRow>

          <OptionRow icon={Coins} label="시작 칩">
            <div className="grid grid-cols-4 gap-2">
              {CHIP_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setStartingChips(c)}
                  className={chipClass(startingChips === c)}
                >
                  {c.toLocaleString()}
                </button>
              ))}
            </div>
          </OptionRow>

          <OptionRow icon={Spade} label="블라인드" hint={`SB ${smallBlind} / BB ${smallBlind * 2}`}>
            <div className="grid grid-cols-4 gap-2">
              {BLIND_OPTIONS.map((b) => (
                <button
                  key={b}
                  onClick={() => setSmallBlind(b)}
                  className={chipClass(smallBlind === b)}
                >
                  {b}
                </button>
              ))}
            </div>
          </OptionRow>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            sfx.click()
            onStart({ botCount, startingChips, smallBlind })
          }}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brass-500 py-3.5 text-base font-black text-black shadow-lg shadow-brass-500/25 transition-colors hover:bg-brass-400"
        >
          <Play className="h-5 w-5 fill-current" />
          게임 시작
        </motion.button>
      </motion.div>
    </div>
  )
}
