import { useCallback, useState } from 'react';
import { CLIENT_API_URL, createAuthHeaders } from '../services/api';
import restaurantService from '../services/restaurantService';
import { itensDoPedido } from '../utils/pedidoItens';

/**
 * "Pedir de novo": remonta o carrinho a partir de um pedido antigo.
 *
 * POR QUE ISTO NÃO É SÓ COPIAR OS ITENS PRO CARRINHO — três armadilhas, e as
 * três estragam o pedido de um jeito que o cliente só descobre no final:
 *
 * 1. PREÇO. O pedido guarda o preço do dia em que foi feito. Copiar isso
 *    deixaria a pessoa refazendo um pedido com preço vencido, e o checkout
 *    fecharia um total que a loja não combinou. Aqui SEMPRE se busca o
 *    cardápio de hoje e se usa o preço de hoje.
 *
 * 2. ITEM QUE SUMIU. A loja tira item do cardápio ou marca como indisponível.
 *    Um carrinho com item fantasma quebra no checkout. Estes ficam de fora e
 *    são devolvidos em `indisponiveis` pra tela poder avisar.
 *
 * 3. ITEM COM OPÇÃO OBRIGATÓRIA. No fluxo normal, "Adicionar" abre a tela de
 *    escolha (EscolherOpcoes) antes de o item cair no carrinho. Jogar direto
 *    no carrinho pularia essa escolha e mandaria pra cozinha um item sem o
 *    que ele precisa ("pizza" sem sabor). Estes NÃO são adicionados: voltam em
 *    `precisamEscolha` pra pessoa passar na loja e escolher.
 *
 * O carrinho é de UMA loja só (CartPage lê cartItems[0].restaurant_id pra
 * frete e cupom). Se já houver itens de outra loja, este hook NÃO apaga nada
 * por conta própria — devolve `conflito` e deixa a tela perguntar.
 */
export function usePedirDeNovo({ cartItems, addItemToCart, clearCart }) {
  const [carregando, setCarregando] = useState(false);

  const pedirDeNovo = useCallback(async (pedido, { substituirCarrinho = false } = {}) => {
    const lojaId = pedido?.restaurant_id;
    const originais = itensDoPedido(pedido?.items);
    if (!lojaId || originais.length === 0) {
      return { ok: false, motivo: 'sem_itens' };
    }

    // Carrinho de outra loja: pergunta antes, nunca apaga sozinho. Perder um
    // carrinho montado sem aviso é pior que não ter o botão.
    const lojaDoCarrinho = cartItems?.[0]?.restaurant_id;
    if (lojaDoCarrinho && String(lojaDoCarrinho) !== String(lojaId) && !substituirCarrinho) {
      return { ok: false, motivo: 'conflito', lojaDoCarrinho };
    }

    setCarregando(true);
    try {
      const loja = await restaurantService.getRestaurantDetails(lojaId);
      const cardapio = loja?.menu_items || [];

      // Casa por ID; cai no nome só como rede de segurança, porque loja que
      // recadastra o item gera id novo pro mesmo produto.
      const porId = new Map(cardapio.map((m) => [String(m.id), m]));
      const porNome = new Map(
        cardapio.map((m) => [String(m.name || '').trim().toLowerCase(), m]),
      );

      const candidatos = [];
      const indisponiveis = [];
      for (const o of originais) {
        const atual =
          (o.menuItemId && porId.get(String(o.menuItemId))) ||
          porNome.get(o.nome.toLowerCase()) ||
          null;
        // ⚠️ O CAMPO SE CHAMA `available` AQUI, NÃO `is_available`.
        // A consulta pública faz `is_available AS available`, então a checagem
        // antiga (`atual.is_available === false`) NUNCA era verdadeira — ela só
        // não causava estrago porque o servidor filtrava o esgotado antes de
        // mandar. Desde que o cardápio passou a MOSTRAR o esgotado (cinza), essa
        // rede furada voltaria a repetir item que a loja não tem.
        // Os dois nomes ficam aceitos: se um dia outra rota alimentar isto com
        // o nome do banco, continua funcionando.
        const indisponivel = atual && (atual.available === false || atual.is_available === false);
        if (!atual || indisponivel) {
          indisponiveis.push(o.nome || 'item');
        } else {
          candidatos.push({ atual, quantidade: o.quantidade });
        }
      }

      // Quem tem grupo de opção precisa passar pela escolha. Uma chamada por
      // item, em paralelo — são poucos itens por pedido, e errar aqui custa
      // mais que a requisição.
      const comGrupos = await Promise.all(
        candidatos.map(async (c) => {
          try {
            const r = await fetch(
              `${CLIENT_API_URL}/api/menu/items/${c.atual.id}/opcoes`,
              { headers: createAuthHeaders() },
            );
            const d = r.ok ? await r.json() : { grupos: [] };
            // Mesmo critério do EscolherOpcoes: grupo sem opção disponível
            // não conta, senão o item ficaria preso numa escolha impossível.
            const visiveis = (d.grupos || []).filter((g) =>
              (g.opcoes || []).some((op) => op.disponivel),
            );
            return { ...c, precisaEscolher: visiveis.length > 0 };
          } catch {
            // Sem resposta, trata como "precisa escolher": é o lado seguro.
            return { ...c, precisaEscolher: true };
          }
        }),
      );

      const diretos = comGrupos.filter((c) => !c.precisaEscolher);
      const precisamEscolha = comGrupos.filter((c) => c.precisaEscolher)
        .map((c) => c.atual.name);

      if (diretos.length === 0) {
        return { ok: false, motivo: 'nada_direto', indisponiveis, precisamEscolha, lojaId };
      }

      if (substituirCarrinho) clearCart();

      for (const { atual, quantidade } of diretos) {
        const base = {
          ...atual,
          restaurant_id: lojaId,
          price: parseFloat(atual.price) || 0,   // preço de HOJE
        };
        // addItemToCart soma 1 por chamada — é a mesma porta que a loja usa.
        for (let i = 0; i < quantidade; i += 1) addItemToCart(base);
      }

      return {
        ok: true,
        adicionados: diretos.length,
        indisponiveis,
        precisamEscolha,
        lojaId,
      };
    } catch {
      return { ok: false, motivo: 'erro' };
    } finally {
      setCarregando(false);
    }
  }, [cartItems, addItemToCart, clearCart]);

  return { pedirDeNovo, carregando };
}
