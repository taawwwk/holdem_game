/**
 * Hwatu card faces drawn as inline SVG — one scene per month, plus a separate
 * bright (광) design for the 1, 3 and 8 cards. Vector rather than bitmap so the
 * deck scales cleanly, ships with no assets and stays inside a strict CSP.
 *
 * Every scene shares the same 60×90 canvas and the traditional palette: a
 * cream ground, black ink, deep red and gold.
 */

const P = {
  ink: '#1c1917',
  red: '#c0201f',
  deepRed: '#8f1513',
  gold: '#e0a92b',
  paleGold: '#f4d783',
  green: '#2f6b3a',
  darkGreen: '#1d4527',
  white: '#fdf9ef',
  grey: '#8a8175',
  purple: '#6d3f8e',
}

/* ------------------------------------------------------------ shared bits */

function Pine({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-1.5" y="0" width="3" height="14" fill="#5b3a1e" />
      <ellipse cx="-5" cy="-2" rx="7" ry="5" fill={P.darkGreen} />
      <ellipse cx="5" cy="-3" rx="7" ry="5" fill={P.green} />
      <ellipse cx="0" cy="-9" rx="8" ry="5.5" fill={P.darkGreen} />
    </g>
  )
}

function Blossom({ x, y, r = 4, fill = P.white, center = P.gold }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse
          key={a}
          cx="0"
          cy={-r * 0.72}
          rx={r * 0.42}
          ry={r * 0.62}
          fill={fill}
          transform={`rotate(${a})`}
        />
      ))}
      <circle r={r * 0.3} fill={center} />
    </g>
  )
}

function Ribbon({ y, fill = P.red, label }) {
  return (
    <g>
      <rect x="8" y={y} width="44" height="12" rx="2" fill={fill} />
      <rect x="8" y={y} width="44" height="12" rx="2" fill="none" stroke={P.ink} strokeWidth="0.7" />
      {label && (
        <text
          x="30"
          y={y + 8.6}
          textAnchor="middle"
          fontSize="7"
          fontWeight="700"
          fill={fill === P.red ? P.white : P.ink}
        >
          {label}
        </text>
      )}
    </g>
  )
}

function CloverLeaf({ x, y, fill, flip = false }) {
  return (
    <g transform={`translate(${x} ${y}) ${flip ? 'scale(-1 1)' : ''}`}>
      <path d="M0 0 C 6 -3, 11 -1, 13 3 C 8 6, 3 5, 0 0 Z" fill={fill} />
    </g>
  )
}

/** A goose in flight: body, beak and two swept wings. */
function Goose({ x, y, s = 1, fill = P.ink }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-1 0 q-5 -8 -13 -9 q5 4 6 9 q-3 2 -6 4" fill={fill} />
      <path d="M1 0 q5 -8 13 -9 q-5 4 -6 9 q3 2 6 4" fill={fill} />
      <ellipse rx="4.2" ry="2.6" fill={fill} />
      <path d="M3.4 -0.8 l4.6 -1.6 l-1.2 2.6 Z" fill={fill} />
    </g>
  )
}

/* --------------------------------------------------------------- 월별 도안 */

// 1월 송학 — 광: 소나무와 학, 붉은 해
function Jan({ gwang }) {
  if (gwang) {
    return (
      <g>
        <circle cx="42" cy="20" r="10" fill={P.red} />
        <Pine x="16" y="46" s={1.05} />
        {/* Crane: white body, black tail and neck, red crown. */}
        <g>
          <path d="M28 68 l3 9 M38 68 l2 9" stroke={P.ink} strokeWidth="1.3" strokeLinecap="round" />
          <ellipse cx="34" cy="62" rx="12" ry="7" fill={P.white} stroke={P.ink} strokeWidth="0.8" />
          <path d="M23 62 q-7 3 -10 8 q7 -1 11 -4 Z" fill={P.ink} />
          <path d="M32 57 q6 -14 12 -18" stroke={P.ink} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <circle cx="45" cy="38" r="3.4" fill={P.white} stroke={P.ink} strokeWidth="0.8" />
          <path d="M43 35.5 q2 -2.5 4 0 Z" fill={P.red} />
          <circle cx="46" cy="38" r="0.8" fill={P.ink} />
          <path d="M48 39 l6 1.5" stroke={P.gold} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M27 58 q9 -4 15 0" stroke={P.ink} strokeWidth="0.9" fill="none" />
        </g>
      </g>
    )
  }
  return (
    <g>
      <Pine x="20" y="40" s={1.1} />
      <Pine x="42" y="52" s={0.85} />
      <Ribbon y="64" fill={P.red} />
    </g>
  )
}

