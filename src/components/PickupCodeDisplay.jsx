import React, { useState, useEffect } from 'react';
import { Shield, Truck, CheckCircle, Loader2 } from 'lucide-react';
import AuthService from '../services/authService';
import { CLIENT_API_URL } from '../services/api';
import { mensagemDeErro } from '../utils/mensagemDeErro.js';

const API_URL = `${CLIENT_API_URL}/api`;

// Status em que o pedido ainda está vivo E o cliente precisa do código à mão.
//
// ⚠️ `ready` ESTÁ AQUI POR CAUSA DA RETIRADA NO LOCAL, e a falta dele era um
// buraco real: num pedido de retirada não existe entregador, então o pedido vai
// `preparing` → `ready` → (loja confirma) → `delivered`. Ele NUNCA passa por
// `accepted_by_delivery` nem `delivering`. Como a lista antiga só tinha esses
// dois, o cliente chegava no balcão, a loja pedia o código, e esta tela não
// mostrava nada — justamente no único momento em que ele precisava.
//
// Quem fecha a retirada é o balcão, digitando o código que o CLIENTE mostra
// (ver o comentário do `OrderCard` do app do parceiro, caso 'Pronto').
const STATUS_COM_CODIGO = ['ready', 'accepted_by_delivery', 'delivering'];

export const PickupCodeDisplay = ({ orderId, orderStatus, isPickup = false }) => {
  const [codes, setCodes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const relevante = STATUS_COM_CODIGO.includes(orderStatus);

  useEffect(() => {
    if (!relevante) return;

    const fetchCodes = async () => {
      setLoading(true);
      setError(null);
      try {
        const authToken = AuthService.getToken();
        if (!authToken) throw new Error('Token não encontrado');

        const response = await fetch(`${API_URL}/orders/${orderId}/codes`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Não foi possível buscar os códigos');

        setCodes(await response.json());
      } catch (err) {
        console.error('Erro ao buscar códigos:', err);
        setError(mensagemDeErro(err, 'Não consegui buscar o código agora.',
          'Sem conexão. O código aparece assim que o sinal voltar.'));
      } finally {
        setLoading(false);
      }
    };

    fetchCodes();
  }, [orderId, orderStatus, relevante]);

  if (!relevante) return null;

  if (loading) {
    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 text-blue-700">
          <Loader2 className="animate-spin" size={20} />
          <span className="text-sm font-medium">Carregando código...</span>
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

  // Aqui existia também um bloco "Código de Retirada" lendo `codes.pickup_code`.
  // Ele NUNCA podia aparecer: a rota /codes, para user_type 'client', devolve
  // só `delivery_code` — o pickup_code é o segredo do entregador com a loja.
  // Era código que parecia vivo e não era; foi removido em 14/09/2026.
  if (!codes?.delivery_code) return null;

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="text-blue-600" size={20} />
        <h3 className="text-lg font-bold text-gray-800">
          {isPickup ? 'Código de Retirada' : 'Código de Entrega'}
        </h3>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-300 shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <Truck className="text-green-700" size={18} />
          <span className="text-sm font-semibold text-green-800">
            {isPickup ? 'Mostre no balcão' : 'Mostre a quem entregar'}
          </span>
        </div>
        <div className="bg-white p-3 rounded-md border-2 border-dashed border-green-400">
          {/* SEM dizer quantos dígitos: o código nasce com 4 desde 13/09/2026,
              mas pedido que já estava na rua na troca segue com 6. */}
          <p className="text-3xl font-bold text-center text-green-900 tracking-widest font-mono">
            {String(codes.delivery_code).toUpperCase()}
          </p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
        <div className="flex items-start gap-2">
          <CheckCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
          <div className="text-xs text-amber-800">
            {isPickup && orderStatus === 'ready' && (
              <p><strong>Pronto!</strong> Seu pedido está no balcão. Mostre este código ao retirar.</p>
            )}
            {isPickup && orderStatus !== 'ready' && (
              <p><strong>Status:</strong> A loja está preparando seu pedido.</p>
            )}
            {!isPickup && orderStatus === 'ready' && (
              <p><strong>Status:</strong> Pedido pronto, aguardando o entregador.</p>
            )}
            {!isPickup && orderStatus === 'accepted_by_delivery' && (
              <p><strong>Status:</strong> O entregador está a caminho da loja para retirar seu pedido.</p>
            )}
            {!isPickup && orderStatus === 'delivering' && (
              <p><strong>Status:</strong> Seu pedido está a caminho! Mostre o código quando o entregador chegar.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
