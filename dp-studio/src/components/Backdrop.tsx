import { memo } from 'react';

/** Fixed positions keep the sparkles deterministic (no random layout jumps). */
const SPARKLES = [
  { l: 8, t: 14, s: 7, d: 0, u: 5.2 },
  { l: 18, t: 72, s: 5, d: 1.2, u: 6.1 },
  { l: 27, t: 33, s: 4, d: 2.4, u: 4.8 },
  { l: 38, t: 86, s: 6, d: 0.6, u: 5.7 },
  { l: 47, t: 10, s: 5, d: 1.8, u: 6.4 },
  { l: 58, t: 62, s: 4, d: 3.1, u: 5.0 },
  { l: 66, t: 24, s: 7, d: 0.3, u: 5.9 },
  { l: 74, t: 80, s: 5, d: 2.0, u: 6.6 },
  { l: 83, t: 46, s: 6, d: 1.0, u: 5.3 },
  { l: 91, t: 18, s: 4, d: 2.8, u: 4.9 },
  { l: 94, t: 70, s: 6, d: 0.9, u: 6.0 },
  { l: 12, t: 50, s: 4, d: 3.4, u: 5.5 },
];

function BackdropBase() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="bd-gradient" />
      <div className="bd-rays" />
      <svg className="bd-curves" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" focusable="false">
        <defs>
          <linearGradient id="bd-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#F28C28" stopOpacity="0" />
            <stop offset="0.5" stopColor="#F28C28" stopOpacity="0.45" />
            <stop offset="1" stopColor="#F6C27A" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M-40 660 C 320 520, 620 820, 1000 620 S 1380 430, 1500 500" fill="none" stroke="url(#bd-line)" strokeWidth="1.2" />
        <path d="M-60 720 C 300 600, 640 880, 1020 690 S 1400 520, 1520 590" fill="none" stroke="url(#bd-line)" strokeWidth="0.8" />
        <path d="M-40 180 C 260 80, 520 300, 860 170 S 1260 40, 1500 140" fill="none" stroke="url(#bd-line)" strokeWidth="1" />
      </svg>
      <div className="bd-glow" />
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          className="sparkle"
          style={{
            left: `${s.l}%`,
            top: `${s.t}%`,
            width: s.s,
            height: s.s,
            animationDelay: `${s.d}s`,
            animationDuration: `${s.u}s`,
          }}
        />
      ))}
    </div>
  );
}

export default memo(BackdropBase);
