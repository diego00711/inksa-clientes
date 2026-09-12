// Oferta relâmpago: o toque no banner ativa o cupom e leva o cliente à loja.
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

/**
 * Reserva a oferta do banner e devolve pra onde ir.
 *
 * @returns {Promise<{ok: boolean, slug?: string, codigo?: string, erro?: string}>}
 *   Nunca lança: quem chama está no meio de um toque de dedo, e um erro aqui
 *   não pode travar a navegação. Na pior das hipóteses o cliente vai pra loja
 *   sem o cupom armado e o desconto não aparece — melhor que uma tela morta.
 */
export async function reservarOferta(bannerId) {
  const token = authService.getToken?.();
  if (!token) {
    // Sem login não há a quem reservar. Quem chama decide o que fazer: mandar
    // pro login, ou só abrir a loja.
    return { ok: false, erro: 'sem_login' };
  }

  try {
    const r = await fetch(`${CLIENT_API_URL}/api/coupons/relampago/${bannerId}/reservar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...createAuthHeaders() },
    });
    const json = await r.json().catch(() => ({}));

    if (!r.ok) {
      return { ok: false, erro: json?.error || 'Não foi possível ativar a oferta' };
    }

    const codigo = json?.data?.codigo;
    if (codigo) {
      // O carrinho lê esta chave e preenche o campo de cupom sozinho.
      // Mesma chave que a vitrine de cupons da loja já usa — o carrinho não
      // precisa saber que veio de um banner.
      try { localStorage.setItem(PENDING_COUPON_KEY, codigo); } catch { /* modo privado */ }
    }

    return { ok: true, slug: json?.data?.slug, codigo, expiraEm: json?.data?.expira_em };
  } catch {
    return { ok: false, erro: 'Sem conexão agora. Tente de novo.' };
  }
}
