import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import RobotCharacter, { type RobotPose } from '../components/RobotCharacter';
import VisitorNameForm from '../components/VisitorNameForm';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { sound } from '../audio/sound';

interface Props {
  scene: 'intro' | 'name-form';
  /** The arrival animation finished and the form is ready. */
  onIntroDone: () => void;
  /** A valid name was submitted (state stores it). */
  onSubmitName: (name: string) => void;
  /** The exit animation finished — move on to the welcome scene. */
  onExited: () => void;
}

/** Scenes 1 + 2: robot arrival, greeting, and the compulsory name form. */
export default function IntroScene({ scene, onIntroDone, onSubmitName, onExited }: Props) {
  const root = useRef<HTMLElement>(null);
  const ctx = useRef<gsap.Context | null>(null);
  const submitted = useRef(false);
  const reduced = useReducedMotion();
  const [pose, setPose] = useState<RobotPose>('walking');
  const [submitting, setSubmitting] = useState(false);

  // Keep latest callbacks without re-running the timelines.
  const cb = useRef({ onIntroDone, onExited });
  cb.current = { onIntroDone, onExited };

  useLayoutEffect(() => {
    submitted.current = false;
    const R = reduced;
    ctx.current = gsap.context(() => {
      const robotW = root.current?.querySelector('.robot-wrap')?.clientWidth ?? 200;
      const startX = R ? 0 : window.innerWidth / 2 + robotW;

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.set('.robot-wrap', { x: startX, autoAlpha: 1 })
        .call(() => setPose('walking'))
        .call(() => sound.footsteps(R ? 0.5 : 2.3))
        // 1–2. enters from the right and walks to the centre
        .fromTo('.robot-wrap', { x: startX }, { x: 0, duration: R ? 0.5 : 2.3, ease: 'sine.out' })
        // 3. stops and looks at the viewer
        .call(() => {
          setPose('idle');
          sound.stopFootsteps();
        })
        .to({}, { duration: R ? 0.1 : 0.35 })
        // 4. waves, while HELLO reveals
        .call(() => {
          setPose('waving');
          sound.play('hello');
        })
        .fromTo(
          '.hello-title',
          { autoAlpha: 0, y: R ? 0 : 24 },
          { autoAlpha: 1, y: 0, duration: R ? 0.4 : 0.8 },
          '<',
        )
        .fromTo(
          '.hello-sub',
          { autoAlpha: 0, y: R ? 0 : 14 },
          { autoAlpha: 1, y: 0, duration: R ? 0.4 : 0.7 },
          '>-0.3',
        )
        // 5–7. the form card appears and unfolds in front of the robot
        .call(() => sound.play('paper'), undefined, '+=0.1')
        .fromTo(
          '.name-card',
          { autoAlpha: 0, rotateX: R ? 0 : -88, y: R ? 0 : 30, transformOrigin: '50% 0%', transformPerspective: 900 },
          { autoAlpha: 1, rotateX: 0, y: 0, duration: R ? 0.4 : 0.95, ease: 'power3.out' },
          '<',
        )
        .call(() => setPose('idle'))
        .call(() => cb.current.onIntroDone());
    }, root);

    return () => {
      sound.stopFootsteps();
      ctx.current?.revert();
      ctx.current = null;
    };
  }, [reduced]);

  const handleSubmit = useCallback(
    (name: string) => {
      if (submitted.current) return; // never run the exit twice
      submitted.current = true;
      setSubmitting(true);
      onSubmitName(name);

      const R = reduced;
      ctx.current?.add(() => {
        gsap.killTweensOf('.robot-wrap');
        const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
        // form folds into the robot's clipboard
        tl.call(() => sound.play('paper'), undefined, 0).to('.name-card', {
          scale: R ? 1 : 0.25,
          y: R ? 0 : -110,
          autoAlpha: 0,
          transformOrigin: '50% 0%',
          duration: R ? 0.3 : 0.65,
          ease: 'power2.in',
        })
          .call(() => {
            setPose('celebrate');
            sound.play('success');
          })
          .to({}, { duration: R ? 0.3 : 1.05 })
          // soft fade of the scene's content (the backdrop stays put)
          .to('.intro-content', { autoAlpha: 0, scale: R ? 1 : 1.03, duration: 0.6 })
          .call(() => cb.current.onExited());
      });
    },
    [onSubmitName, reduced],
  );

  // Make sure a stray key press can't submit before the form is active.
  useEffect(() => {
    if (scene === 'name-form') submitted.current = false;
  }, [scene]);

  return (
    <section ref={root} className="intro-scene" aria-labelledby="intro-hello">
      <div className="intro-content">
        <div className="intro-text">
          <h1 id="intro-hello" className="hello-title">
            HELLO.
          </h1>
          <p className="hello-sub">WELCOME TO MY CREATIVE WORLD.</p>
        </div>

        <div className="robot-stage">
          <div className="robot-wrap">
            <RobotCharacter pose={pose} reduced={reduced} />
          </div>
          <VisitorNameForm active={scene === 'name-form' && !submitting} onSubmit={handleSubmit} />
        </div>
      </div>
    </section>
  );
}
