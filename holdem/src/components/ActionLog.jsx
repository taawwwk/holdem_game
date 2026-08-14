import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ScrollText } from 'lucide-react'

const TONE = {
  system: 'text-emerald-200/45',
  info: 'text-emerald-50/75',
  check: 'text-emerald-100/70',
  call: 'text-sky-300',
  raise: 'text-amber-300',
  fold: 'text-slate-400',
  win: 'text-brass-400 font-semibold',
}

export default function ActionLog({ log }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [log])

  return (
    <div className="flex h-full flex-col rounded-xl border border-emerald-400/12 bg-felt-950/60 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-emerald-100/40">
        <ScrollText className="h-3.5 w-3.5" />
        ACTION LOG
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto pr-1 text-xs">
        <AnimatePresence initial={false}>
          {log.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className={TONE[entry.tone] ?? TONE.info}
            >
              {entry.text}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={endRef} />
      </div>
    </div>
  )
}
