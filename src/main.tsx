import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'sonner';
import 'react-day-picker/dist/style.css';
import './index.css';

// Registrar Service Worker para notificações push
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registrado com sucesso:', registration.scope);
      })
      .catch((error) => {
        console.log('Erro ao registrar Service Worker:', error);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      <Toaster 
        position="top-right" 
        richColors 
        icons={{ error: null, success: null, warning: null, info: null }}
        toastOptions={{
          style: {
            borderRadius: '9999px',
            padding: '12px 20px',
          },
          classNames: {
            toast: 'rounded-full shadow-lg',
            title: 'text-[14px] font-semibold',
            description: 'text-[13px] font-normal text-slate-500',
          },
        }}
      />
    </AuthProvider>
  </React.StrictMode>
);









