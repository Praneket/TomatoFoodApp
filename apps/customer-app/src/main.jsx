import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { store } from './store';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000), // 2s, 4s, 8s
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { background: '#1a1a2e', color: '#fff', borderRadius: '12px', border: '1px solid rgba(255,107,53,0.3)' },
              success: { iconTheme: { primary: '#ff6b35', secondary: '#fff' } },
            }}
          />
        </QueryClientProvider>
      </Provider>
    </HelmetProvider>
  </React.StrictMode>
);
