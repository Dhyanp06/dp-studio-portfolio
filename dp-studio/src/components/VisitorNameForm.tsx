import { useEffect, useRef, useState, type FormEvent } from 'react';
import gsap from 'gsap';
import { NAME_MAX, validateName } from '../hooks/useSceneController';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface Props {
  /** True only while the form may be used (name-form scene, not yet submitted). */
  active: boolean;
  onSubmit: (name: string) => void;
}

export default function VisitorNameForm({ active, onSubmit }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLFormElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    // Auto-focus on devices with a precise pointer only — on phones this
    // would pop the keyboard open before the visitor has seen the card.
    if (active && window.matchMedia('(pointer: fine)').matches) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [active]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!active) return;
    const result = validateName(value);
    if (!result.ok) {
      setError(result.message);
      inputRef.current?.focus();
      if (!reduced && cardRef.current) {
        gsap.fromTo(cardRef.current, { x: -9 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.35)' });
      }
      return;
    }
    setError(null);
    onSubmit(result.value);
  };

  return (
    <form ref={cardRef} className="name-card" onSubmit={handleSubmit} noValidate aria-labelledby="name-card-title">
      <div className="name-card-fold" aria-hidden="true" />
      <h2 id="name-card-title" className="name-card-title">
        BEFORE WE BEGIN...
      </h2>
      <p className="name-card-lead">“Let's make this journey a little more personal.”</p>

      <label className="field-label" htmlFor="visitor-name">
        What should I call you?
      </label>
      <input
        ref={inputRef}
        id="visitor-name"
        name="visitor-name"
        className={`field-input${error ? ' is-invalid' : ''}`}
        type="text"
        value={value}
        placeholder="Enter your name"
        maxLength={NAME_MAX}
        autoComplete="given-name"
        enterKeyHint="go"
        required
        aria-required="true"
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? 'name-error' : 'name-privacy'}
        disabled={!active}
        onChange={(e) => {
          setValue(e.target.value);
          if (error) setError(null);
        }}
      />
      <p id="name-error" className="field-error" role="alert" aria-live="polite">
        {error ?? ''}
      </p>

      <button type="submit" className="btn btn-primary" disabled={!active}>
        LET&apos;S BEGIN →
      </button>
      <p id="name-privacy" className="field-note">
        Your name stays in this browser tab — it is never sent anywhere.
      </p>
    </form>
  );
}
