// Local: src/context/CartContext.jsx

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

export const CartContext = createContext();

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
    setCartItems(prevItems => {
      const existingItem = prevItems.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevItems.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevItems, { ...item, quantity: 1 }];
      }
    });
  }, []);

  const removeItemFromCart = useCallback((itemId, removeAll = false) => {
    setCartItems(prevItems => {
      const currentItems = Array.isArray(prevItems) ? prevItems : []; 
      if (removeAll) {
        return currentItems.filter(cartItem => cartItem.id !== itemId);
      } else {
        const existingItem = currentItems.find(cartItem => cartItem.id === itemId);
        if (existingItem && existingItem.quantity > 1) {
          return currentItems.map(cartItem =>
            cartItem.id === itemId
              ? { ...cartItem, quantity: cartItem.quantity - 1 }
              : cartItem
          );
        } else {
          return currentItems.filter(cartItem => cartItem.id !== itemId);
        }
      }
    });
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
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