// 2월 매조 — 매화와 휘파람새
function Feb() {
  return (
    <g>
      <path
        d="M14 78 q4 -26 12 -36 q6 -8 16 -12"
        stroke="#5b3a1e"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M22 56 q10 -4 16 -12" stroke="#5b3a1e" strokeWidth="2" fill="none" />
      <Blossom x={41} y={29} r={5.5} fill="#f3c6d3" center={P.gold} />
      <Blossom x={26} y={42} r={4.5} fill={P.white} center={P.gold} />
      <Blossom x={45} y={45} r={4} fill="#f3c6d3" center={P.gold} />
      <g transform="translate(31 62)">
        <ellipse rx="9" ry="6" fill={P.green} />
        <circle cx="7" cy="-3.5" r="4" fill={P.darkGreen} />
        <circle cx="8.5" cy="-4" r="0.9" fill={P.white} />
        <path d="M11 -3.5 l4 1" stroke={P.gold} strokeWidth="1.3" strokeLinecap="round" />
        <path d="M-8 1 l-7 4" stroke={P.darkGreen} strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </g>
  )
}

// 3월 벚꽃 — 광: 만막(붉은 장막)이 걸린 벚나무
function Mar({ gwang }) {
  return (
    <g>
      <path d="M27 78 q2 -20 0 -30" stroke="#5b3a1e" strokeWidth="3.5" fill="none" />
      {gwang && (
        <g>
          <rect x="8" y="30" width="44" height="13" fill={P.deepRed} />
          <path
            d="M8 43 l7 6 l7 -6 l7 6 l7 -6 l7 6 l7 -6"
            fill={P.deepRed}
            stroke="none"
          />
          <rect x="8" y="30" width="44" height="4" fill={P.gold} opacity="0.55" />
        </g>
      )}
      <Blossom x={19} y={22} r={6} fill="#f7d3dd" center={P.gold} />
      <Blossom x={38} y={18} r={5.5} fill={P.white} center={P.gold} />
      <Blossom x={46} y={27} r={5} fill="#f7d3dd" center={P.gold} />
      <Blossom x={28} y={27} r={4.5} fill={P.white} center={P.gold} />
      {!gwang && (
        <>
          <Blossom x={16} y={45} r={6} fill="#f7d3dd" center={P.gold} />
          <Blossom x={44} y={49} r={5.5} fill={P.white} center={P.gold} />
          <Ribbon y="63" fill={P.red} />
        </>
      )}
    </g>
  )
}

// 4월 흑싸리 — 검은 싸리와 두견새
function Apr() {
  return (
    <g>
      <path d="M30 80 q-2 -30 2 -46" stroke={P.ink} strokeWidth="2.5" fill="none" />
      {[
        [30, 34],
        [30, 44],
        [30, 54],
        [30, 64],
      ].map(([x, y], i) => (
        <g key={i}>
          <CloverLeaf x={x} y={y} fill={P.ink} />
          <CloverLeaf x={x} y={y} fill={P.ink} flip />
        </g>
      ))}
      <g transform="translate(40 22)">
        <ellipse rx="8.5" ry="5.5" fill={P.grey} transform="rotate(-18)" />
        <circle cx="6.5" cy="-4" r="3.6" fill="#6f675c" />
        <circle cx="8" cy="-4.5" r="0.8" fill={P.white} />
        <path d="M10.5 -4 l4 1.5" stroke={P.gold} strokeWidth="1.2" strokeLinecap="round" />
        <path d="M-7 -2 l-6 -4" stroke={P.grey} strokeWidth="2.2" strokeLinecap="round" />
      </g>
    </g>
  )
}

