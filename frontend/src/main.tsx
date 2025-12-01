import React from 'react';
import ReactDOM from 'react-dom/client';
import { IonApp, setupIonicReact } from '@ionic/react';
import { BrowserRouter } from 'react-router-dom';

import App from './app/App';
import './styles/index.css';
// Ionic core CSS
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
// Optional CSS utils
import '@ionic/react/css/display.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';

// Apply saved theme *before* the app renders to avoid white flash between light/dark
function bootstrapTheme() {
  try {
    const root = document.documentElement;
    const stored = localStorage.getItem('theme');
    let dark: boolean;
    if (stored === 'dark') dark = true;
    else if (stored === 'light') dark = false;
    else dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (dark) {
      root.classList.add('dark');
      document.body.style.backgroundColor = '#0B0F19';
    } else {
      root.classList.remove('dark');
      document.body.style.backgroundColor = '#F8FAFC';
    }
  } catch {
    // Fallback: do nothing, app styles will still apply
  }
}

bootstrapTheme();

setupIonicReact({});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <IonApp>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </IonApp>
  </React.StrictMode>,
);

// PWA: register service worker in production only; during dev, unregister to prevent stale caches
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.warn('SW registration failed', err));
    });
  } else {
    // Dev: remove any existing registrations
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
  }
}
