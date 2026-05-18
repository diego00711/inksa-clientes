// src/components/onboarding/GuidedTour.jsx
// Controle via localStorage: chave "inksa_tour_done"
// Exibe apenas se localStorage.getItem('inksa_tour_done') !== 'true'

import { useState } from 'react';

const STEPS = [
  {
    title: 'Endereço de entrega',
    desc: 'Defina seu endereço para ver restaurantes próximos',
  },
  {
    title: 'Restaurantes',
    desc: 'Escolha seu restaurante favorito',
  },
  {
    title: 'Carrinho',
    desc: 'Adicione itens ao carrinho',
  },
  {
    title: 'Finalizar pedido',
    desc: 'Conclua seu pedido aqui',
  },
];

export default function GuidedTour({ onComplete }) {
  const [current, setCurrent] = useState(0);

  const finish = () => {
    localStorage.setItem('inksa_tour_done', 'true');
    onComplete();
  };

  const goNext = () => {
    if (current < STEPS.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      finish();
    }
  };

  const step = STEPS[current];
  const isLast = current === STEPS.length - 1;

  return (
    <>
      {/* Overlay escuro */}
      <div
        className="fixed inset-0 z-40 bg-black/60"
        onClick={finish}
        aria-label="Fechar tour"
      />

      {/* Tooltip flutuante */}
      <div className="fixed bottom-24 left-4 right-4 bg-white rounded-2xl shadow-2xl p-5 z-50">
        {/* Seta decorativa apontando para baixo (em direção ao conteúdo) */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white" />

        {/* Cabeçalho do tooltip */}
        <div className="mb-3">
          <h3 className="font-bold text-lg text-gray-900 leading-tight">
            {step.title}
          </h3>
          <p className="text-gray-600 text-sm mt-1">{step.desc}</p>
        </div>

        {/* Progresso */}
        <p className="text-xs text-gray-400 mb-4">
          Passo {current + 1} de {STEPS.length}
        </p>

        {/* Indicadores de progresso */}
        <div className="flex items-center gap-1.5 mb-4">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`block h-1.5 rounded-full flex-1 transition-colors duration-300 ${
                i <= current ? 'bg-[#FF6F00]' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Botões */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={finish}
            className="text-gray-400 text-sm font-medium py-2"
          >
            Pular tour
          </button>
          <button
            onClick={goNext}
            className="bg-[#FF6F00] text-white font-semibold text-sm px-6 py-2 rounded-full min-h-[40px] active:opacity-80 transition-opacity"
          >
            {isLast ? 'Concluir' : 'Próximo'}
          </button>
        </div>
      </div>
    </>
  );
}
