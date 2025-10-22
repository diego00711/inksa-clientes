// inksa-clientes/src/hooks/useDeliveredOrders.js - VERSÃO COMPLETA

import { useState, useEffect } from 'react';
import { getOrdersPendingClientReview } from '../services/orderService';

/**
 * Custom Hook para buscar pedidos entregues pendentes de avaliação (CLIENTE)
 * Busca pedidos que o cliente já recebeu mas ainda não avaliou
 */
export default function useDeliveredOrders(profileId) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔍 Buscando pedidos pendentes de avaliação...');
        
        // ✅ Chama o novo endpoint que lista apenas não avaliados
        const pendingOrders = await getOrdersPendingClientReview(signal);
        
        console.log(`✅ ${pendingOrders.length} pedidos pendentes encontrados`);
        
        setOrders(pendingOrders || []);
        
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('❌ Erro ao buscar pedidos:', err);
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
  }, [profileId]);

  // ✅ Função para refazer busca (útil após criar avaliação)
  const refetch = () => {
    setLoading(true);
    setError(null);
    
    getOrdersPendingClientReview()
      .then(data => setOrders(data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  return { orders, loading, error, refetch };
}
