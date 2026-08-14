/**
 * Procedural sound effects built on the Web Audio API.
 *
 * Everything is synthesised at runtime — no audio files to ship, nothing to
 * download, and it keeps working offline. The context is created lazily on the
 * first sound so browser autoplay policies stay happy.
 */

const STORAGE_KEY = 'holdem-arena:muted'
const MASTER_VOLUME = 0.5

let ctx = null
let master = null
let noiseBuffer = null
let muted = readMuted()

function readMuted() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function ensureContext() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null
    ctx = new AudioCtx()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : MASTER_VOLUME
    master.connect(ctx.destination)
  }
  // A tab that was backgrounded (or never gestured on) leaves this suspended.
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function getNoise() {
  if (!noiseBuffer) {
    const length = Math.floor(ctx.sampleRate * 0.6)
    noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  }
  return noiseBuffer
}

/* --------------------------------------------------------------- primitives */

function noiseHit(at, { dur = 0.12, from = 900, to = 2600, q = 1.1, gain = 0.25, type = 'bandpass' }) {
  const src = ctx.createBufferSource()
  src.buffer = getNoise()
  src.loop = true

  const filter = ctx.createBiquadFilter()
  filter.type = type
  filter.Q.value = q
  filter.frequency.setValueAtTime(from, at)
  filter.frequency.exponentialRampToValueAtTime(Math.max(to, 40), at + dur)

  const env = ctx.createGain()
  env.gain.setValueAtTime(0.0001, at)
  env.gain.exponentialRampToValueAtTime(gain, at + dur * 0.14)
  env.gain.exponentialRampToValueAtTime(0.0001, at + dur)

  src.connect(filter).connect(env).connect(master)
  src.start(at)
  src.stop(at + dur + 0.03)
}

function tone(at, { freq, dur = 0.18, type = 'triangle', gain = 0.18, glideTo = null }) {
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freq, at)
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, at + dur)

  const env = ctx.createGain()
  env.gain.setValueAtTime(0.0001, at)
  env.gain.exponentialRampToValueAtTime(gain, at + 0.012)
  env.gain.exponentialRampToValueAtTime(0.0001, at + dur)

  osc.connect(env).connect(master)
  osc.start(at)
  osc.stop(at + dur + 0.03)
}

/** One clay chip landing on another — a short metallic tick. */
function chipTick(at, spread = 0) {
  tone(at, { freq: 2350 + spread, dur: 0.07, type: 'triangle', gain: 0.09 })
  tone(at, { freq: 3550 + spread * 1.6, dur: 0.045, type: 'sine', gain: 0.05 })
  noiseHit(at, { dur: 0.05, from: 3200, to: 6500, q: 2.2, gain: 0.07 })
}

/** A card sliding across felt. */
function cardSlide(at, { gain = 0.2 } = {}) {
  noiseHit(at, { dur: 0.13, from: 700 + Math.random() * 300, to: 2800, q: 0.9, gain })
}

function run(fn) {
  if (muted) return
  if (!ensureContext()) return
  fn(ctx.currentTime)
}

/* ------------------------------------------------------------------ sounds */

