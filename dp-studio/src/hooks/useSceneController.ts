import { useCallback, useReducer } from 'react';

/**
 * Centralised scene state machine.
 *
 *   intro → name-form → welcome → closed-book → unlocking → book-opening → portfolio
 *
 * Only the transitions in NEXT_SCENE (plus the explicit skip) are valid. Every
 * ADVANCE action names the scene it is leaving, so a late or duplicated call
 * (React StrictMode, double clicks, stale timeline callbacks) is ignored.
 */
export type Scene =
  | 'intro'
  | 'name-form'
  | 'welcome'
  | 'closed-book'
  | 'unlocking'
  | 'book-opening'
  | 'portfolio';

export const SCENE_ORDER: Scene[] = [
  'intro',
  'name-form',
  'welcome',
  'closed-book',
  'unlocking',
  'book-opening',
  'portfolio',
];

const NEXT_SCENE: Partial<Record<Scene, Scene>> = {
  intro: 'name-form',
  'name-form': 'welcome',
  welcome: 'closed-book',
  'closed-book': 'unlocking',
  unlocking: 'book-opening',
  'book-opening': 'portfolio',
};

/** Scenes from which the visitor may jump straight to the portfolio. */
const SKIPPABLE: Scene[] = ['unlocking', 'book-opening'];

export const NAME_MAX = 50;

export type NameValidation = { ok: true; value: string } | { ok: false; message: string };

export function validateName(raw: string): NameValidation {
  const value = raw.trim();
  if (!value) {
    return { ok: false, message: "I'd love to know what to call you — please enter your name." };
  }
  if (value.length > NAME_MAX) {
    return { ok: false, message: `That's a lovely long name! Please keep it under ${NAME_MAX} characters.` };
  }
  return { ok: true, value };
}

interface State {
  scene: Scene;
  name: string;
}

type Action =
  | { type: 'ADVANCE'; from: Scene }
  | { type: 'SUBMIT_NAME'; name: string }
  | { type: 'SKIP_TO_PORTFOLIO' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADVANCE': {
      if (state.scene !== action.from) return state;
      const next = NEXT_SCENE[state.scene];
      if (!next) return state;
      // The welcome scene and everything after it needs a valid name.
      if (next === 'welcome' && !state.name) return state;
      return { ...state, scene: next };
    }
    case 'SUBMIT_NAME': {
      if (state.scene !== 'name-form') return state;
      const result = validateName(action.name);
      if (!result.ok) return state;
      return { ...state, name: result.value };
    }
    case 'SKIP_TO_PORTFOLIO': {
      if (!SKIPPABLE.includes(state.scene)) return state;
      return { ...state, scene: 'portfolio' };
    }
    default:
      return state;
  }
}

export function useSceneController() {
  const [state, dispatch] = useReducer(reducer, { scene: 'intro', name: '' } satisfies State);

  const advance = useCallback((from: Scene) => dispatch({ type: 'ADVANCE', from }), []);
  const submitName = useCallback((name: string) => dispatch({ type: 'SUBMIT_NAME', name }), []);
  const skipToPortfolio = useCallback(() => dispatch({ type: 'SKIP_TO_PORTFOLIO' }), []);

  return { scene: state.scene, name: state.name, advance, submitName, skipToPortfolio };
}
