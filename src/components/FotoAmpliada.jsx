// src/components/FotoAmpliada.jsx
//
// A FOTO DO ITEM EM TAMANHO DE VER.
//
// No cardápio a foto é uma miniatura de 80 px — o suficiente para reconhecer,
// pouco para escolher. Quem vende bolo, hambúrguer ou açaí vende pela imagem:
// o cliente quer ver a cobertura, o recheio, o tamanho da porção. Uma
// miniatura que não abre transforma o melhor argumento da loja em enfeite.
//
// Fecha por toque fora, pelo X e pelo Esc — três saídas, porque numa tela
// cheia sem saída óbvia a pessoa fecha o app inteiro.
import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function FotoAmpliada({ url, alt, onFechar }) {
  useEffect(() => {
    const aoTeclar = (e) => { if (e.key === 'Escape') onFechar(); };
    document.addEventListener('keydown', aoTeclar);

    // Trava a rolagem do fundo: sem isso, arrastar sobre a foto rola o
    // cardápio atrás, e ao fechar a pessoa perdeu o lugar onde estava.
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = antes;
    };
  }, [onFechar]);

  if (!url) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt ? `Foto de ${alt}` : 'Foto do item'}
      onClick={(e) => { if (e.target === e.currentTarget) onFechar(); }}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4"
    >
      <button
        type="button"
        onClick={onFechar}
        aria-label="Fechar foto"
        className="absolute top-4 right-4 rounded-full bg-white/15 p-2.5 text-white hover:bg-white/25 min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <X className="h-5 w-5" />
      </button>

      {/* max-h-[80vh] e não h-full: a imagem cresce até caber, sem estourar a
          tela nem cortar o prato. object-contain preserva a proporção — foto
          de comida cortada esconde justamente o que a pessoa quer avaliar. */}
      <figure className="max-w-3xl w-full">
        <img
          src={url}
          alt={alt || ''}
          className="w-full max-h-[80vh] object-contain rounded-lg"
        />
        {alt && (
          <figcaption className="mt-3 text-center text-sm text-white/90">{alt}</figcaption>
        )}
      </figure>
    </div>
  );
}
