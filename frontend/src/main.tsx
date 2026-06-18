// main.tsx - El punto de entrada de la aplicación.
// React.StrictMode ayuda a detectar problemas en desarrollo;
// BrowserRouter habilita el sistema de rutas para toda la app.

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
