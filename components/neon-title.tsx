"use client"

/**
 * Título animado em SVG com efeito "neon" laranja:
 * - glow (feDropShadow) nas cores quentes
 * - brilho deslizante (sweep) cruzando o texto
 * - barra inferior com gradiente que "respira" (barStretch)
 *
 * Inspirado no título animado de scriptv2.vercel.app, adaptado para "QualiMonitor".
 */
export function NeonTitle({ text = "QualiMonitor" }: { text?: string }) {
  return (
    <svg
      viewBox="0 -30 920 200"
      className="h-auto w-full max-w-[680px] overflow-visible"
      role="img"
      aria-label={text}
    >
      <defs>
        <filter id="qm-orangeFX" x="-15%" y="-30%" width="130%" height="160%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="rgba(255,87,34,0.5)" />
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(255,140,0,0.3)" />
        </filter>

        <mask id="qm-shineMask">
          <rect x="0" y="-30" width="920" height="200" fill="white" />
          <rect
            x="-220"
            y="-30"
            width="180"
            height="200"
            fill="url(#qm-shineHighlight)"
            style={{ animation: "qm-sweep 4.5s linear 0s infinite" }}
          />
        </mask>

        <linearGradient id="qm-shineHighlight" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="black" stopOpacity="0" />
          <stop offset="0.4" stopColor="white" stopOpacity="0.7" />
          <stop offset="0.55" stopColor="white" stopOpacity="1" />
          <stop offset="1" stopColor="black" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="qm-barLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff6600" stopOpacity="0" />
          <stop offset="25%" stopColor="#ff6600" stopOpacity="1" />
          <stop offset="50%" stopColor="#ffcc88" stopOpacity="1" />
          <stop offset="75%" stopColor="#ff6600" stopOpacity="1" />
          <stop offset="100%" stopColor="#ff6600" stopOpacity="0" />
        </linearGradient>

        <filter id="qm-barGlow" x="-20%" y="-200%" width="140%" height="500%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Sombra base do texto */}
      <text
        x="460"
        y="100"
        textAnchor="middle"
        fontSize="105"
        fontWeight="800"
        fontFamily="'Arial Black', 'Helvetica Neue', sans-serif"
        letterSpacing="-2"
        fill="rgba(0,0,0,0.3)"
        transform="translate(2, 4)"
      >
        {text}
      </text>

      {/* Texto laranja com glow + máscara de brilho deslizante */}
      <g mask="url(#qm-shineMask)">
        <text
          x="460"
          y="100"
          textAnchor="middle"
          fontSize="105"
          fontWeight="800"
          fontFamily="'Arial Black', 'Helvetica Neue', sans-serif"
          letterSpacing="-2"
          fill="#ff6600"
          filter="url(#qm-orangeFX)"
        >
          {text}
        </text>
      </g>

      {/* Barra inferior animada */}
      <g
        filter="url(#qm-barGlow)"
        style={{ animation: "qm-barStretch 2.8s ease-in-out 0s infinite", transformOrigin: "460px 125px" }}
      >
        <line x1="120" y1="125" x2="800" y2="125" stroke="url(#qm-barLineGrad)" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="460" cy="125" rx="110" ry="1.5" fill="#ffcc88" opacity="0.9" />
      </g>

      <style>{`
        @keyframes qm-sweep {
          0%   { transform: translateX(-220px) skewX(-18deg); }
          100% { transform: translateX(1100px) skewX(-18deg); }
        }
        @keyframes qm-barStretch {
          0%   { transform: scaleX(0.45); opacity: 0.6; }
          50%  { transform: scaleX(1);    opacity: 1;   }
          100% { transform: scaleX(0.45); opacity: 0.6; }
        }
      `}</style>
    </svg>
  )
}
