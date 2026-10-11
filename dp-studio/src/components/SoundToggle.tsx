import { Volume2, VolumeX } from 'lucide-react';
import { sound, useMuted } from '../audio/sound';

/** Always-available mute / unmute button (top-left). */
export default function SoundToggle() {
  const muted = useMuted();
  return (
    <button
      type="button"
      className="icon-btn sound-toggle"
      onClick={() => sound.setMuted(!muted)}
      aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
      aria-pressed={!muted}
      title={muted ? 'Sound off' : 'Sound on'}
    >
      {muted ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
    </button>
  );
}
