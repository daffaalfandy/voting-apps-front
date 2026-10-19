import '@fontsource-variable/plus-jakarta-sans';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { ApiError } from './api/client';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ToastProvider } from './components/Toast';
import { router } from './router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const clientError = error instanceof ApiError && error.status >= 400 && error.status < 500;
        return !clientError && failureCount < 2;
      },
    },
  },
});

function App() {
  const { restoring } = useAuth();
  if (restoring) {
    return (
      <p role="status" className="p-8 text-center text-ink-muted">
        Restoring your session…
      </p>
    );
  }
  return <RouterProvider router={router} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
