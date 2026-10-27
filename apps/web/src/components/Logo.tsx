import React from 'react';

interface LogoProperties {
  size?: number;
  showWordmark?: boolean;
}

export const Logo: React.FC<LogoProperties> = ({ size = 36, showWordmark = true }) => {
  return (
    <div className="flex items-center gap-3">
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
      >
        <defs>
          <linearGradient id="logoEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="logoCyanGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
          <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
        </defs>

        <rect width="512" height="512" rx="128" fill="url(#logoBgGrad)" stroke="#1E293B" strokeWidth="12" />

        <g>
          <path
            d="M140 372 V250 C140 236 151 225 165 225 H185 C199 225 210 236 210 250 V372"
            fill="url(#logoEmeraldGrad)"
            opacity="0.85"
          />
          <path
            d="M226 372 V180 C226 166 237 155 251 155 H271 C285 155 296 166 296 180 V372"
            fill="url(#logoEmeraldGrad)"
          />
          <path
            d="M312 372 V120 C312 106 323 95 337 95 H357 C371 95 382 106 382 120 V372"
            fill="url(#logoCyanGrad)"
          />
        </g>

        <path
          d="M120 280 L220 190 L290 220 L395 105"
          stroke="#6EE7B7"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="355,105 395,105 395,145"
          stroke="#6EE7B7"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="395" cy="105" r="16" fill="#A7F3D0" />
      </svg>

      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-extrabold tracking-tight text-white">
              Yield<span className="text-emerald-400">IQ</span>
            </span>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-bold text-emerald-400">
              PRO
            </span>
          </div>
          <span className="text-[10px] font-medium tracking-wide text-slate-400 uppercase">
            Asset & Yield Intelligence
          </span>
        </div>
      )}
    </div>
  );
};
