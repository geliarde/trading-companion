
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

console.log("%c UKULELE STUDIO PRO %c v2.2 OK ", "background:#3b82f6;color:#fff;font-weight:bold;padding:4px", "background:#1e293b;color:#94a3b8;padding:4px");

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error("ERRO CRÍTICO: Container 'root' não encontrado no DOM.");
}
