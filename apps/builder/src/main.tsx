import React from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from '@/ErrorBoundary';
import App from '@/App';
import './index.css';
import '../../../packages/layout/src/layout.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
