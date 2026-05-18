// src/components/onboarding/OnboardingSlides.jsx
// Controle via localStorage: chave "inksa_onboarding_done"
// Exibe apenas se localStorage.getItem('inksa_onboarding_done') !== 'true'

import { useState } from 'react';

const SLIDES = [
  {
    emoji: '🍔',
    title: 'Peça do seu restaurante favorito',
    desc: 'Dezenas de restaurantes em Lages esperando por você',
  },
  {
    emoji: '🛵',
    title: 'Acompanhe em tempo real',
    desc: 'Veja seu entregador se aproximando no mapa',
  },
  {
    emoji: '💳',
    title: 'Pague com segurança',
    desc: 'PIX, cartão ou dinheiro. Você escolhe.',
  },
];

export default function OnboardingSlides({ onComplete }) {
  const [current, setCurrent] = useState(0);
  const [exiting, setExiting] = useState(false);

  const finish = () => {
    localStorage.setItem('inksa_onboarding_done', 'true');
    onComplete();
  };

  const goNext = () => {
    if (current < SLIDES.length - 1) {
      setExiting(true);
      setTimeout(() => {
        setCurrent((c) => c + 1);
        setExiting(false);
      }, 200);
    } else {
      finish();
    }
  };

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Botão Pular — só nos slides 1 e 2 */}
      <div className="flex justify-end px-6 pt-6 h-14">
        {!isLast && (
          <button
            onClick={finish}
            className="text-gray-400 text-sm font-medium"
          >
            Pular
          </button>
        )}
      </div>

      {/* Conteúdo do slide */}
      <div
        className={`flex-1 flex flex-col items-center justify-center px-8 text-center transition-opacity duration-300 ${
          exiting ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="text-8xl mb-8 select-none">{slide.emoji}</div>
        <h1 className="text-2xl font-bold text-[#FF6F00] mb-4 leading-tight">
          {slide.title}
        </h1>
        <p className="text-gray-600 text-base leading-relaxed">{slide.desc}</p>
      </div>

      {/* Indicadores de progresso */}
      <div className="flex items-center justify-center gap-2 pb-6">
        {SLIDES.map((_, i) => (
          <span
            key={i}
            className={`block rounded-full transition-all duration-300 ${
              i === current
                ? 'w-6 h-2 bg-[#FF6F00]'
                : 'w-2 h-2 bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Botão de ação */}
      <div className="px-6 pb-10">
        <button
          onClick={goNext}
          className="w-full bg-[#FF6F00] text-white font-semibold text-base rounded-full min-h-[44px] py-3 active:opacity-80 transition-opacity"
        >
          {isLast ? 'Começar' : 'Próximo'}
        </button>
      </div>
    </div>
  );
}
