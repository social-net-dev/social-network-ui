import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import { queryClient } from './lib/react-query';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from './components/ui/sonner';
import './index.css';
import App from './App.tsx';
import { cleanupLocalStorage } from './features/message/lib/localStorageCleanup';

// 🧹 Clean up old E2EE cache và message plaintext
cleanupLocalStorage();

const bootstrap = async () => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <ThemeProvider>
              <App />
              <Toaster
                position="top-right"
                richColors
                closeButton
                toastOptions={{
                  classNames: {
                    toast: 'glass-effect rounded-xl',
                    title: 'font-semibold',
                    description: 'text-sm',
                  },
                }}
              />
            </ThemeProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>
  );
};

void bootstrap();
