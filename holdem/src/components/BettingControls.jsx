import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronsUp, Flame, Phone, X } from 'lucide-react'

const QUICK = [
  { label: '1/2 팟', fraction: 0.5 },
  { label: '3/4 팟', fraction: 0.75 },
  { label: '팟', fraction: 1 },
]

export default function BettingControls({ player, legal, state, pot, onAct, disabled }) {
  const [raiseTo, setRaiseTo] = useState(legal?.minRaiseTotal ?? 0)

  // Reset the slider whenever the price of poker changes.
  useEffect(() => {
    if (legal) setRaiseTo(legal.minRaiseTotal)
  }, [legal?.minRaiseTotal, legal?.maxRaiseTotal, state.street, state.handNumber])

  if (!legal) return null

  const canSlide = legal.canRaise && legal.maxRaiseTotal > legal.minRaiseTotal
  const isAllInRaise = raiseTo >= legal.maxRaiseTotal
  const raiseCost = raiseTo - player.bet

  const setFraction = (fraction) => {
    const target = state.currentBet + Math.round((pot + legal.callAmount) * fraction)
    setRaiseTo(Math.min(Math.max(target, legal.minRaiseTotal), legal.maxRaiseTotal))
  }

  const btn =
    'flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-35'

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl rounded-2xl border border-brass-500/20 bg-felt-950/85 p-3 backdrop-blur"
    >
      {legal.canRaise && (
        <div className="mb-3">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-emerald-100/55">
              레이즈 금액{' '}
              <span className="ml-1 font-bold tabular-nums text-brass-400">
                {raiseTo.toLocaleString()}
              </span>
              <span className="ml-1 text-emerald-100/35">
                (추가 {Math.max(0, raiseCost).toLocaleString()})
              </span>
            </span>
            <div className="flex gap-1">
              {QUICK.map((q) => (
                <button
                  key={q.label}
                  disabled={disabled || !canSlide}
                  onClick={() => setFraction(q.fraction)}
                  className="rounded-md border border-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-100/60 transition-colors hover:border-brass-400/50 hover:text-brass-400 disabled:opacity-30"
                >
                  {q.label}
                </button>
              ))}
              <button
                disabled={disabled}
                onClick={() => setRaiseTo(legal.maxRaiseTotal)}
                className="rounded-md border border-rose-400/25 px-2 py-0.5 text-[10px] font-semibold text-rose-300 transition-colors hover:bg-rose-500/15"
              >
                MAX
              </button>
            </div>
          </div>
          <input
            type="range"
            min={legal.minRaiseTotal}
            max={legal.maxRaiseTotal}
            step={state.smallBlind}
            value={raiseTo}
            disabled={disabled || !canSlide}
            onChange={(e) => setRaiseTo(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-emerald-950 accent-brass-500 disabled:opacity-40"
          />
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <motion.button
          whileTap={{ scale: 0.96 }}
          disabled={disabled}
          onClick={() => onAct('fold')}
          className={`${btn} bg-slate-700/80 text-slate-100 hover:bg-slate-600`}
        >
          <X className="h-4 w-4" />
          Fold
        </motion.button>

        {legal.canCheck ? (
          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={disabled}
            onClick={() => onAct('check')}
            className={`${btn} bg-emerald-700/85 text-white hover:bg-emerald-600`}
          >
            <Check className="h-4 w-4" />
            Check
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={disabled}
            onClick={() => onAct('call')}
            className={`${btn} bg-sky-700/85 text-white hover:bg-sky-600`}
          >
            <Phone className="h-4 w-4" />
            {legal.isAllInCall ? 'All-in Call' : 'Call'}
            <span className="tabular-nums opacity-80">{legal.callAmount.toLocaleString()}</span>
          </motion.button>
        )}

        <motion.button
          whileTap={{ scale: 0.96 }}
          disabled={disabled || !legal.canRaise}
          onClick={() => onAct(isAllInRaise ? 'allin' : 'raise', raiseTo)}
          className={`${btn} ${
            isAllInRaise
              ? 'bg-rose-600 text-white hover:bg-rose-500'
              : 'bg-brass-500 text-black hover:bg-brass-400'
          }`}
        >
          {isAllInRaise ? <Flame className="h-4 w-4" /> : <ChevronsUp className="h-4 w-4" />}
          {isAllInRaise ? 'All-in' : state.currentBet === 0 ? 'Bet' : 'Raise'}
          <span className="tabular-nums opacity-80">{raiseTo.toLocaleString()}</span>
        </motion.button>
      </div>
    </motion.div>
  )
}
