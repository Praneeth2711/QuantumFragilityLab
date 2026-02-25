import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from '../QuantumLab2Q_v6.jsx'
import LandingPage from './LandingPage.jsx'
import QubitFlipGame from './QubitFlipGame.jsx'

function Router() {
  const [page, setPage] = useState(window.location.hash);

  useEffect(() => {
    const onHash = () => setPage(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (page === '#/lab') {
    return <App />;
  }

  if (page === '#/game') {
    return (
      <QubitFlipGame
        onBack={() => { window.location.hash = ''; }}
      />
    );
  }

  return (
    <LandingPage
      onEnterLab={() => { window.location.hash = '#/lab'; }}
      onPlayGame={() => { window.location.hash = '#/game'; }}
    />
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>,
)
