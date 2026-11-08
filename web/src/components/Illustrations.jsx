// Ilustraciones decorativas en SVG (dibujadas para este proyecto, sin fotos externas).
// Son solo decoración: aria-hidden para que los lectores de pantalla las ignoren.

export function StethoscopeArt({ className }) {
  return (
    <svg className={className} viewBox="0 0 420 460" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="st-metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4f4f5" />
          <stop offset="0.45" stopColor="#c9cbd0" />
          <stop offset="1" stopColor="#8e9198" />
        </linearGradient>
        <linearGradient id="st-tube" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6b6e75" />
          <stop offset="0.5" stopColor="#9a9da4" />
          <stop offset="1" stopColor="#5d6067" />
        </linearGradient>
        <radialGradient id="st-face" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#e6e7ea" />
          <stop offset="1" stopColor="#b9bcc2" />
        </radialGradient>
        <filter id="st-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>

      {/* sombra bajo la campana */}
      <ellipse cx="318" cy="402" rx="88" ry="16" fill="#2f3237" opacity="0.14" filter="url(#st-blur)" />

      {/* olivas (auriculares) */}
      <circle cx="122" cy="34" r="12" fill="url(#st-metal)" />
      <circle cx="214" cy="34" r="12" fill="url(#st-metal)" />

      {/* tubos de los oídos que se unen en Y */}
      <path d="M122 44 C 108 110, 128 160, 168 196" fill="none" stroke="url(#st-metal)" strokeWidth="9" strokeLinecap="round" />
      <path d="M214 44 C 226 110, 206 160, 168 196" fill="none" stroke="url(#st-metal)" strokeWidth="9" strokeLinecap="round" />

      {/* manguera principal */}
      <path
        d="M168 196 C 166 270, 112 330, 150 382 C 186 430, 262 420, 290 372"
        fill="none"
        stroke="url(#st-tube)"
        strokeWidth="16"
        strokeLinecap="round"
      />

      {/* campana */}
      <circle cx="318" cy="340" r="60" fill="url(#st-metal)" />
      <circle cx="318" cy="340" r="46" fill="url(#st-face)" />
      <circle cx="318" cy="340" r="46" fill="none" stroke="#ff6600" strokeWidth="7" />
      <circle cx="304" cy="324" r="10" fill="#ffffff" opacity="0.8" />
    </svg>
  )
}

export function LeavesArt({ className }) {
  const leaf = 'M0 0 C 26 -30, 78 -30, 104 0 C 78 30, 26 30, 0 0 Z'
  return (
    <svg className={className} viewBox="0 0 260 260" aria-hidden="true" focusable="false">
      <path d="M20 240 C 80 170, 140 110, 230 30" fill="none" stroke="#d9d5cf" strokeWidth="3" strokeLinecap="round" />
      <path d={leaf} transform="translate(60 196) rotate(-80)" fill="#e7e3dd" />
      <path d={leaf} transform="translate(70 186) rotate(-10)" fill="#ece8e2" />
      <path d={leaf} transform="translate(118 140) rotate(-95)" fill="#e7e3dd" />
      <path d={leaf} transform="translate(128 130) rotate(-20)" fill="#ece8e2" />
      <path d={leaf} transform="translate(176 84) rotate(-100)" fill="#e7e3dd" />
      <path d={leaf} transform="translate(186 74) rotate(-30)" fill="#ece8e2" />
    </svg>
  )
}

export function WavesArt({ className }) {
  return (
    <svg className={className} viewBox="0 0 1200 260" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0 150 C 200 90, 380 210, 600 150 C 820 90, 1000 200, 1200 140 L1200 260 L0 260 Z" fill="#ff6600" opacity="0.07" />
      <path d="M0 190 C 240 130, 420 240, 640 190 C 860 140, 1020 230, 1200 180 L1200 260 L0 260 Z" fill="#c2410c" opacity="0.08" />
      <path d="M0 225 C 220 185, 460 260, 700 220 C 900 188, 1060 250, 1200 215 L1200 260 L0 260 Z" fill="#5f636b" opacity="0.07" />
    </svg>
  )
}
