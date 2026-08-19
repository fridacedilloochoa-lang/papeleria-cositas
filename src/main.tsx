import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Handle benign sandbox websocket disconnection silently so it never interrupts the UI
window.addEventListener('unhandledrejection', (event) => {
  const msg = String(event.reason?.message || event.reason || '');
  if (
    msg.toLowerCase().includes('websocket') ||
    msg.toLowerCase().includes('failed to connect') ||
    msg.toLowerCase().includes('vite')
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
