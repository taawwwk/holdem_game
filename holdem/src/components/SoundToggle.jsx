import { useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { sfx } from '../audio/sfx.js'

export default function SoundToggle() {
  const [muted, setMuted] = useState(sfx.muted)

  return (
    <button
      onClick={() => {
        const next = sfx.toggle()
        setMuted(next)
        if (!next) sfx.click()
      }}
      title={muted ? '소리 켜기' : '소리 끄기'}
      aria-label={muted ? '소리 켜기' : '소리 끄기'}
      className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] transition-colors ${
        muted
          ? 'border-slate-500/25 text-slate-400 hover:text-slate-200'
          : 'border-brass-400/40 text-brass-400 hover:border-brass-400/70'
      }`}
    >
      {muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
      {muted ? '음소거' : '소리'}
    </button>
  )
}
