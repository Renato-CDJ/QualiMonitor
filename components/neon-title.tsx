"use client"

/**
 * Título animado em SVG com efeito "neon" azul:
 * - glow (feDropShadow) em tons de azul
 * - brilho deslizante (sweep) cruzando o texto
 * - barra inferior com gradiente que "respira" (barStretch)
 * - ícone de headset elevado após a letra "r" final, com glow azul pulsante
 *
 * Inspirado no título animado de scriptv2.vercel.app, adaptado para "QualiMonitor".
 */
export function NeonTitle({ text = "QualiMonitor" }: { text?: string }) {
  return (
    <svg
      viewBox="0 -40 920 210"
      className="h-auto w-full max-w-[680px] overflow-visible"
      role="img"
      aria-label={text}
    >
      <defs>
        <filter id="qm-blueFX" x="-15%" y="-30%" width="130%" height="160%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="rgba(14,165,233,0.5)" />
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(56,189,248,0.35)" />
        </filter>

        <filter id="qm-headsetGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="rgba(56,189,248,0.9)" />
          <feDropShadow dx="0" dy="0" stdDeviation="9" floodColor="rgba(14,165,233,0.6)" />
        </filter>

        <mask id="qm-shineMask">
          <rect x="0" y="-40" width="920" height="210" fill="white" />
          <rect
            x="-220"
            y="-40"
            width="180"
            height="210"
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
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0" />
          <stop offset="25%" stopColor="#0ea5e9" stopOpacity="1" />
          <stop offset="50%" stopColor="#bae6fd" stopOpacity="1" />
          <stop offset="75%" stopColor="#0ea5e9" stopOpacity="1" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
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

      {/* Texto azul com glow + máscara de brilho deslizante */}
      <g mask="url(#qm-shineMask)">
        <text
          x="460"
          y="100"
          textAnchor="middle"
          fontSize="105"
          fontWeight="800"
          fontFamily="'Arial Black', 'Helvetica Neue', sans-serif"
          letterSpacing="-2"
          fill="#0ea5e9"
          filter="url(#qm-blueFX)"
        >
          {text}
        </text>
      </g>

      {/* Imagem real do headset (a mesma da caixa de login), elevada e deslocada para o lado direito */}
      <g
        filter="url(#qm-headsetGlow)"
        style={{ animation: "qm-headsetFloat 3s ease-in-out 0s infinite", transformOrigin: "865px 5px" }}
      >
        <image
          href="/images/headphone-icon.png"
          x="805"
          y="-55"
          width="120"
          height="120"
          preserveAspectRatio="xMidYMid meet"
        />
      </g>

      {/* Barra inferior animada */}
      <g
        filter="url(#qm-barGlow)"
        style={{ animation: "qm-barStretch 2.8s ease-in-out 0s infinite", transformOrigin: "460px 125px" }}
      >
        <line x1="120" y1="125" x2="800" y2="125" stroke="url(#qm-barLineGrad)" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="460" cy="125" rx="110" ry="1.5" fill="#bae6fd" opacity="0.9" />
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
        @keyframes qm-headsetFloat {
          0%   { transform: translateY(0) scale(1);     opacity: 0.85; }
          50%  { transform: translateY(-6px) scale(1.05); opacity: 1;  }
          100% { transform: translateY(0) scale(1);     opacity: 0.85; }
        }
      `}</style>
    </svg>
  )
}
