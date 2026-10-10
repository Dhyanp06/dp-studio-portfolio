export const KEY_SPARKS = 6;

/**
 * The copper key and its sparkle trail. Purely decorative and animated by
 * BookOpeningScene's unlock timeline (they sit hidden until then).
 */
export default function AnimatedKey() {
  return (
    <>
      {Array.from({ length: KEY_SPARKS }, (_, i) => (
        <span key={i} className="key-spark" aria-hidden="true" />
      ))}
      <div className="key" aria-hidden="true">
        <svg viewBox="0 0 120 36" focusable="false">
          <defs>
            <linearGradient id="key-metal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F6C27A" />
              <stop offset="0.5" stopColor="#F28C28" />
              <stop offset="1" stopColor="#B45D1B" />
            </linearGradient>
          </defs>
          {/* shaft + teeth (tip at the left, x≈3) */}
          <rect x="3" y="15" width="78" height="6.5" rx="3" fill="url(#key-metal)" />
          <rect x="6" y="21" width="5" height="8" rx="1.5" fill="url(#key-metal)" />
          <rect x="15" y="21" width="5" height="5" rx="1.5" fill="url(#key-metal)" />
          {/* bow */}
          <circle cx="101" cy="18" r="15" fill="none" stroke="url(#key-metal)" strokeWidth="6" />
          <circle cx="101" cy="18" r="4" fill="#B45D1B" fillOpacity="0.35" />
        </svg>
      </div>
    </>
  );
}
