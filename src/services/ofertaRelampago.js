// Oferta relâmpago: o toque no banner ativa o cupom e leva o cliente ao item.
//
// COMO FUNCIONA, DE PONTA A PONTA
//
// O banner público NÃO carrega o código do cupom — só o sinal `tem_relampago`.
// O código nasce da reserva, e a reserva nasce do toque. Se o código viesse
// junto da vitrine, qualquer um que lesse a resposta da API teria o desconto
// sem passar pela campanha, e o relógio não significaria nada.
//
// São DOIS tempos, e o cupom só vale dentro dos dois:
//   1. a janela da campanha — igual pra todo mundo, definida no admin
//   2. a reserva deste cliente — os minutos contados a partir DESTE toque
//
// ⚠️ UMA RESERVA POR CLIENTE, SEM RENOVAR. Tocar de novo depois de expirar
// devolve a reserva vencida, não uma nova. Quem garante isso é o banco.

import { CLIENT_API_URL, createAuthHeaders } from './api';
import authService from './authService';

export const PENDING_COUPON_KEY = 'inksa.pending_coupon';

// A oferta ativa deste cliente. Guardada à parte do código do cupom porque
// carrega o RELÓGIO — e é o relógio que o carrinho e a loja precisam mostrar.
const OFERTA_KEY = 'inksa.relampago';

/** Lê a oferta guardada. Devolve null se não houver, se estiver corrompida ou
 *  se já tiver vencido — quem chama nunca precisa conferir o prazo na mão. */
export function ofertaAtiva() {
  try {
    const bruto = localStorage.getItem(OFERTA_KEY);
    if (!bruto) return null;
    const o = JSON.parse(bruto);
    if (!o?.expiraEm) return null;
    if (new Date(o.expiraEm).getTime() <= Date.now()) return null;
    return o;
  } catch {
    return null;
  }
}

/** Quantos segundos faltam. 0 quando não há oferta ou já venceu. */
export function segundosRestantes(oferta = ofertaAtiva()) {
  if (!oferta?.expiraEm) return 0;
  return Math.max(0, Math.round((new Date(oferta.expiraEm).getTime() - Date.now()) / 1000));
}

/** "04:12" — pra mostrar na tela. */
export function formatarContagem(segundos) {
  const s = Math.max(0, Math.floor(segundos));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function limparOferta() {
  try {
    localStorage.removeItem(OFERTA_KEY);
    localStorage.removeItem(PENDING_COUPON_KEY);
  } catch { /* sem storage */ }
}

/**
 * Reserva a oferta do banner e devolve pra onde ir.
 *
 * Nunca lança: quem chama está no meio de um toque de dedo, e um erro aqui não
 * pode travar a navegação. Na pior das hipóteses o cliente vai pra loja sem o
 * cupom armado — melhor que uma tela morta.
 */
export async function reservarOferta(bannerId) {
  const token = authService.getToken?.();
  if (!token) return { ok: false, erro: 'sem_login' };

  try {
    const r = await fetch(`${CLIENT_API_URL}/api/coupons/relampago/${bannerId}/reservar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...createAuthHeaders() },
    });
    const json = await r.json().catch(() => ({}));

    if (!r.ok) return { ok: false, erro: json?.error || 'Não foi possível ativar a oferta' };

    const d = json?.data || {};
    if (d.codigo) {
      // Mesma chave que a vitrine de cupons da loja já usa — o carrinho não
      // precisa saber que veio de um banner.
      try { localStorage.setItem(PENDING_COUPON_KEY, d.codigo); } catch { /* sem storage */ }
      try {
        localStorage.setItem(OFERTA_KEY, JSON.stringify({
          codigo: d.codigo, expiraEm: d.expira_em,
          itemId: d.menu_item_id || null, slug: d.slug || null,
        }));
      } catch { /* sem storage: o cupom ainda funciona, só não há contador */ }
    }

    return { ok: true, slug: d.slug, codigo: d.codigo, itemId: d.menu_item_id, expiraEm: d.expira_em };
  } catch {
    return { ok: false, erro: 'Sem conexão agora. Tente de novo.' };
  }
}
