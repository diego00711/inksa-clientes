import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { ConfirmProvider } from './components/ConfirmProvider.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { iniciarAutoAtualizacao } from './utils/autoAtualiza'

// 🚀 REGISTRO DO SERVICE WORKER - PWA (só no build de produção: em dev o SW
// intercepta os fetches do Vite/mocks e causa "Failed to fetch" fantasma —
// atrapalhou a própria depuração da tela branca do chat)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
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


// Pega a versao nova sem o usuario ter que fechar e abrir o app.
// So recarrega ao voltar pro app depois de um tempo fora, e nunca nas
// telas abaixo, onde recarregar apagaria o que a pessoa esta fazendo.
iniciarAutoAtualizacao({ rotasSensiveis: ['carrinho', 'pagamento', 'checkout', 'acompanhar', 'register', 'reset-password'] });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)