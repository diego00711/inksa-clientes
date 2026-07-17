import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const CONFETTI_COLORS = ['#FF6F00', '#4CAF50', '#2196F3', '#FFEB3B', '#E91E63', '#9C27B0'];

function useConfetti(containerRef) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const dots = [];
    for (let i = 0; i < 60; i++) {
      const dot = document.createElement('div');
      const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      const size = Math.random() * 8 + 5;
      const left = Math.random() * 100;
      const delay = Math.random() * 2;
      const duration = Math.random() * 2 + 2;

      dot.style.cssText = `
        position: fixed;
        top: -20px;
        left: ${left}vw;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        pointer-events: none;
        animation: confettiFall ${duration}s ${delay}s ease-in forwards;
        z-index: 9999;
        transform: rotate(${Math.random() * 360}deg);
      `;
      document.body.appendChild(dot);
      dots.push(dot);
    }

    const style = document.createElement('style');
    style.textContent = `
      @keyframes confettiFall {
        0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      dots.forEach(d => d.remove());
      style.remove();
    };
  }, [containerRef]);
}

export default function PaymentSuccessPage() {
  const containerRef = useRef(null);
  useConfetti(containerRef);

  const lastOrderId = localStorage.getItem('last_order_id');
  // Rota real do tracking e /pedido/:id/acompanhar (App.jsx). O caminho antigo
  // /acompanhar/:id nao existe no router — o botao pos-pagamento caia no vazio.
  const trackingLink = lastOrderId ? `/pedido/${lastOrderId}/acompanhar` : '/pedidos';

  return (
    <div ref={containerRef} className="min-h-screen bg-green-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center shadow-lg">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-3">Pedido confirmado!</h1>
        <p className="text-gray-500 text-base mb-8">
          Seu pagamento foi aprovado. Prepare-se para receber seu pedido.
        </p>

        {lastOrderId && (
          <p className="text-sm text-gray-400 mb-6 font-mono">
            Pedido: <span className="text-gray-600">{lastOrderId}</span>
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Link
            to={trackingLink}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-colors text-base"
          >
            Acompanhar pedido
          </Link>
          <Link
            to="/"
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3.5 rounded-xl border border-gray-200 transition-colors text-base"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
