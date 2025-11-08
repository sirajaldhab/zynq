import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { IonApp, setupIonicReact } from '@ionic/react';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App';
import './styles/index.css';
setupIonicReact({});
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(IonApp, { children: _jsx(BrowserRouter, { children: _jsx(App, {}) }) }) }));
// PWA: register service worker if supported
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .catch((err) => console.warn('SW registration failed', err));
    });
}
