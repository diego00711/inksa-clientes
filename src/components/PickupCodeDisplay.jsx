import React, { useState, useEffect } from 'react';
import { Shield, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import AuthService from '../services/authService';
import { CLIENT_API_URL } from '../services/api';

const API_URL = `${CLIENT_API_URL}/api`;

export const PickupCodeDisplay = ({ orderId, orderStatus }) => {
  const [codes, setCodes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCodes = async () => {
      const statusesWithCodes = ['accepted_by_delivery', 'delivering', 'delivered'];
      if (!statusesWithCodes.includes(orderStatus)) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const authToken = AuthService.getToken();
        if (!authToken) {
          throw new Error('Token não encontrado');
        }

        const response = await fetch(`${API_URL}/orders/${orderId}/codes`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Não foi possível buscar os códigos');
        }

        const data = await response.json();
        setCodes(data);
      } catch (err) {
        console.error('Erro ao buscar códigos:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCodes();
  }, [orderId, orderStatus]);

  const statusesWithCodes = ['accepted_by_delivery', 'delivering', 'delivered'];
  if (!statusesWithCodes.includes(orderStatus)) {
    return null;
  }

  if (loading) {
    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 text-blue-700">
          <Clock className="animate-spin" size={20} />
          <span className="text-sm font-medium">Carregando códigos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
        <p className="text-sm text-red-700">❌ {error}</p>
      </div>
    );
  }

  if (!codes) {
    return null;
  }

  const showPickupCode = ['accepted_by_delivery', 'delivering', 'delivered'].includes(orderStatus);
  const showDeliveryCode = ['delivering', 'delivered'].includes(orderStatus);

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="text-blue-600" size={20} />
        <h3 className="text-lg font-bold text-gray-800">Códigos de Verificação</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {showPickupCode && (
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-300 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Package className="text-blue-700" size={18} />
              <span className="text-sm font-semibold text-blue-800">Código de Retirada</span>
            </div>
            <div className="bg-white p-3 rounded-md border-2 border-dashed border-blue-400">
              <p className="text-3xl font-bold text-center text-blue-900 tracking-widest font-mono">
                {codes.pickup_code}
              </p>
            </div>
            <p className="text-xs text-blue-700 mt-2 text-center">
              {orderStatus === 'accepted_by_delivery' && '🚴 Entregador está a caminho do restaurante'}
              {orderStatus === 'delivering' && '✅ Pedido retirado pelo entregador'}
              {orderStatus === 'delivered' && '✅ Pedido foi retirado'}
            </p>
          </div>
        )}

        {showDeliveryCode && (
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-300 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="text-green-700" size={18} />
              <span className="text-sm font-semibold text-green-800">Código de Entrega</span>
            </div>
            <div className="bg-white p-3 rounded-md border-2 border-dashed border-green-400">
              <p className="text-3xl font-bold text-center text-green-900 tracking-widest font-mono">
                {codes.delivery_code}
              </p>
            </div>
            <p className="text-xs text-green-700 mt-2 text-center">
              {orderStatus === 'delivering' && '🚚 Mostre este código ao entregador'}
              {orderStatus === 'delivered' && '✅ Pedido foi entregue'}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
        <div className="flex items-start gap-2">
          <CheckCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
          <div className="text-xs text-amber-800">
            {orderStatus === 'accepted_by_delivery' && (
              <p><strong>Status:</strong> O entregador está a caminho do restaurante para retirar seu pedido.</p>
            )}
            {orderStatus === 'delivering' && (
              <p><strong>Status:</strong> Seu pedido está a caminho! Mostre o código de entrega quando o entregador chegar.</p>
            )}
            {orderStatus === 'delivered' && (
              <p><strong>Concluído!</strong> Seu pedido foi entregue com sucesso. Bom apetite! 🍽️</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
