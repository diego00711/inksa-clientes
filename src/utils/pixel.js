// Meta Pixel — o instrumento que faltava no anúncio pago.
//
// ── POR QUE EXISTE ──────────────────────────────────────────────────────────
// Em 03/11/2026 a campanha da scooter trouxe 87 cliques e ZERO cadastros, a
// R$ 0,22 o clique. O preço baixo era o sintoma, não a sorte: o Events Manager
// dizia "No data sources", então o Meta não fazia ideia do que é um cadastro no
// Inksa e otimizava pra única coisa que enxergava — abrir a página. Pedimos
// "ache quem abre página barato em Lages" e ele achou exatamente isso: gente
// que toca em tudo e sai.
//
// Com o evento de cadastro ele passa a procurar quem CADASTRA, e ainda
// destrava público semelhante e remarketing em quem já clicou.
//
// ── POR QUE NÃO ESTÁ NO index.html ──────────────────────────────────────────
// O index.html é empacotado DENTRO do APK. Lá o script do Facebook seria
// baixado a cada abertura do app, de uma origem file://, pra medir uma campanha
// que é só da web. Aqui ele é injetado em tempo de execução e só no navegador.
//
// ── A REDE SÓ DEPOIS DO `load` ──────────────────────────────────────────────
// Mesmo motivo do `defer` no Sentry (ver index.html, 09/09/2026): são ~80 KB de
// um CDN de terceiro, e num celular na rua isso compete com os chunks do
// próprio app. Mas o STUB do fbq é criado na hora — ele enfileira os eventos.
// Então quem se cadastrar antes do script chegar não é perdido: o evento sai
// quando o arquivo carrega.
//
// ⚠️ Nada aqui pode derrubar o app. Bloqueador de anúncio recusa
// connect.facebook.net, e isso tem que ser um não-evento.

import { Capacitor } from '@capacitor/core';

const PIXEL_ID = '2216974892561727';

function podeRodar() {
  try {
    return typeof window !== 'undefined' && !Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function iniciarPixel() {
  if (!podeRodar() || window.fbq) return;
  try {
    // O stub oficial do Meta, escrito legível. Tem que existir ANTES do
    // fbevents.js: é ele que guarda os eventos na fila até o script chegar.
    const fbq = function () {
      fbq.callMethod
        ? fbq.callMethod.apply(fbq, arguments)
        : fbq.queue.push(arguments);
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    window.fbq = fbq;
    if (!window._fbq) window._fbq = fbq;

    fbq('init', PIXEL_ID);
    fbq('track', 'PageView');

    const baixarScript = () => {
      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(s);
    };
    if (document.readyState === 'complete') baixarScript();
    else window.addEventListener('load', baixarScript, { once: true });
  } catch {
    /* sem Pixel o app continua inteiro; é só medição */
  }
}

/** Cadastro concluído. `metodo` separa os três caminhos que criam conta:
 *  'formulario' (tela de cadastro), 'google' (1º acesso) e 'checkout'
 *  (conta que nasce no carrinho). Sem dado pessoal: só o rótulo. */
export function marcarCadastro(metodo) {
  if (!podeRodar()) return;
  try {
    window.fbq?.('track', 'CompleteRegistration', { content_name: metodo });
  } catch {
    /* idem */
  }
}
