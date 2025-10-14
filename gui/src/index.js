import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter as Router } from 'react-router-dom';
import './styles/index.css';
import App from './app/App';
import { LanguageProvider } from './contexts/LanguageContext';
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import '@blueprintjs/table/lib/css/table.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <Router>
        <App />
      </Router>
    </LanguageProvider>
  </React.StrictMode>,
);
