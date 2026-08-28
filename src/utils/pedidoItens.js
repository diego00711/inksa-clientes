// Leitura dos itens de um pedido já feito.
//
// ESPELHA `_normalizar_itens` do backend (routes/orders.py). O mesmo pedido
// pode ter sido gravado como LISTA, como STRING JSON ou como OBJETO ANINHADO
// ({items: [...]}), dependendo de por onde entrou — e os campos ora se chamam
// `name`/`price`, ora `title`/`unit_price`. Qualquer parse que assuma um
// formato só devolve vazio nos outros dois, silenciosamente.
//
// Fonte única no cliente: se amanhã aparecer um quarto formato, conserta aqui.

/** Aceita lista, string JSON ou {items:[...]} e devolve sempre uma lista. */
function paraLista(items) {
  if (!items) return [];
  let bruto = items;
  if (typeof bruto === 'string') {
    try { bruto = JSON.parse(bruto); } catch { return []; }
  }
  if (bruto && !Array.isArray(bruto) && typeof bruto === 'object') {
    bruto = bruto.items || [];
  }
  return Array.isArray(bruto) ? bruto : [];
}

/** A linha de FRETE que o checkout acrescenta não é produto. */
function ehTaxaDeEntrega(it) {
  const nome = String(it?.title || it?.name || '').trim().toLowerCase();
  const pareceTaxa = /^(taxa de entrega|frete|entrega)$/.test(nome);
  // Exige nome de taxa E ausência de menu_item_id — mesma regra do backend.
  // Sem a segunda condição, um produto de verdade chamado "Frete" (loja de
  // material de construção) sumiria do pedido.
  return pareceTaxa && !it?.menu_item_id && !it?.id;
}

/**
 * Itens de produto de um pedido, normalizados.
 * Devolve [{ menuItemId, nome, quantidade }] — SEM preço de propósito:
 * repetir um pedido tem que usar o preço de HOJE, não o de quando foi feito.
 */
export function itensDoPedido(items) {
  return paraLista(items)
    .filter((it) => it && typeof it === 'object' && !ehTaxaDeEntrega(it))
    .map((it) => ({
      menuItemId: it.menu_item_id || it.id || null,
      nome: String(it.title || it.name || '').trim(),
      quantidade: Math.max(1, parseInt(it.quantity ?? it.quantidade ?? 1, 10) || 1),
    }))
    .filter((it) => it.menuItemId || it.nome);
}
