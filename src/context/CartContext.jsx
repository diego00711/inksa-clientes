// Local: src/context/CartContext.jsx

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

export const CartContext = createContext();

/**
 * Identidade de uma LINHA do carrinho: o item mais as opções escolhidas.
 *
 * Existe porque o mesmo prato com escolhas diferentes é outro pedido pra
 * cozinha. Sem isso, pedir um frango com coxa e outro com peito viraria
 * "2x frango" e alguém receberia o corte errado.
 *
 * Os ids das opções vão ORDENADOS: escolher molho e depois bacon tem que dar a
 * mesma linha de quem escolheu bacon e depois molho.
 */
export function linhaIdDe(item) {
  const ids = (item?.opcoes || []).map((o) => o.id).filter(Boolean).sort();
  return ids.length ? `${item.id}::${ids.join(',')}` : String(item.id);
}

/** Chave de um item JÁ no carrinho, tolerando carrinho salvo antes das opções. */
export function chaveDaLinha(cartItem) {
  return cartItem?.linhaId || String(cartItem?.id);
}

/**
 * Monta o item pro carrinho com as opções escolhidas.
 *
 * O `price` da linha já sai COM o extra somado. Assim o subtotal, a tela do
 * carrinho e o resumo do pedido continuam fazendo preço × quantidade sem
 * precisar saber que opção existe — e um lugar a menos pra errar conta.
 *
 * O servidor recalcula tudo de novo pelo id da opção; isto aqui é só o que o
 * cliente VÊ.
 */
export function montarItemComOpcoes(item, escolhidas) {
  const opcoes = (escolhidas || []).map((o) => ({
    id: o.id, nome: o.nome, grupo: o.grupo, preco_extra: Number(o.preco_extra || 0),
  }));
  const extra = opcoes.reduce((s, o) => s + o.preco_extra, 0);
  return {
    ...item,
    opcoes,
    preco_base: Number(item.price || 0),
    price: Number(item.price || 0) + extra,
  };
}

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const storedCartItems = localStorage.getItem('inka_cart_items');
      return storedCartItems ? JSON.parse(storedCartItems) : [];
    } catch (error) {
      console.error("Erro ao carregar itens do carrinho do localStorage:", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('inka_cart_items', JSON.stringify(cartItems));
    } catch (error) {
      console.error("Erro ao salvar itens do carrinho no localStorage:", error);
    }
  }, [cartItems]);

  const addItemToCart = useCallback((item) => {
    // linhaId = item + opções escolhidas. É o que faz "frango com coxa" e
    // "frango com peito" serem DUAS linhas do carrinho em vez de virarem
    // quantidade 2 do mesmo prato — que chegaria errado na cozinha.
    //
    // Sem opção, linhaId é o próprio id: o carrinho de quem não usa opções
    // continua se comportando exatamente como antes.
    const novo = { ...item, linhaId: linhaIdDe(item), quantity: 1 };
    // price já vem com o extra somado (ver montarItemComOpcoes), então o
    // subtotal daqui de baixo não precisa saber que opção existe.
    setCartItems(prevItems => {
      const existente = prevItems.find(ci => chaveDaLinha(ci) === novo.linhaId);
      if (existente) {
        return prevItems.map(ci =>
          chaveDaLinha(ci) === novo.linhaId
            ? { ...ci, quantity: ci.quantity + 1 }
            : ci
        );
      }
      return [...prevItems, novo];
    });
  }, []);

  // Recebe o linhaId (ou o id puro, pra carrinho salvo antes das opções
  // existirem — chaveDaLinha resolve os dois).
  const removeItemFromCart = useCallback((linhaId, removeAll = false) => {
    setCartItems(prevItems => {
      const atuais = Array.isArray(prevItems) ? prevItems : [];
      const ehEsta = (ci) => chaveDaLinha(ci) === linhaId;
      if (removeAll) return atuais.filter(ci => !ehEsta(ci));

      const existente = atuais.find(ehEsta);
      if (existente && existente.quantity > 1) {
        return atuais.map(ci => (ehEsta(ci) ? { ...ci, quantity: ci.quantity - 1 } : ci));
      }
      return atuais.filter(ci => !ehEsta(ci));
    });
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    // Cupom guardado da página da loja morre junto com o carrinho — senão ele
    // reapareceria preenchido no próximo pedido, talvez de outra loja.
    try { localStorage.removeItem('inksa.pending_coupon'); } catch { /* sem storage */ }
  }, []);

  const totalItemsInCart = cartItems.reduce((total, item) => total + (item.quantity || 0), 0);

  // --- RENOMEADO ---
  // Renomeado de cartTotal para subTotal para maior clareza
  const subTotal = cartItems.reduce((total, item) => 
    total + (parseFloat(item.price || 0) * (item.quantity || 0))
  , 0);

  const contextValue = {
    cartItems,
    addItemToCart,
    removeItemFromCart,
    clearCart,
    totalItemsInCart,
    subTotal, // --- RENOMEADO ---
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};