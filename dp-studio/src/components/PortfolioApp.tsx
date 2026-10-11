import { useState } from 'react';
import Backdrop from './Backdrop';
import SoundToggle from './SoundToggle';
import WelcomeScene from './WelcomeScene';
import OpenBookPortfolio from './OpenBookPortfolio';
import IntroScene from '../scenes/IntroScene';
import BookOpeningScene from '../scenes/BookOpeningScene';
import { useSceneController } from '../hooks/useSceneController';

/**
 * Root of the experience. Owns the scene state machine and mounts exactly the
 * scene(s) that belong to the current state. The backdrop is persistent, so
 * scene changes never flash.
 */
export default function PortfolioApp() {
  const { scene, name, advance, submitName, skipToPortfolio } = useSceneController();
  // The 3D stage stays mounted under the portfolio until its entrance finishes (cross-fade).
  const [stageGone, setStageGone] = useState(false);

  const inIntro = scene === 'intro' || scene === 'name-form';
  const inBook =
    scene === 'closed-book' ||
    scene === 'unlocking' ||
    scene === 'book-opening' ||
    (scene === 'portfolio' && !stageGone);

  return (
    <main className="app" data-scene={scene}>
      <Backdrop />
      <SoundToggle />

      {inIntro && (
        <IntroScene
          scene={scene}
          onIntroDone={() => advance('intro')}
          onSubmitName={submitName}
          onExited={() => advance('name-form')}
        />
      )}

      {scene === 'welcome' && <WelcomeScene name={name} onDone={() => advance('welcome')} />}

      {inBook && <BookOpeningScene scene={scene} onAdvance={advance} onSkip={skipToPortfolio} />}

      {scene === 'portfolio' && <OpenBookPortfolio name={name} onEntered={() => setStageGone(true)} />}
    </main>
  );
}
