import { useEffect, useRef, useState } from 'react';
import { CLIENT_API_URL } from '../services/api';

// Cortina de "serviço indisponível" (z-9999, cobre o app INTEIRO).
//
// Antes: QUALQUER fetch que falhasse (um piscar de wifi, um timeout durante a
// tempestade de 429 do E2E) disparava 'network:error' e a cortina subia por
// cima do app — inclusive por cima do chat recém-aberto ("tela em branco") —
// e só saía com reload manual.
//
// Agora: 1) o evento só levanta a cortina se um ping de saúde CONFIRMAR que o
// servidor está fora (falha transitória de uma request não derruba a UI);
// 2) com a cortina visível, um ping a cada 4s a esconde sozinho assim que o
// servidor volta; 3) o botão tenta na hora, sem recarregar a página.
export default function GlobalError() {
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(false);
  const checkingRef = useRef(false);

  const pingServer = async () => {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const r = await fetch(`${CLIENT_API_URL}/healthz`, { signal: ctrl.signal, cache: 'no-store' });
      clearTimeout(t);
      return r.ok;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const onNetworkError = async () => {
      if (checkingRef.current) return; // já verificando
      checkingRef.current = true;
      const ok = await pingServer();
      checkingRef.current = false;
      if (!ok) setVisible(true); // só cobre o app com queda CONFIRMADA
    };
    window.addEventListener('network:error', onNetworkError);
    return () => window.removeEventListener('network:error', onNetworkError);
  }, []);

  // Auto-recuperação: visível -> pinga a cada 4s e some sozinho quando voltar.
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(async () => {
      if (await pingServer()) setVisible(false);
    }, 4000);
    return () => clearInterval(id);
  }, [visible]);

  const retryNow = async () => {
    setChecking(true);
    const ok = await pingServer();
    setChecking(false);
    if (ok) setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white p-6 text-center">
      <div className="text-7xl mb-6">🔌</div>
      <div className="w-20 h-20 mb-4">
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="40" cy="40" r="40" fill="#FFF3E0"/>
          <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="36">🛵</text>
        </svg>
      </div>
      <h1 className="text-2xl font-black text-gray-800 mb-2">Serviço temporariamente indisponível</h1>
      <p className="text-gray-500 mb-8 max-w-xs text-sm">
        Não foi possível conectar ao servidor. Reconectando automaticamente…
      </p>
      <button
        onClick={retryNow}
        disabled={checking}
        className="bg-[#FF6F00] text-white font-bold px-8 py-3 rounded-full text-lg hover:bg-orange-600 transition-colors shadow-lg disabled:opacity-60"
      >
        {checking ? 'Verificando…' : 'Tentar novamente'}
      </button>
    </div>
  );
}
