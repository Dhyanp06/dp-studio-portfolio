import { ImagePlus } from 'lucide-react';

interface Props {
  label: string;
  hint?: string;
  ratio?: string;
  compact?: boolean;
}

/** A clearly-labelled stand-in for a real design sample. */
export default function Placeholder({ label, hint = 'Add your image in src/assets/projects', ratio = '4 / 3', compact }: Props) {
  return (
    <div
      className={`placeholder${compact ? ' placeholder--compact' : ''}`}
      style={{ aspectRatio: ratio }}
      role="img"
      aria-label={`Placeholder: ${label}`}
    >
      <ImagePlus size={compact ? 18 : 26} strokeWidth={1.5} aria-hidden="true" />
      <span className="placeholder-label">{label}</span>
      {!compact && <span className="placeholder-hint">{hint}</span>}
    </div>
  );
}
