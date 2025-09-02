// src/hooks/useDeliveredOrders.js

import { useState, useEffect } from 'react';
// Supondo que você tenha um serviço de pedidos no frontend do cliente.
import { orderService } from '../services/orderService';

/**
 * Custom Hook para buscar pedidos de um usuário (cliente ou entregador)
 * que estão pendentes de avaliação.
 * @param {string} profileId - O ID do perfil do usuário.
 * @param {string} role - O papel do usuário ('client' ou 'deliveryman').
 */
export default function useDeliveredOrders(profileId, role) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!profileId || !role) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        // Usamos uma função de serviço que busca os pedidos pendentes para o cliente.
        // Você precisará criar essa função em seu 'orderService'.
        const pendingOrders = await orderService.getOrdersPendingClientReview(profileId, signal);
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
