// src/components/PickupCodeDisplay.jsx
// Componente para exibir o código de retirada para o entregador

import React, { useState, useEffect } from 'react';
import { Package, Copy, Check } from 'lucide-react';
import AuthService from '../services/authService';

const API_BASE = import.meta.env.VITE_API_URL || 'https://inksa-auth-flask-dev.onrender.com';
const API_URL = `${API_BASE}/api`;

export function PickupCodeDisplay({ orderId, orderStatus }) {
  const [pickupCode, setPickupCode] = useState(null);
  const [deliveryCode, setDeliveryCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const authToken = AuthService.getToken();
        if (!authToken) return;

        const response = await fetch(`${API_URL}/orders/${orderId}/codes`, {
          headers: { 
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Não foi possível buscar os códigos');
        }

        const data = await response.json();
        setPickupCode(data.pickup_code);
        setDeliveryCode(data.delivery_code);
      } catch (err) {
        console.error('Erro ao buscar códigos:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCodes();
  }, [orderId]);

  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  // Não mostrar se não estiver nos status corretos
  const shouldShowPickupCode = ['accepted_by_delivery', 'delivering'].includes(orderStatus);
  const shouldShowDeliveryCode = orderStatus === 'delivering';

  if (!shouldShowPickupCode && !shouldShowDeliveryCode) {
    return null;
  }

  if (loading) {
    return (
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700 text-center">Carregando códigos...</p>
      </div>
    );
  }

  if (error) {
    return null; // Não mostrar erro, apenas não exibir nada
  }

  return (
    <div className="mt-4 space-y-3">
      {/* CÓDIGO DE RETIRADA */}
      {shouldShowPickupCode && pickupCode && (
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-purple-900">
                {orderStatus === 'accepted_by_delivery' 
                  ? '🚚 Entregador a caminho!' 
                  : '📦 Mostre este código ao entregador'}
              </h3>
              <p className="text-xs text-purple-700">Código de Retirada</p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-white border-2 border-purple-300 rounded-lg p-4">
            <div className="text-center flex-1">
              <p className="text-4xl font-bold tracking-widest text-purple-700 font-mono">
                {pickupCode}
              </p>
            </div>
            <button
              onClick={() => handleCopy(pickupCode)}
              className="ml-4 p-2 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors"
              title="Copiar código"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-purple-600" />
              )}
            </button>
          </div>

          <p className="text-xs text-purple-600 mt-2 text-center">
            ℹ️ O entregador precisa deste código para retirar o pedido no restaurante
          </p>
        </div>
      )}

      {/* CÓDIGO DE ENTREGA */}
      {shouldShowDeliveryCode && deliveryCode && (
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-green-900">
                🏠 Código de Confirmação de Entrega
              </h3>
              <p className="text-xs text-green-700">Use quando receber o pedido</p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-white border-2 border-green-300 rounded-lg p-4">
            <div className="text-center flex-1">
              <p className="text-4xl font-bold tracking-widest text-green-700 font-mono">
                {deliveryCode}
              </p>
            </div>
            <button
              onClick={() => handleCopy(deliveryCode)}
              className="ml-4 p-2 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
              title="Copiar código"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-green-600" />
              )}
            </button>
          </div>

          <p className="text-xs text-green-600 mt-2 text-center">
            ℹ️ Mostre este código ao entregador quando receber seu pedido
          </p>
        </div>
      )}
    </div>
  );
}
