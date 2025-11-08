import React from 'react';
import ReactDOM from 'react-dom/client';
import { IonApp, setupIonicReact } from '@ionic/react';
import { BrowserRouter } from 'react-router-dom';

import App from './app/App';
import './styles/index.css';

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
