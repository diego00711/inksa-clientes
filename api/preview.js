// api/preview.js — Vercel Serverless Function
//
// A CAPA QUE APARECE QUANDO O PARCEIRO COLA O LINK DELE.
//
// O parceiro cola clientes.inksadelivery.com.br/gelae na bio do Instagram ou
// manda no WhatsApp. Antes disto, TODO link de loja mostrava a capa genérica
// da Inksa e o título "Inksa Delivery — peça e receba na sua cidade": o app é
// SPA, e o robô do WhatsApp não executa JavaScript, então ele lê o index.html
// e nunca vê o nome da loja.
//
// Na prática: o dono do Samuca colava o link do Samuca e via a marca da
// Inksa. Isso desanima quem a gente acabou de convencer a divulgar.
//
// ── POR QUE SÓ O ROBÔ CAI AQUI ────────────────────────────────────────────
// O vercel.json manda para cá apenas requisições cujo User-Agent é de robô de
// prévia (WhatsApp, Facebook, Telegram, Twitter, Discord, Slack, LinkedIn).
// Pessoa de verdade continua recebendo o index.html do app, sem hop extra e
// sem piscar. Prerender para todo mundo custaria uma volta a mais em toda
// visita — e a visita é o que a gente quer proteger.
//
// Se algo aqui falhar, devolve a capa genérica: link com prévia feia é ruim,
// link que não abre é pior.

const API = process.env.VITE_API_URL || 'https://inksa-auth-flask-dev.onrender.com';
const SITE = 'https://clientes.inksadelivery.com.br';
const CAPA_PADRAO = `${SITE}/og-inksa.png`;

const escapar = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function pagina({ titulo, descricao, imagem, url }) {
  return `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapar(titulo)}</title>
<meta name="description" content="${escapar(descricao)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Inksa Delivery">
<meta property="og:title" content="${escapar(titulo)}">
<meta property="og:description" content="${escapar(descricao)}">
<meta property="og:image" content="${escapar(imagem)}">
<meta property="og:url" content="${escapar(url)}">
<meta property="og:locale" content="pt_BR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapar(titulo)}">
<meta name="twitter:description" content="${escapar(descricao)}">
<meta name="twitter:image" content="${escapar(imagem)}">
</head><body>
<!-- Robôs de prévia param no <head>. Este redirecionamento existe só para o
     caso raro de uma pessoa chegar aqui com User-Agent de robô. -->
<p>Abrindo…</p>
<script>location.replace(${JSON.stringify(url)});</script>
</body></html>`;
}

export default async function handler(req, res) {
  const bruto = (req.query?.slug || '').toString();
  const apelido = bruto.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40);
  const url = `${SITE}/${apelido}`;

  const generico = () =>
    pagina({
      titulo: 'Inksa Delivery — peça e receba na sua cidade',
      descricao: 'Restaurantes, bebidas e mais, no app feito aqui na região. Você pede, a gente entrega.',
      imagem: CAPA_PADRAO,
      url: apelido ? url : SITE,
    });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Cache curto: se o parceiro trocar o logo, a prévia acompanha no mesmo dia
  // sem a gente precisar limpar nada.
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');

  if (!apelido) return res.status(200).send(generico());

  try {
    // Prazo curto de propósito: o robô do WhatsApp desiste rápido, e prévia
    // genérica é melhor que prévia nenhuma.
    const comPrazo = (p, ms = 4000) =>
      Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('prazo')), ms))]);

    const r1 = await comPrazo(fetch(`${API}/api/restaurants/slug/${encodeURIComponent(apelido)}`));
    if (!r1.ok) return res.status(200).send(generico());
    const d1 = await r1.json();
    const id = d1?.data?.id;
    if (!id) return res.status(200).send(generico());

    let loja = { restaurant_name: d1.data.restaurant_name };
    try {
      const r2 = await comPrazo(fetch(`${API}/api/restaurants/${id}`));
      if (r2.ok) {
        const d2 = await r2.json();
        loja = { ...loja, ...(d2?.data || d2 || {}) };
      }
    } catch { /* nome já basta para a prévia não sair genérica */ }

    const nome = loja.restaurant_name || 'Loja';
    // Uma linha só, e curta. A descrição da loja vem com quebras e emoji do
    // jeito que o parceiro digitou; quebra de linha dentro de um atributo
    // meta faz leitor de prévia cortar no lugar errado, e o WhatsApp mostra
    // por volta de 150 caracteres de qualquer forma.
    const limpar = (s) => String(s).replace(/\s+/g, ' ').trim();
    const bruta = limpar(loja.description || '');
    const descricao = bruta
      ? (bruta.length > 160 ? bruta.slice(0, 157).trimEnd() + '…' : bruta)
      : `Peça de ${nome} pelo Inksa Delivery e receba em casa.`;

    return res.status(200).send(pagina({
      titulo: `${nome} — Inksa Delivery`,
      descricao,
      // Logo da loja quando existir: é o que faz o parceiro ver a MARCA DELE
      // ao colar o link, que é o ponto inteiro deste arquivo.
      imagem: loja.logo_url || CAPA_PADRAO,
      url,
    }));
  } catch {
    return res.status(200).send(generico());
  }
}
