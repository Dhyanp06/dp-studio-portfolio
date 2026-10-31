import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { sound } from '../audio/sound';

interface Props {
  onClose: () => void;
  /** The passcode was verified by the server — run the unlock animation. */
  onVerified: () => void;
}

type Step = 'email' | 'code';
interface ApiResult {
  ok: boolean;
  status: number;
  data: Record<string, unknown>;
  unreachable: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function once(path: string, body?: unknown): Promise<ApiResult> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(path, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    let data: Record<string, unknown> = {};
    try {
      data = await res.json();
    } catch {
      /* non-JSON response */
    }
    // The dev proxy answers 500/502 with no JSON body when the server isn't running.
    return { ok: res.ok, status: res.status, data, unreachable: !res.ok && typeof data.error !== 'string' };
  } catch {
    return { ok: false, status: 0, data: {}, unreachable: true };
  } finally {
    window.clearTimeout(timer);
  }
}

// In development, if the Vite proxy can't reach the server, talk to the server directly.
const DIRECT = import.meta.env.DEV ? `${window.location.protocol}//${window.location.hostname}:8787` : null;

async function call(path: string, body?: unknown): Promise<ApiResult> {
  const first = await once(path, body);
  if (first.unreachable && DIRECT) {
    const second = await once(DIRECT + path, body);
    if (!second.unreachable) return second;
  }
  return first;
}

export default function PasscodeModal({ onClose, onVerified }: Props) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [devMode, setDevMode] = useState(false);
  // Hosts without server memory (Vercel) hand back a signed token that must be sent with the code.
  const [token, setToken] = useState<string | null>(null);
  const [logVisitors, setLogVisitors] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // honest privacy note: ask the server whether it keeps a visitor log
  useEffect(() => {
    void call('/api/config').then((r) => {
      if (alive.current && r.ok) setLogVisitors(r.data.logVisitors === true);
    });
  }, []);

  // restore focus to whatever opened the dialog
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    return () => previous?.focus?.();
  }, []);

  useEffect(() => {
    (step === 'email' ? emailRef : codeRef).current?.focus();
  }, [step]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // keep Tab inside the dialog
  const trapTab = (e: ReactKeyboardEvent) => {
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const items = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href]'),
    );
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const unreachableMessage = import.meta.env.DEV
    ? "I can't reach the passcode server. Start it with: npm run dev:all"
    : "I can't reach the server right now. Please try again in a moment.";

  const describe = (r: ApiResult): string => {
    if (r.unreachable) return unreachableMessage;
    const err = r.data.error;
    switch (err) {
      case 'invalid_email':
        return 'Please enter a valid email address.';
      case 'rate_limited':
        return 'Too many attempts. Please try again in a few minutes.';
      case 'send_failed':
        return "I couldn't send the email just now. Please check the address and try again.";
      case 'wrong_code': {
        const left = Number(r.data.attemptsLeft) || 0;
        return `That passcode isn't right. ${left} ${left === 1 ? 'try' : 'tries'} left.`;
      }
      case 'expired':
        return 'That passcode has expired. Please request a new one.';
      case 'too_many_attempts':
        return 'Too many wrong attempts. Please request a new passcode.';
      case 'not_configured':
        return 'The email passcode is not set up on this site yet. Please try again later.';
      case 'invalid_input':
        return 'Please enter the 6-digit passcode from your email.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  const requestCode = async (e?: FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean) || clean.length > 254) {
      setError('Please enter a valid email address.');
      emailRef.current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    const r = await call('/api/request-code', { email: clean });
    if (!alive.current) return;
    setBusy(false);
    if (r.ok) {
      setEmail(clean);
      setCode('');
      setCooldown(Number(r.data.retryAfter) || 60);
      setDevMode(r.data.devMode === true);
      setToken(typeof r.data.token === 'string' ? r.data.token : null);
      setStep('code');
    } else if (r.data.error === 'cooldown') {
      // a code was just sent to this address — carry on to the code step
      setEmail(clean);
      setCooldown(Number(r.data.retryAfter) || 60);
      setStep('code');
      setError('A passcode was already sent a moment ago — please check your inbox.');
    } else {
      setError(describe(r));
    }
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!/^\d{6}$/.test(code)) {
      setError('Please enter the 6-digit passcode from your email.');
      codeRef.current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    const r = await call('/api/verify-code', { email, code, ...(token ? { token } : {}) });
    if (!alive.current) return;
    setBusy(false);
    if (r.ok && r.data.ok === true) {
      sound.play('success');
      onVerified();
      return;
    }
    const message = describe(r);
    if (r.data.error === 'expired' || r.data.error === 'too_many_attempts') {
      setStep('email');
      setCode('');
    } else {
      setCode('');
      codeRef.current?.focus();
    }
    setError(message);
  };

  const consent = logVisitors
    ? 'Your email is used to send this one-time passcode and is saved so I can see who has viewed my portfolio. It is never shared or sold.'
    : 'Your email is used only to send this one-time passcode and is not saved afterwards.';

  return createPortal(
    <div className="overview-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        className="overview pass-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pass-title"
        aria-describedby="pass-desc"
        onKeyDown={trapTab}
      >
        <button type="button" className="icon-btn overview-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <p className="eyebrow">A STORY WAITING TO BE UNLOCKED</p>
        <h2 id="pass-title" className="page-h2">
          {step === 'email' ? 'Get your passcode' : 'Check your inbox'}
        </h2>

        {step === 'email' ? (
          <form className="pass-form" onSubmit={requestCode} noValidate>
            <p id="pass-desc" className="page-p">
              Enter your email and I&apos;ll send you a one-time passcode to unlock the book.
            </p>
            <label className="field-label" htmlFor="pass-email">
              Your email address
            </label>
            <input
              ref={emailRef}
              id="pass-email"
              className={`field-input${error ? ' is-invalid' : ''}`}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              maxLength={254}
              value={email}
              disabled={busy}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby="pass-error pass-consent"
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
            />
            <p id="pass-error" className="field-error" role="alert">
              {error ?? ''}
            </p>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'SENDING…' : 'SEND PASSCODE'}
            </button>
            <p id="pass-consent" className="field-note">
              {consent}
            </p>
          </form>
        ) : (
          <form className="pass-form" onSubmit={verify} noValidate>
            <p id="pass-desc" className="page-p">
              I sent a 6-digit passcode to <span className="pass-email">{email}</span>. It expires in 10 minutes.
            </p>
            {devMode && (
              <p className="pass-hint">Dev mode: no email server is set up, so the passcode is printed in the server terminal.</p>
            )}
            <label className="field-label" htmlFor="pass-code">
              Passcode
            </label>
            <input
              ref={codeRef}
              id="pass-code"
              className={`field-input pass-code${error ? ' is-invalid' : ''}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              placeholder="······"
              maxLength={6}
              value={code}
              disabled={busy}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby="pass-error"
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                if (error) setError(null);
              }}
            />
            <p id="pass-error" className="field-error" role="alert">
              {error ?? ''}
            </p>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'CHECKING…' : 'UNLOCK THE BOOK'}
            </button>
            <div className="pass-actions">
              <button
                type="button"
                className="text-btn"
                disabled={busy || cooldown > 0}
                onClick={() => void requestCode()}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend passcode'}
              </button>
              <button
                type="button"
                className="text-btn"
                disabled={busy}
                onClick={() => {
                  setStep('email');
                  setError(null);
                }}
              >
                Use a different email
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
