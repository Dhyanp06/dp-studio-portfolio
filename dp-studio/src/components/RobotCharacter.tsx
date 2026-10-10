import { memo, useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

export type RobotPose = 'walking' | 'idle' | 'waving' | 'celebrate';

interface Props {
  pose: RobotPose;
  reduced: boolean;
}

/**
 * The DP Studio robot, drawn as layered SVG primitives and animated with GSAP.
 * Swap this component (or its SVG) for your own asset later — the IntroScene
 * only needs the `pose` prop to be honoured.
 */
function RobotCharacterBase({ pose, reduced }: Props) {
  const ref = useRef<SVGSVGElement>(null);

  // Rotation pivots (SVG user units) — set once.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set('.rb-arm-l', { svgOrigin: '46 126' });
      gsap.set('.rb-arm-r', { svgOrigin: '154 126' });
      gsap.set('.rb-leg-l', { svgOrigin: '82 200' });
      gsap.set('.rb-leg-r', { svgOrigin: '118 200' });
      gsap.set('.rb-head', { svgOrigin: '100 104' });
    }, ref);
    return () => ctx.revert();
  }, []);

  // Blinking
  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.to('.rb-eye', {
        scaleY: 0.12,
        transformOrigin: '50% 50%',
        duration: 0.09,
        repeat: -1,
        yoyo: true,
        repeatDelay: 3.4,
        ease: 'power1.inOut',
      });
    }, ref);
    return () => ctx.kill();
  }, [reduced]);

  // Pose animations
  useEffect(() => {
    const k = reduced ? 0.45 : 1; // smaller amplitude for reduced motion
    const ctx = gsap.context(() => {
      const settle = { duration: 0.3, ease: 'power2.out', overwrite: 'auto' } as const;
      gsap.to(['.rb-arm-l', '.rb-arm-r', '.rb-leg-l', '.rb-leg-r'], { rotation: 0, ...settle });
      gsap.to('.rb-head', { rotation: 0, ...settle });
      gsap.to('.rb-bob', { y: 0, ...settle });
      gsap.to('.rb-eyes', { x: 0, scale: 1, transformOrigin: '50% 50%', ...settle });

      if (pose === 'walking') {
        gsap.to('.rb-eyes', { x: -4, duration: 0.3, overwrite: 'auto' });
        gsap.fromTo('.rb-leg-l', { rotation: 18 * k }, { rotation: -18 * k, duration: 0.34, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        gsap.fromTo('.rb-leg-r', { rotation: -18 * k }, { rotation: 18 * k, duration: 0.34, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        gsap.fromTo('.rb-arm-l', { rotation: -14 * k }, { rotation: 14 * k, duration: 0.34, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        gsap.fromTo('.rb-arm-r', { rotation: 14 * k }, { rotation: -14 * k, duration: 0.34, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        gsap.fromTo('.rb-bob', { y: 0 }, { y: -4 * k, duration: 0.17, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        gsap.to('.rb-head', { rotation: -3, duration: 0.3 });
      } else if (pose === 'idle') {
        gsap.to('.rb-bob', { y: -3 * k, duration: 1.4, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        gsap.to('.rb-head', { rotation: 4, duration: 0.5, ease: 'power2.out' });
      } else if (pose === 'waving') {
        gsap.to('.rb-bob', { y: -3 * k, duration: 1.2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        gsap.to('.rb-head', { rotation: -6, duration: 0.4, ease: 'power2.out' });
        const wave = gsap.timeline();
        wave
          .to('.rb-arm-r', { rotation: -150, duration: 0.4, ease: 'power2.out' })
          .to('.rb-arm-r', { rotation: -118, duration: 0.24, repeat: 5, yoyo: true, ease: 'sine.inOut' });
      } else if (pose === 'celebrate') {
        gsap.fromTo('.rb-bob', { y: 0 }, { y: -22 * k, duration: 0.24, repeat: 3, yoyo: true, ease: 'power2.out' });
        gsap.to('.rb-arm-r', { rotation: -165, duration: 0.3, ease: 'back.out(2)' });
        gsap.to('.rb-arm-l', { rotation: 165, duration: 0.3, ease: 'back.out(2)' });
        gsap.to('.rb-eyes', { scale: 1.25, transformOrigin: '50% 50%', duration: 0.25, ease: 'back.out(3)' });
        gsap.fromTo('.rb-antenna', { scale: 1 }, { scale: 1.9, transformOrigin: '50% 50%', duration: 0.2, repeat: 5, yoyo: true });
      }
    }, ref);
    return () => ctx.kill();
  }, [pose, reduced]);

  return (
    <svg ref={ref} className="robot" viewBox="0 0 200 296" role="img" aria-label="A friendly little robot">
      <defs>
        <radialGradient id="rb-pearl" cx="35%" cy="25%" r="90%">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.6" stopColor="#F5EFE9" />
          <stop offset="1" stopColor="#DCD1C5" />
        </radialGradient>
        <linearGradient id="rb-copper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F6C27A" />
          <stop offset="0.5" stopColor="#F28C28" />
          <stop offset="1" stopColor="#C66A24" />
        </linearGradient>
        <linearGradient id="rb-visor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2B2B2B" />
          <stop offset="1" stopColor="#141414" />
        </linearGradient>
        <filter id="rb-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <ellipse cx="100" cy="284" rx="54" ry="8" fill="rgba(140,80,20,0.2)" />

      <g className="rb-bob">
        {/* legs */}
        <g className="rb-leg-l">
          <rect x="72" y="198" width="20" height="60" rx="10" fill="url(#rb-pearl)" stroke="#E4D9CD" />
          <rect x="72" y="226" width="20" height="6" fill="#171717" opacity="0.85" />
          <ellipse cx="80" cy="266" rx="19" ry="10" fill="#171717" />
          <rect x="64" y="262" width="32" height="3" rx="1.5" fill="url(#rb-copper)" />
        </g>
        <g className="rb-leg-r">
          <rect x="108" y="198" width="20" height="60" rx="10" fill="url(#rb-pearl)" stroke="#E4D9CD" />
          <rect x="108" y="226" width="20" height="6" fill="#171717" opacity="0.85" />
          <ellipse cx="120" cy="266" rx="19" ry="10" fill="#171717" />
          <rect x="104" y="262" width="32" height="3" rx="1.5" fill="url(#rb-copper)" />
        </g>

        {/* arms */}
        <g className="rb-arm-l">
          <rect x="38" y="122" width="16" height="64" rx="8" fill="url(#rb-pearl)" stroke="#E4D9CD" />
          <rect x="38" y="150" width="16" height="5" fill="url(#rb-copper)" />
          <circle cx="46" cy="190" r="10" fill="#171717" />
        </g>
        <g className="rb-arm-r">
          <rect x="146" y="122" width="16" height="64" rx="8" fill="url(#rb-pearl)" stroke="#E4D9CD" />
          <rect x="146" y="150" width="16" height="5" fill="url(#rb-copper)" />
          <circle cx="154" cy="190" r="10" fill="#171717" />
        </g>

        {/* torso */}
        <rect x="60" y="112" width="80" height="94" rx="34" fill="url(#rb-pearl)" stroke="#E4D9CD" />
        <rect x="80" y="134" width="40" height="30" rx="12" fill="#171717" />
        <circle cx="100" cy="149" r="8" fill="url(#rb-copper)" filter="url(#rb-glow)" />
        <rect x="74" y="188" width="52" height="5" rx="2.5" fill="url(#rb-copper)" />
        <rect x="90" y="102" width="20" height="14" rx="5" fill="#171717" />

        {/* head */}
        <g className="rb-head">
          <line x1="100" y1="18" x2="100" y2="5" stroke="#171717" strokeWidth="3" strokeLinecap="round" />
          <circle className="rb-antenna" cx="100" cy="4" r="5" fill="url(#rb-copper)" filter="url(#rb-glow)" />
          <circle cx="44" cy="62" r="9" fill="url(#rb-copper)" />
          <circle cx="156" cy="62" r="9" fill="url(#rb-copper)" />
          <rect x="46" y="18" width="108" height="88" rx="38" fill="url(#rb-pearl)" stroke="#E4D9CD" />
          <rect x="60" y="38" width="80" height="46" rx="23" fill="url(#rb-visor)" />
          <path d="M70 46 Q100 40 130 46" fill="none" stroke="#FFFFFF" strokeOpacity="0.18" strokeWidth="2" strokeLinecap="round" />
          <g className="rb-eyes">
            <ellipse className="rb-eye" cx="85" cy="61" rx="7" ry="9.5" fill="url(#rb-copper)" filter="url(#rb-glow)" />
            <ellipse className="rb-eye" cx="115" cy="61" rx="7" ry="9.5" fill="url(#rb-copper)" filter="url(#rb-glow)" />
          </g>
        </g>
      </g>
    </svg>
  );
}

export default memo(RobotCharacterBase);
