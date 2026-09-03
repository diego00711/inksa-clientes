// src/utils/localCliente.js
//
// ONDE O CLIENTE ESTÁ — guardado uma vez, usado em toda a navegação.
//
// Antes disto, a localização só existia dentro do carrinho: a pessoa montava
// o pedido inteiro e só no fim descobria o frete — ou que a loja nem alcança
// o endereço dela. É o momento mais caro possível para perder alguém, porque
// ela já investiu o esforço de escolher.
//
// Guardar aqui serve a três telas ao mesmo tempo:
//   • página da loja — mostra o frete ANTES de montar o carrinho
//   • carrinho       — já abre com a localização preenchida
//   • banner e home  — filtro por raio precisa de lat/lng do cliente
//
// ⚠️ localStorage NÃO é um lugar só. Navegador, navegador de dentro do
// WhatsApp e APK são três armazenamentos separados — a mesma pessoa vinda de
// dois caminhos aparece como duas. Por isso isto é conveniência, nunca fonte
// da verdade: o endereço que vale no pedido é o que o carrinho confirma.
//
// E toda leitura/escrita vai em try/catch: em aba anônima e com dados de site
// bloqueados, o próprio acesso ao localStorage lança exceção.

const CHAVE = 'inksa_local_cliente';

// Uma posição velha demais não descreve mais onde a pessoa está — ela pode ter
// ido para o trabalho, para outra cidade. Sete dias é o meio-termo: não
// incomoda quem pede toda semana do mesmo lugar, e não entrega frete errado
// para quem se mudou.
const VALIDADE_MS = 7 * 24 * 60 * 60 * 1000;

export function lerLocal() {
  try {
    const cru = localStorage.getItem(CHAVE);
    if (!cru) return null;
    const l = JSON.parse(cru);
    if (!Number.isFinite(l?.lat) || !Number.isFinite(l?.lng)) return null;
    if (!l.em || Date.now() - l.em > VALIDADE_MS) return null;
    return l;
  } catch {
    return null;
  }
}

/** @param {{lat:number, lng:number, endereco?:string, precisao?:number, origem:'gps'|'endereco'}} local */
export function salvarLocal(local) {
  try {
    if (!Number.isFinite(local?.lat) || !Number.isFinite(local?.lng)) return false;
    localStorage.setItem(CHAVE, JSON.stringify({ ...local, em: Date.now() }));
    return true;
  } catch {
    return false;
  }
}

export function limparLocal() {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    /* nada a fazer: sem storage, não havia o que limpar */
  }
}

/** Rótulo curto para a barra: "Rua X, 100" ou "Sua localização atual". */
export function rotuloDoLocal(local) {
  if (!local) return null;
  const e = (local.endereco || '').trim();
  if (e) return e.length > 46 ? e.slice(0, 44) + '…' : e;
  return 'Sua localização atual';
}
