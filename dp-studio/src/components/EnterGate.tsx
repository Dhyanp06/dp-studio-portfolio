import { useEffect, useRef } from 'react';
import Logo from './Logo';
import { sound } from '../audio/sound';

interface Props {
  onEnter: () => void;
}

/**
 * Browsers block audio until the visitor interacts, so this one click is what
 * lets the robot's footsteps, the unlock sound and the music play in sync.
 */
export default function EnterGate({ onEnter }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => ref.current?.focus({ preventScroll: true }), []);

  return (
    <div className="loader gate">
      <Logo height={64} />
      <h1 className="gate-title">DP STUDIO</h1>
      <p className="gate-sub">A story best experienced with sound.</p>
      <button
        ref={ref}
        type="button"
        className="btn btn-primary"
        onClick={() => {
          sound.setMuted(false);
          onEnter();
        }}
      >
        ENTER WITH SOUND
      </button>
      <button
        type="button"
        className="gate-skip"
        onClick={() => {
          sound.setMuted(true);
          onEnter();
        }}
      >
        Continue without sound
      </button>
    </div>
  );
}
