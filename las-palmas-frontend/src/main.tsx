import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { NextUIProvider } from '@nextui-org/react';
import App from './App';
import { queryClient } from './api/consultas';
import { AuthProvider } from './auth/AuthContext';
import { AvisosProvider } from './components/Avisos';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <NextUIProvider>
          <AuthProvider>
            <AvisosProvider>
              <main className="light text-foreground bg-background h-full">
                <App />
              </main>
            </AvisosProvider>
          </AuthProvider>
        </NextUIProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