// 5월 난초 — 붓꽃과 팔각다리
function May() {
  return (
    <g>
      <path
        d="M16 78 q6 -30 4 -44 M26 78 q2 -26 6 -40 M44 78 q-4 -24 -2 -36"
        stroke={P.green}
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
      <g transform="translate(34 30)">
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <ellipse
            key={a}
            cx="0"
            cy="-7"
            rx="3.4"
            ry="7"
            fill={a % 120 === 0 ? P.purple : '#8a5bb0'}
            transform={`rotate(${a})`}
          />
        ))}
        <circle r="2.4" fill={P.gold} />
      </g>
      <g>
        <rect x="6" y="58" width="48" height="4" rx="1" fill={P.deepRed} />
        <rect x="10" y="62" width="3.5" height="10" fill={P.deepRed} />
        <rect x="28" y="62" width="3.5" height="10" fill={P.deepRed} />
        <rect x="46" y="62" width="3.5" height="10" fill={P.deepRed} />
      </g>
    </g>
  )
}

// 6월 모란 — 모란과 나비
function Jun() {
  return (
    <g>
      <path d="M22 80 q4 -20 2 -30" stroke={P.darkGreen} strokeWidth="2.6" fill="none" />
      <ellipse cx="14" cy="58" rx="8" ry="5" fill={P.green} transform="rotate(-25 14 58)" />
      <ellipse cx="36" cy="64" rx="8" ry="5" fill={P.darkGreen} transform="rotate(20 36 64)" />
      <g transform="translate(26 34)">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <ellipse
            key={a}
            cx="0"
            cy="-9"
            rx="5"
            ry="8"
            fill={a % 90 === 0 ? P.red : P.deepRed}
            transform={`rotate(${a})`}
          />
        ))}
        <circle r="4" fill={P.gold} />
      </g>
      <g transform="translate(45 22)">
        <ellipse cx="-4" cy="-2" rx="5" ry="7" fill={P.purple} transform="rotate(-25)" />
        <ellipse cx="4" cy="-2" rx="5" ry="7" fill="#8a5bb0" transform="rotate(25)" />
        <rect x="-0.7" y="-6" width="1.4" height="10" rx="0.7" fill={P.ink} />
      </g>
    </g>
  )
}

// 7월 홍싸리 — 붉은 싸리와 멧돼지
function Jul() {
  return (
    <g>
      <path d="M20 76 q-2 -28 2 -42" stroke="#7a3a1a" strokeWidth="2.4" fill="none" />
      {[
        [20, 22],
        [20, 32],
        [20, 42],
      ].map(([x, y], i) => (
        <g key={i}>
          <CloverLeaf x={x} y={y} fill={P.red} />
          <CloverLeaf x={x} y={y} fill={P.deepRed} flip />
        </g>
      ))}
      <g transform="translate(31 58)">
        <path d="M-9 7 l-1 9 M-3 8 l0 9 M4 8 l0 9 M10 7 l1 9"
              stroke="#3a2e25" strokeWidth="2.6" strokeLinecap="round" />
        <ellipse rx="14" ry="8.5" fill="#4a3b30" />
        <path d="M-13 -5 q-4 -5 -7 -2 q3 1 5 4 Z" fill="#3a2e25" />
        <path d="M11 -5 q8 1 9 6 q-4 3 -9 1 Z" fill="#3a2e25" />
        <path d="M19 3 q3 -0.5 3.5 1.5" stroke={P.paleGold} strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <circle cx="14" cy="-3" r="1" fill={P.white} />
        <path d="M-6 -6 q6 -3 12 -1" stroke="#3a2e25" strokeWidth="1.6" fill="none" />
      </g>
    </g>
  )
}

// 8월 공산 — 광: 검은 산 위로 뜬 보름달
function Aug({ gwang }) {
  if (gwang) {
    return (
      <g>
        <circle cx="30" cy="26" r="13" fill={P.paleGold} stroke={P.gold} strokeWidth="1.2" />
        <path d="M2 78 q14 -30 28 -30 q14 0 28 30 Z" fill={P.ink} />
        <path d="M14 62 q10 -6 16 -6 q8 0 16 6" stroke="#3d3833" strokeWidth="1.4" fill="none" />
      </g>
    )
  }
  return (
    <g>
      <path d="M2 78 q14 -26 28 -26 q14 0 28 26 Z" fill="#2c2823" />
      <Goose x={17} y={28} s={0.95} />
      <Goose x={33} y={19} s={1.15} />
      <Goose x={45} y={33} s={0.85} />
    </g>
  )
}

