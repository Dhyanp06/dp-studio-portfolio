import { useEffect, useState } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import PortfolioApp from './components/PortfolioApp';
import Logo from './components/Logo';

function Loader() {
  return (
    <div className="loader" role="status" aria-live="polite">
      <Logo height={64} />
      <span className="loader-bar" aria-hidden="true" />
      <p>Preparing the studio…</p>
    </div>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  // Wait (briefly) for the web fonts so the first scene never reflows.
  useEffect(() => {
    let alive = true;
    const finish = () => alive && setReady(true);
    const timeout = window.setTimeout(finish, 1800);
    document.fonts?.ready.then(() => {
      window.clearTimeout(timeout);
      finish();
    }, finish);
    return () => {
      alive = false;
      window.clearTimeout(timeout);
    };
  }, []);

  return <ErrorBoundary>{ready ? <PortfolioApp /> : <Loader />}</ErrorBoundary>;
}