export const sfx = {
  get muted() {
    return muted
  },

  setMuted(next) {
    muted = next
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
    } catch {
      /* private mode — the preference just won't persist */
    }
    if (master && ctx) {
      master.gain.setTargetAtTime(next ? 0 : MASTER_VOLUME, ctx.currentTime, 0.01)
    }
    return muted
  },

  toggle() {
    return this.setMuted(!muted)
  },

  /** Called from a real user gesture so the context is allowed to start. */
  unlock() {
    ensureContext()
  },

  card(delay = 0) {
    run((now) => cardSlide(now + delay))
  },

  /** `count` chips tumbling onto the pile. */
  chips(count = 3, delay = 0) {
    run((now) => {
      let at = now + delay
      for (let i = 0; i < count; i++) {
        chipTick(at, (Math.random() - 0.5) * 500)
        at += 0.028 + Math.random() * 0.03
      }
    })
  },

  /** Knuckles on the table — the universal "check". */
  knock(delay = 0) {
    run((now) => {
      const at = now + delay
      tone(at, { freq: 165, dur: 0.09, type: 'sine', gain: 0.22, glideTo: 90 })
      noiseHit(at, { dur: 0.07, from: 500, to: 160, q: 0.7, gain: 0.16, type: 'lowpass' })
      tone(at + 0.11, { freq: 155, dur: 0.08, type: 'sine', gain: 0.16, glideTo: 88 })
      noiseHit(at + 0.11, { dur: 0.06, from: 480, to: 160, q: 0.7, gain: 0.12, type: 'lowpass' })
    })
  },

  /** Cards pushed away, face down. */
  fold(delay = 0) {
    run((now) => {
      const at = now + delay
      noiseHit(at, { dur: 0.24, from: 1900, to: 420, q: 0.8, gain: 0.16 })
    })
  },

  allin(delay = 0) {
    run((now) => {
      const at = now + delay
      for (let i = 0; i < 10; i++) {
        chipTick(at + i * (0.018 + Math.random() * 0.022), (Math.random() - 0.5) * 700)
      }
      tone(at + 0.05, { freq: 220, dur: 0.5, type: 'sawtooth', gain: 0.07, glideTo: 440 })
    })
  },

  win(delay = 0) {
    run((now) => {
      const at = now + delay
      const notes = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6
      notes.forEach((freq, i) => {
        tone(at + i * 0.085, { freq, dur: 0.32, type: 'triangle', gain: 0.15 })
      })
    })
  },

  lose(delay = 0) {
    run((now) => {
      const at = now + delay
      tone(at, { freq: 392, dur: 0.28, type: 'triangle', gain: 0.12 })
      tone(at + 0.14, { freq: 311.13, dur: 0.42, type: 'triangle', gain: 0.12 })
    })
  },

  click(delay = 0) {
    run((now) => {
      const at = now + delay
      tone(at, { freq: 900, dur: 0.045, type: 'square', gain: 0.05 })
      noiseHit(at, { dur: 0.035, from: 2500, to: 5000, q: 2, gain: 0.05 })
    })
  },

  /**
   * Riffles, packet drops and slaps timed to match each shuffle animation.
   */
  shuffle(method = 'riffle') {
    run((now) => {
      const riffle = (at, count, span) => {
        for (let i = 0; i < count; i++) {
          const t = at + (i / count) * span
          noiseHit(t, {
            dur: 0.035,
            from: 1800 + Math.random() * 1200,
            to: 4200,
            q: 2.6,
            gain: 0.055,
          })
        }
      }
      const slap = (at, gain = 0.2) => {
        noiseHit(at, { dur: 0.1, from: 1400, to: 380, q: 0.9, gain })
        tone(at, { freq: 190, dur: 0.09, type: 'sine', gain: 0.1, glideTo: 110 })
      }

      switch (method) {
        case 'overhand':
          for (let p = 0; p < 5; p++) slap(now + p * 0.34 + 0.15, 0.17)
          for (let p = 0; p < 5; p++) slap(now + 1.2 + p * 0.24, 0.14)
          break
        case 'mash':
          riffle(now + 0.1, 26, 0.5)
          slap(now + 0.62)
          riffle(now + 1.15, 26, 0.5)
          slap(now + 1.67)
          break
        case 'strip':
          for (let p = 0; p < 5; p++) slap(now + 0.12 + p * 0.28, 0.19)
          for (let p = 0; p < 5; p++) slap(now + 1.24 + p * 0.28, 0.19)
          break
        case 'riffle':
        default:
          riffle(now + 0.12, 34, 0.42)
          slap(now + 0.6)
          riffle(now + 1.18, 34, 0.42)
          slap(now + 1.66)
          break
      }
    })
  },
}

// Any first gesture is enough to take the context out of "suspended".
if (typeof window !== 'undefined') {
  const unlock = () => sfx.unlock()
  window.addEventListener('pointerdown', unlock, { once: true })
  window.addEventListener('keydown', unlock, { once: true })
}
