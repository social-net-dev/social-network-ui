import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from './contexts/ThemeContext';
import { queryClient } from './lib/react-query';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import App from './App.tsx';
import { Agentation } from 'agentation';

const enableMocking = async () => {
  const isMockEnabled = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_ENABLE_MOCK_API === 'true';

  if (isMockEnabled) {
    const { worker } = await import('./mocks/browser');
    return worker.start({
      onUnhandledRequest: 'bypass',
    });
  }
};

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </BrowserRouter>
          <ReactQueryDevtools initialIsOpen={false} />
          {import.meta.env.MODE === 'development' && <Agentation />}
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>
  );
});
