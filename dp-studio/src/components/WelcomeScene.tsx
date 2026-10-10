import { Fragment, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { PROFILE } from '../data/profile';

interface Props {
  /** The visitor's name — rendered as plain text, never as HTML. */
  name: string;
  /** Called after the 5-second hold and the exit transition. */
  onDone: () => void;
}

/** Splits text into word → letter spans (React-rendered, so always escaped). */
function SplitText({ text, cls }: { text: string; cls: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <>
      {words.map((word, wi) => (
        <Fragment key={wi}>
          <span className={`word ${cls}`} aria-hidden="true">
            {Array.from(word).map((ch, ci) => (
              <span className="ch" key={ci}>
                {ch}
              </span>
            ))}
          </span>
          {wi < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </>
  );
}

export default function WelcomeScene({ name, onDone }: Props) {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useLayoutEffect(() => {
    const R = reduced;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // 1. gradient/backdrop is persistent — fade the composition in over it
      tl.fromTo(root.current, { opacity: 0 }, { opacity: 1, duration: 0.7 }, 0)
        .fromTo('.welcome-inner', { scale: R ? 1 : 1.04 }, { scale: 1, duration: 4.5, ease: 'power1.out' }, 0)
        // 2. WELCOME, letter by letter
        .fromTo(
          '.w-welcome .ch',
          { opacity: 0, y: R ? 0 : 44 },
          { opacity: 1, y: 0, duration: R ? 0.3 : 0.8, stagger: R ? 0.015 : 0.055 },
          0.3,
        )
        // 3. the visitor's name
        .fromTo(
          '.w-name .ch',
          { opacity: 0, y: R ? 0 : 44 },
          { opacity: 1, y: 0, duration: R ? 0.3 : 0.8, stagger: R ? 0.015 : 0.06 },
          '>-0.35',
        )
        // 4. journey line, internship title, company, dates, note
        .fromTo(
          '.welcome-reveal',
          { opacity: 0, y: R ? 0 : 16 },
          { opacity: 1, y: 0, duration: R ? 0.3 : 0.7, stagger: R ? 0.08 : 0.22 },
          '>-0.2',
        );

      // 5. soft copper light sweep across the headline
      if (!R) {
        tl.fromTo(
          '.sweep',
          { xPercent: -130, opacity: 1 },
          { xPercent: 460, duration: 1.5, ease: 'power2.inOut' },
          '>-0.9',
        ).set('.sweep', { opacity: 0 });
      }

      // 6. settled. The 5-second hold starts only now, after everything above has finished.
      tl.addLabel('revealed')
        .to({}, { duration: 5 })
        // soft fade + slight zoom + light sweep into the book scene
        .to('.exit-sweep', { xPercent: 420, duration: 1, ease: 'power2.inOut' }, '>')
        .to(
          '.welcome-inner',
          { opacity: 0, scale: R ? 1 : 1.06, duration: 0.9, ease: 'power2.in' },
          '<0.1',
        )
        .call(() => doneRef.current());
    }, root);

    return () => ctx.revert();
  }, [reduced]);

  const upper = name.toLocaleUpperCase();
  const nameScale = upper.length > 26 ? 0.5 : upper.length > 18 ? 0.64 : upper.length > 11 ? 0.8 : 1;

  return (
    <section ref={root} className="welcome" aria-labelledby="welcome-title">
      <div className="welcome-inner">
        <h1 id="welcome-title" className="welcome-title" aria-label={`Welcome, ${name}. To my 6-month journey.`}>
          <span className="welcome-line">
            <SplitText text="WELCOME," cls="w-welcome" />
          </span>
          <span className="welcome-line welcome-line--name" style={{ ['--name-scale' as string]: nameScale }}>
            <SplitText text={`${upper}.`} cls="w-name" />
          </span>
          <span className="sweep" aria-hidden="true" />
        </h1>

        <p className="welcome-journey welcome-reveal">TO MY 6-MONTH JOURNEY</p>
        <span className="welcome-rule welcome-reveal" aria-hidden="true" />
        <p className="welcome-role welcome-reveal">“{PROFILE.role}”</p>
        <p className="welcome-company welcome-reveal">{PROFILE.company}</p>
        <p className="welcome-dates welcome-reveal">{PROFILE.period}</p>
        <p className="welcome-note welcome-reveal">Six months of creativity, learning, challenges, and growth.</p>
      </div>
      <span className="exit-sweep" aria-hidden="true" />
    </section>
  );
}
