import { useEffect, useRef, useState } from 'react';

/**
 * Descrição do item do cardápio com "ver mais" — só quando precisa.
 *
 * O PROBLEMA: a descrição vinha com `line-clamp-2` e ponto final. O parceiro
 * escreve o que tem no prato ("tteokboki a carbonara, bolinho de arroz com
 * bacon, cebola, creme de leite…") e o cliente lê metade. Justo a informação
 * que faz ele decidir entre um prato e outro.
 *
 * POR QUE EXPANDIR NO LUGAR, E NÃO ABRIR MODAL: quem está no cardápio está
 * VARRENDO. Modal interrompe a varredura, exige fechar pra continuar, e
 * duplicaria os controles de quantidade que já estão no card. Expandir custa
 * um toque e devolve a pessoa exatamente onde ela estava.
 *
 * A PARTE QUE DECIDE SE FICA BOM: o "ver mais" só aparece quando o texto
 * REALMENTE não coube. Mostrar em todo item — inclusive nos de meia linha —
 * vira ruído e parece defeito. E não dá pra decidir pelo tamanho da string:
 * quantas linhas cabem depende da largura do card, do tamanho da fonte do
 * aparelho e de o usuário ter aumentado a fonte do sistema. Por isso mede o
 * elemento renderizado (scrollHeight > clientHeight) e observa redimensionamento.
 */
export function DescricaoExpandivel({ texto, className = '' }) {
  const ref = useRef(null);
  const [aberto, setAberto] = useState(false);
  const [cortado, setCortado] = useState(false);

  useEffect(() => {
    // Mede só FECHADO: aberto não existe corte pra detectar, e medir ali
    // zeraria o estado — o botão "ver menos" sumiria e prenderia a pessoa
    // no texto aberto, sem caminho de volta.
    if (aberto) return undefined;
    const el = ref.current;
    if (!el) return undefined;

    // +1px de tolerância: arredondamento de subpixel faz scrollHeight passar
    // clientHeight por frações mesmo quando o texto coube inteiro.
    const medir = () => setCortado(el.scrollHeight > el.clientHeight + 1);
    medir();

    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [texto, aberto]);

  if (!texto) return null;

  return (
    <div className="mb-2">
      <p
        ref={ref}
        className={`text-xs sm:text-sm text-gray-600 leading-relaxed ${aberto ? '' : 'line-clamp-2'} ${className}`}
      >
        {texto}
      </p>
      {(cortado || aberto) && (
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          // min-h-[32px] e py-1: alvo de toque decente sem afastar a descrição
          // do preço. Um link de 12px sem área de toque erra o dedo.
          className="mt-0.5 min-h-[32px] py-1 text-xs font-semibold text-orange-600 hover:text-orange-700 active:opacity-70"
        >
          {aberto ? 'ver menos' : 'ver mais'}
        </button>
      )}
    </div>
  );
}
