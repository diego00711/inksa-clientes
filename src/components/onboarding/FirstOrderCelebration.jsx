// src/components/onboarding/FirstOrderCelebration.jsx
// Controle via localStorage: chave "inksa_first_order_done"
// Modal de celebração com confetti via CDN (sem instalação npm)

import { useEffect } from 'react';

function launchConfetti() {
  if (typeof window.confetti === 'function') {
    window.confetti({ particleCount: 150, spread: 80, origin: { y: 0.4 } });
  } else {
    const script = document.createElement('script');
    script.src =
      'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js';
    script.onload = () => {
      window.confetti({ particleCount: 150, spread: 80, origin: { y: 0.4 } });
    };
    document.head.appendChild(script);
  }
}

export default function FirstOrderCelebration({ onComplete }) {
  useEffect(() => {
    launchConfetti();
  }, []);

  const finish = () => {
    localStorage.setItem('inksa_first_order_done', 'true');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-3xl p-8 mx-4 text-center max-w-sm w-full shadow-2xl">
        {/* Emoji celebração */}
        <div className="text-6xl mb-4 select-none">🎉</div>

        {/* Título */}
        <h2 className="text-2xl font-bold text-[#FF6F00] mb-2 leading-tight">
          Seu primeiro pedido foi feito!
        </h2>

        {/* Subtítulo */}
        <p className="text-gray-600 text-base mb-8">
          Acompanhe a entrega em tempo real
        </p>

        {/* Botão de ação */}
        <button
          onClick={finish}
          className="w-full bg-[#FF6F00] text-white font-semibold text-base rounded-full min-h-[44px] py-3 active:opacity-80 transition-opacity"
        >
          Acompanhar pedido
        </button>
      </div>
    </div>
  );
}
