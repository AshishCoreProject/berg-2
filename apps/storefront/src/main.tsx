import React from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from '@/ErrorBoundary';
import App from '@/App';
import { loadStore } from '@/lib/storage';
import { applyStoreToDocument } from '@/lib/applyStoreToDocument';
import './index.css';

/* Theme + button/accent tokens before first paint; App re-applies on store updates. */
applyStoreToDocument(loadStore());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