// 9월 국화 — 국화와 술잔
function Sep() {
  return (
    <g>
      <path d="M30 78 q0 -18 0 -26" stroke={P.darkGreen} strokeWidth="2.6" fill="none" />
      <ellipse cx="17" cy="58" rx="7" ry="4.5" fill={P.green} transform="rotate(-25 17 58)" />
      <ellipse cx="43" cy="58" rx="7" ry="4.5" fill={P.darkGreen} transform="rotate(25 43 58)" />
      <g transform="translate(30 30)">
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => (
          <ellipse
            key={a}
            cx="0"
            cy="-10"
            rx="2.8"
            ry="7"
            fill={a % 60 === 0 ? P.gold : P.paleGold}
            transform={`rotate(${a})`}
          />
        ))}
        <circle r="3.6" fill="#b8860b" />
      </g>
      <g transform="translate(30 63)">
        <path d="M-10 -6 q10 12 20 0 Z" fill={P.deepRed} />
        <rect x="-11" y="-7.5" width="22" height="2.5" rx="1.2" fill={P.gold} />
        <rect x="-1.5" y="2" width="3" height="4" fill={P.deepRed} />
        <rect x="-6" y="5.5" width="12" height="2.2" rx="1" fill={P.deepRed} />
      </g>
    </g>
  )
}

// 10월 단풍 — 단풍과 사슴
function Oct() {
  const leaf = (x, y, s, fill) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d="M0 -7 l2.6 3.4 l3.6 -1.4 l-1.6 4 l4.4 1 l-3.6 2.6 l2 3.6 l-4.2 -1.2 l-0.6 4.2 l-2.6 -3.2 l-2.6 3.2 l-0.6 -4.2 l-4.2 1.2 l2 -3.6 l-3.6 -2.6 l4.4 -1 l-1.6 -4 l3.6 1.4 Z"
        fill={fill}
      />
      <rect x="-0.5" y="7" width="1" height="4" fill="#7a3a1a" />
    </g>
  )
  return (
    <g>
      <path d="M46 78 q-4 -22 -2 -34" stroke="#7a3a1a" strokeWidth="2.4" fill="none" />
      {leaf(44, 20, 1.1, P.red)}
      {leaf(31, 30, 0.9, P.gold)}
      {leaf(48, 38, 0.85, P.deepRed)}
      <g transform="translate(23 56)">
        <path d="M-8 6 l-1 10 M-2 7 l0 10 M5 7 l1 10"
              stroke="#8a5a2c" strokeWidth="2.4" strokeLinecap="round" />
        <ellipse rx="12" ry="7.5" fill="#a9713c" />
        <path d="M7 -5 q4 -4 5 -9" stroke="#a9713c" strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="12" cy="-15" r="3.2" fill="#a9713c" />
        <path d="M11 -18 q-2 -7 -7 -9 M14 -18 q2 -7 7 -9"
              stroke="#7a4a20" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M8 -22 q-4 -3 -8 -2 M17 -22 q4 -3 8 -2"
              stroke="#7a4a20" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <circle cx="13.5" cy="-15.5" r="0.9" fill={P.ink} />
        <ellipse cx="-4" cy="-1" rx="2.6" ry="1.7" fill={P.white} opacity="0.85" />
        <ellipse cx="2" cy="2" rx="2.2" ry="1.5" fill={P.white} opacity="0.85" />
      </g>
    </g>
  )
}

const SCENES = {
  1: Jan,
  2: Feb,
  3: Mar,
  4: Apr,
  5: May,
  6: Jun,
  7: Jul,
  8: Aug,
  9: Sep,
  10: Oct,
}

/** The painted face of one hwatu card, without its frame. */
export default function HwatuArt({ month, gwang = false }) {
  const Scene = SCENES[month]
  if (!Scene) return null
  return (
    <svg
      viewBox="0 0 60 90"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <rect width="60" height="90" fill={gwang ? '#fdf3d8' : P.white} />
      <Scene gwang={gwang} />
    </svg>
  )
}
