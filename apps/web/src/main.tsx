import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import './estilos.css';

const cliente = new QueryClient({
  defaultOptions: {
    queries: {
      // Los datos de sensores envejecen rápido: se considera stale al instante.
      staleTime: 0,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

const raiz = document.getElementById('raiz');
if (!raiz) throw new Error('No se encontró el contenedor #raiz');

createRoot(raiz).render(
  <StrictMode>
    <QueryClientProvider client={cliente}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
