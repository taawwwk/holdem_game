import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Coins, Play, Users } from 'lucide-react'
import { BOT_PROFILES } from './aiLogic.js'
import { sfx } from '../audio/sfx.js'

const CHIP_OPTIONS = [500, 1000, 2000, 5000]
const ANTE_OPTIONS = [5, 10, 25, 50]

const RULE_OPTIONS = [
  {
    key: 'amhaengeosa',
    name: '암행어사',
    desc: '4·7을 쥐면 13광땡과 18광땡을 잡습니다. 38광땡은 못 잡습니다.',
  },
  {
    key: 'ttaengjabi',
    name: '땡잡이',
    desc: '3·7을 쥐면 장땡까지 모든 땡을 잡습니다. 광땡은 못 잡습니다.',
  },
  {
    key: 'gusa',
    name: '구사',
    desc: '4·9를 쥐고 지면 판을 무르고, 판돈은 다음 판으로 넘어갑니다.',
  },
]

function OptionRow({ icon: Icon, label, hint, children }) {
  return (
    <div className="rounded-xl border border-emerald-400/12 bg-felt-900/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-brass-400" />}
        <span className="text-sm font-semibold text-emerald-50">{label}</span>
        {hint && <span className="ml-auto text-[11px] text-emerald-100/40">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

export default function SutdaSetup({ onStart, onBack }) {
  const [botCount, setBotCount] = useState(2)
  const [startingChips, setStartingChips] = useState(1000)
  const [ante, setAnte] = useState(10)
  const [rules, setRules] = useState({ amhaengeosa: true, ttaengjabi: true, gusa: false })

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
        <button
          onClick={onBack}
          className="mb-3 flex items-center gap-1 text-[11px] text-emerald-100/50 transition-colors hover:text-brass-400"
        >
          <ArrowLeft className="h-3 w-3" />
          게임 선택
        </button>

        <div className="mb-6 text-center">
          <motion.div
            initial={{ rotate: -12, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
            className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-700/20 text-3xl"
          >
            🎴
          </motion.div>
          <h1 className="text-3xl font-black tracking-tight text-white">홀덤 섰다</h1>
          <p className="mt-1 text-sm text-emerald-100/50">
            내 패 한 장 → 공유카드 공개 → 마지막 한 장. 세 번 베팅합니다.
          </p>
          <p className="mt-2 rounded-lg bg-felt-900/70 px-3 py-2 text-[11px] leading-relaxed text-emerald-100/45">
            내 두 장과 가운데 공유카드, 그 셋 중 <b className="text-brass-400/90">가장 좋은 두 장</b>으로
            겨룹니다. 공유카드와 같은 월을 쥐면 땡, 공유카드가 광이면 광땡이 열립니다.
          </p>
        </div>

        <div className="space-y-3">
          <OptionRow icon={Users} label="AI 상대 수" hint={`총 ${botCount + 1}명`}>
            <div className="grid grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6].map((n) => (
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
            {botCount >= 5 && (
              <p className="mt-2 text-[11px] text-amber-300/70">
                인원이 많을수록 공유카드로 만든 땡·광땡이 흔해져 승부가 극단적으로 흐릅니다.
              </p>
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

          <OptionRow label="앤티 (참가비)" hint={`매 판 ${ante}씩`}>
            <div className="grid grid-cols-4 gap-2">
              {ANTE_OPTIONS.map((a) => (
                <button key={a} onClick={() => setAnte(a)} className={chipClass(ante === a)}>
                  {a}
                </button>
              ))}
            </div>
          </OptionRow>

          <OptionRow label="특수 규칙" hint="하우스룰">
            <div className="space-y-2">
              {RULE_OPTIONS.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRules((prev) => ({ ...prev, [r.key]: !prev[r.key] }))}
                  className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                    rules[r.key]
                      ? 'border-brass-400/60 bg-brass-500/10'
                      : 'border-emerald-400/10 bg-felt-800/50 hover:border-emerald-400/25'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-black ${
                      rules[r.key]
                        ? 'border-brass-400 bg-brass-500 text-black'
                        : 'border-emerald-400/30 text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-emerald-50">{r.name}</span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-emerald-100/50">
                      {r.desc}
                    </span>
                  </span>
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
            onStart({ botCount, startingChips, ante, rules })
          }}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brass-500 py-3.5 text-base font-black text-black shadow-lg shadow-brass-500/25 transition-colors hover:bg-brass-400"
        >
          <Play className="h-5 w-5 fill-current" />
          판 벌이기
        </motion.button>
      </motion.div>
    </div>
  )
}
