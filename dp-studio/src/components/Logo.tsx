import logoUrl from '../assets/logo/logo.svg';

interface Props {
  height?: number | string;
  className?: string;
}

/** Renders the DP Studio logo at its natural aspect ratio (never stretched). */
export default function Logo({ height = 48, className = '' }: Props) {
  return (
    <img
      className={`dp-logo ${className}`.trim()}
      src={logoUrl}
      alt="DP Studio logo"
      style={{ height, width: 'auto' }}
      draggable={false}
    />
  );
}
