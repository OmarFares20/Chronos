// Chronos Mascot — pure SVG, faithful to the original silver silhouette.
// Props: holding a calendar in left hand, hourglass in right hand.

interface Props {
  size?: number;
  animated?: boolean;
  className?: string;
}

export default function ChronosMascot({ size = 120, animated = false, className = "" }: Props) {
  const floatStyle = animated
    ? { animation: "floatY 4s ease-in-out infinite" }
    : {};

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={floatStyle}
      aria-label="Chronos mascot — god of time"
      role="img"
    >
      <defs>
        {/* Silver gradient */}
        <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="40%" stopColor="#c8cad4" />
          <stop offset="100%" stopColor="#7a7c88" />
        </linearGradient>

        {/* Gold gradient for hourglass */}
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8d5a0" />
          <stop offset="50%" stopColor="#c4a452" />
          <stop offset="100%" stopColor="#8a6f2e" />
        </linearGradient>

        {/* Soft glow filter */}
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Halo glow */}
        <radialGradient id="haloGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e8d5a0" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#c4a452" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Halo */}
      <ellipse cx="100" cy="34" rx="22" ry="10" fill="url(#haloGrad)" />
      {/* Halo ring rays */}
      {[0,30,60,90,120,150,210,240,270,300,330].map((deg) => (
        <line
          key={deg}
          x1={100 + 16 * Math.cos((deg * Math.PI) / 180)}
          y1={34  + 7  * Math.sin((deg * Math.PI) / 180)}
          x2={100 + 22 * Math.cos((deg * Math.PI) / 180)}
          y2={34  + 10 * Math.sin((deg * Math.PI) / 180)}
          stroke="url(#goldGrad)"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.7"
        />
      ))}

      {/* Head */}
      <ellipse cx="100" cy="44" rx="13" ry="14" fill="url(#silverGrad)" />

      {/* Torso / Robes — flowing shape */}
      <path
        d="M82 58 Q76 70 70 100 Q65 125 68 160 Q70 175 100 178 Q130 175 132 160 Q135 125 130 100 Q124 70 118 58 Q110 54 100 54 Q90 54 82 58 Z"
        fill="url(#silverGrad)"
        filter="url(#glow)"
      />

      {/* Robe folds (left) */}
      <path d="M88 58 Q80 80 75 120 Q78 130 84 120 Q88 88 92 62 Z" fill="rgba(255,255,255,0.12)" />
      {/* Robe folds (center) */}
      <path d="M97 54 Q94 90 93 150 Q97 158 100 150 Q103 90 103 54 Z" fill="rgba(255,255,255,0.08)" />
      {/* Robe folds (right) */}
      <path d="M112 58 Q120 80 125 120 Q122 130 116 120 Q112 88 108 62 Z" fill="rgba(255,255,255,0.10)" />

      {/* Left arm */}
      <path
        d="M82 68 Q68 72 52 76 Q46 78 44 84"
        stroke="url(#silverGrad)" strokeWidth="10" strokeLinecap="round" fill="none"
      />
      {/* Left hand */}
      <circle cx="43" cy="87" r="6" fill="url(#silverGrad)" />

      {/* Right arm */}
      <path
        d="M118 68 Q132 72 148 76 Q154 78 156 84"
        stroke="url(#silverGrad)" strokeWidth="10" strokeLinecap="round" fill="none"
      />
      {/* Right hand */}
      <circle cx="157" cy="87" r="6" fill="url(#silverGrad)" />

      {/* ── Left prop: Calendar ───────────── */}
      <g transform="translate(22, 68)">
        {/* Calendar body */}
        <rect x="0" y="4" width="36" height="32" rx="4" fill="url(#silverGrad)" opacity="0.9" />
        {/* Calendar top bar */}
        <rect x="0" y="4" width="36" height="9" rx="4" fill="url(#silverGrad)" />
        {/* Rings */}
        <rect x="9" y="0" width="4" height="8" rx="2" fill="url(#goldGrad)" />
        <rect x="23" y="0" width="4" height="8" rx="2" fill="url(#goldGrad)" />
        {/* Grid lines */}
        <line x1="6" y1="20" x2="30" y2="20" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
        <line x1="6" y1="26" x2="30" y2="26" strokeDasharray="2,2" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        <line x1="6" y1="32" x2="22" y2="32" strokeDasharray="2,2" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        {/* Calendar dots */}
        {[8,15,22,29].map((x) => (
          <circle key={x} cx={x} cy={17} r="1.5" fill="rgba(255,255,255,0.5)" />
        ))}
      </g>

      {/* ── Right prop: Hourglass ─────────── */}
      <g transform="translate(138, 65)">
        {/* Top cap */}
        <rect x="2" y="0" width="28" height="5" rx="2.5" fill="url(#goldGrad)" />
        {/* Bottom cap */}
        <rect x="2" y="38" width="28" height="5" rx="2.5" fill="url(#goldGrad)" />
        {/* Top bulb */}
        <path d="M4 5 Q16 18 16 21 Q4 24 4 37 L28 37 Q28 24 16 21 Q16 18 28 5 Z" fill="url(#silverGrad)" opacity="0.85" />
        {/* Sand (top half) */}
        <path d="M8 5 Q16 15 16 21 L10 21 Q10 14 8 5 Z" fill="url(#goldGrad)" opacity="0.5" />
        {/* Sand (bottom half — settled) */}
        <path d="M6 32 Q16 24 26 32 L28 37 L4 37 Z" fill="url(#goldGrad)" opacity="0.7" />
        {/* Thin waist accent */}
        <line x1="10" y1="21" x2="22" y2="21" stroke="url(#goldGrad)" strokeWidth="1.5" opacity="0.6" />
      </g>

      {/* Robe hem / base */}
      <ellipse cx="100" cy="178" rx="32" ry="8" fill="url(#silverGrad)" opacity="0.4" />
    </svg>
  );
}
