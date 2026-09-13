// Faixa de contagem regressiva da oferta relâmpago.
//
// O Diego primeiro decidiu NÃO ter contador, e depois voltou atrás com a razão
// certa: sem ele o cliente só descobre que perdeu no momento da recusa, e isso
// vira reclamação. Um relógio à vista transforma "o app me enganou" em "eu
// demorei".
//
// Aparece na loja e no carrinho — o caminho inteiro entre ativar e fechar. Some
// sozinha quando zera; não fica um "00:00" acusando ninguém.

import { useEffect, useState } from 'react';
import { ofertaAtiva, segundosRestantes, formatarContagem } from '../services/ofertaRelampago';

export default function ContagemRelampago({ className = '' }) {
  const [oferta, setOferta] = useState(() => ofertaAtiva());
  const [segundos, setSegundos] = useState(() => segundosRestantes());

  useEffect(() => {
    if (!oferta) return undefined;
    const t = setInterval(() => {
      const s = segundosRestantes(oferta);
      setSegundos(s);
      // Zerou: tira da tela e limpa o estado. Mantém o cupom no
      // `pending_coupon` de propósito — quem barra é o servidor, e a recusa
      // dele explica o motivo ("Sua oferta relâmpago expirou"). Se a tela
      // apagasse o cupom sozinha, o cliente veria o desconto sumir sem
      // explicação nenhuma.
      if (s <= 0) setOferta(null);
    }, 1000);
    return () => clearInterval(t);
  }, [oferta]);

  if (!oferta || segundos <= 0) return null;

  // Último minuto muda de cor. É o momento em que a informação deixa de ser
  // "você tem tempo" e passa a ser "corre".
  const acabando = segundos <= 60;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white ${
        acabando ? 'bg-red-600' : 'bg-orange-500'
      } ${className}`}
    >
      <span aria-hidden="true">⚡</span>
      <span>Sua oferta acaba em</span>
      <span className="font-mono tabular-nums text-base">{formatarContagem(segundos)}</span>
    </div>
  );
}
