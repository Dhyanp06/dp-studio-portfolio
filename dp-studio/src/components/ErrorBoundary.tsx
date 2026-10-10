import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  failed: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('DP Studio crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="fatal" role="alert">
        <h1>Something went off-script.</h1>
        <p>The story hit an unexpected snag. Reloading usually puts it right back on the page.</p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          RELOAD THE BOOK
        </button>
      </div>
    );
  }
}
