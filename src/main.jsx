import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'

// 🚀 REGISTRO DO SERVICE WORKER - PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ SW registered successfully:', registration);
      })
      .catch((error) => {
        console.log('❌ SW registration failed:', error);
      });
  });
}

// 📱 BEFORE INSTALL PROMPT - Detecta quando pode instalar como app
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('💡 beforeinstallprompt fired - App pode ser instalado!');
  e.preventDefault();
  deferredPrompt = e;
  
  // Aqui você pode mostrar um botão customizado para instalar
  // showInstallButton();
});

// 🎉 DETECTAR QUANDO FOI INSTALADO
window.addEventListener('appinstalled', (evt) => {
  console.log('🎉 App foi instalado com sucesso!');
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)