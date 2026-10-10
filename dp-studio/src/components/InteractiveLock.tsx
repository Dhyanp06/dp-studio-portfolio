interface Props {
  onActivate: () => void;
  disabled: boolean;
}

/**
 * The copper lock on the book cover — a real <button>, so it is reachable by
 * keyboard (Tab, then Enter/Space), has a visible focus ring, and is announced
 * properly by screen readers.
 */
export default function InteractiveLock({ onActivate, disabled }: Props) {
  return (
    <div className="lock-slot">
      <button
        type="button"
        className="lock"
        onClick={onActivate}
        disabled={disabled}
        aria-label="Unlock the book — click the lock to begin"
      >
        <svg className="lock-svg" viewBox="0 0 80 104" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="lk-body" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#F6C27A" />
              <stop offset="0.45" stopColor="#F28C28" />
              <stop offset="1" stopColor="#B45D1B" />
            </linearGradient>
            <linearGradient id="lk-metal" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#8F5320" />
              <stop offset="0.45" stopColor="#F6C27A" />
              <stop offset="1" stopColor="#A95E1D" />
            </linearGradient>
            <linearGradient id="lk-shine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.5" stopColor="#fff" stopOpacity="0.75" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <clipPath id="lk-clip">
              <rect x="8" y="46" width="64" height="52" rx="13" />
            </clipPath>
          </defs>

          <g className="lock-shackle">
            <path
              d="M23 50 V32 a17 17 0 0 1 34 0 V50"
              fill="none"
              stroke="url(#lk-metal)"
              strokeWidth="9"
              strokeLinecap="round"
            />
          </g>

          <g className="lock-body">
            <rect x="8" y="46" width="64" height="52" rx="13" fill="url(#lk-body)" />
            <rect x="8" y="46" width="64" height="52" rx="13" fill="none" stroke="#7A4417" strokeOpacity="0.55" strokeWidth="1.5" />
            <rect x="13" y="51" width="54" height="8" rx="4" fill="#fff" fillOpacity="0.28" />
            <circle className="keyhole" cx="40" cy="70" r="6.5" fill="#171717" />
            <path d="M37 72 h6 l2.4 15 h-10.8 z" fill="#171717" />
            <g clipPath="url(#lk-clip)">
              <rect className="lock-shine" x="-30" y="40" width="22" height="64" fill="url(#lk-shine)" transform="skewX(-18)" />
            </g>
          </g>
        </svg>
      </button>
    </div>
  );
}
