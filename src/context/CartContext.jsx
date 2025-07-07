// Local: src/context/CartContext.jsx

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

// 1. Criação do Contexto
export const CartContext = createContext();

// 2. Criação do Provedor do Contexto
export const CartProvider = ({ children }) => {
  // Estado para armazenar os itens do carrinho
  // Inicializa o carrinho com dados do localStorage, se existirem
  const [cartItems, setCartItems] = useState(() => {
    try {
      const storedCartItems = localStorage.getItem('inka_cart_items');
      return storedCartItems ? JSON.parse(storedCartItems) : [];
    } catch (error) {
      console.error("Erro ao carregar itens do carrinho do localStorage:", error);
      return [];
    }
  });

  // Efeito para persistir os itens do carrinho no localStorage sempre que mudarem
  useEffect(() => {
    try {
      localStorage.setItem('inka_cart_items', JSON.stringify(cartItems));
    } catch (error) {
      console.error("Erro ao salvar itens do carrinho no localStorage:", error);
    }
  }, [cartItems]);

  // Função para adicionar um item ao carrinho
  const addItemToCart = useCallback((item) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(cartItem => cartItem.id === item.id);

      if (existingItem) {
        // Se o item já existe, aumenta a quantidade
        return prevItems.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        // Se o item não existe, adiciona com quantidade 1
        return [...prevItems, { ...item, quantity: 1 }];
      }
    });
  }, []);

  // Função para remover um item do carrinho (diminuir quantidade ou remover totalmente)
  const removeItemFromCart = useCallback((itemId) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(cartItem => cartItem.id === itemId);

      if (existingItem && existingItem.quantity > 1) {
        // Se a quantidade for maior que 1, apenas diminui
        return prevItems.map(cartItem =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      } else {
        // Se a quantidade for 1 ou o item não existir, remove-o
        return prevItems.filter(cartItem => cartItem.id !== itemId);
      }
    });
  }, []);

  // Função para limpar todo o carrinho
  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Calcula o total de itens no carrinho
  const totalItemsInCart = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Calcula o valor total do carrinho
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  // O valor que será fornecido pelo contexto
  const contextValue = {
    cartItems,
    addItemToCart,
    removeItemFromCart,
    clearCart,
    totalItemsInCart,
    cartTotal,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Hook customizado para facilitar o uso do contexto em componentes
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};