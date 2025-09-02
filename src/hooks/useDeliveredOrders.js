// src/hooks/useDeliveredOrders.js

import { useState, useEffect } from 'react';
// ✅ 1. CORREÇÃO: Importa a função específica, não o objeto 'orderService'
import { getOrdersPendingClientReview } from '../services/orderService';

/**
 * Custom Hook para buscar e gerenciar a lista de pedidos entregues
 * que estão pendentes de avaliação por parte do cliente.
 * @param {string} profileId - O ID do perfil do cliente.
 * @param {string} role - O papel do usuário (ex: 'client').
 */
export default function useDeliveredOrders(profileId, role) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!profileId || role !== 'client') { // Só executa para o papel 'client'
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        // ✅ 2. CORREÇÃO: Chama a função importada diretamente
        const pendingOrders = await getOrdersPendingClientReview(profileId, signal);
        setOrders(pendingOrders || []);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(`Erro ao buscar pedidos para ${role}:`, err);
          setError(err.message || "Não foi possível carregar os pedidos.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    return () => {
      controller.abort();
    };
  }, [profileId, role]);

  return { orders, loading, error };
}
