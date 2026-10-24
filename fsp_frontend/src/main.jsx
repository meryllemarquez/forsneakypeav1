import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { queryClient } from './queries/queryClient';
import ErrorBoundary from './components/common/ErrorBoundary/ErrorBoundary';
import { reportWebVitals } from './utils/reportWebVitals';
import { MotionConfig } from 'framer-motion';
import './styles/fonts.css';
import './styles/design-tokens.css';
import './styles/reset.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <MotionConfig reducedMotion="user">
          <App />
        </MotionConfig>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

reportWebVitals(); // dev-only: logs LCP / INP / CLS to the console