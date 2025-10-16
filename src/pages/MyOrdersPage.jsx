import React, { useState, useEffect, useCallback } from 'react';
import AuthService from '../services/authService';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { PickupCodeDisplay } from '../components/PickupCodeDisplay.jsx';  // ✅ IMPORTAR

const API_BASE = import.meta.env.VITE_API_URL || 'https://inksa-auth-flask-dev.onrender.com';
const API_URL = `${API_BASE}/api`;

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const fetchOrders = useCallback(async () => {
    try {
      const authToken = AuthService.getToken();
      if (!authToken) {
        AuthService.logout();
        addToast('error', 'Sessão expirada. Por favor, faça o login novamente.');
        return;
      }
      const response = await fetch(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${authToken}` },
        credentials: 'include',
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Não foi possível buscar os pedidos.');
      }
      setOrders(result.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar pedidos:', err);
      addToast('error', err.message || 'Erro ao carregar os pedidos.');
    } finally {
      setLoading(false);
    }
  }, [navigate, addToast]);

  useEffect(() => {
    fetchOrders();
    const intervalId = setInterval(() => {
      fetchOrders();
    }, 10000);
    return () => clearInterval(intervalId);
  }, [fetchOrders]);

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await AuthService.deleteOrder(orderId);
      addToast('success', 'Pedido excluído com sucesso!');
      setOrders((prev) => prev.filter((order) => order.id !== orderId));
    } catch (err) {
      console.error('Erro ao excluir pedido:', err);
      addToast('error', err.message || 'Falha ao excluir o pedido.');
    }
  };

  // ✅ MAPEAMENTO DE STATUS ATUALIZADO
  const getStatusClasses = (status) => {
    const statusMap = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'Pendente': 'bg-yellow-100 text-yellow-800',
      'accepted': 'bg-blue-100 text-blue-800',
      'Aceito': 'bg-blue-100 text-blue-800',
      'preparing': 'bg-indigo-100 text-indigo-800',
      'Em Preparo': 'bg-indigo-100 text-indigo-800',
      'Preparando': 'bg-indigo-100 text-indigo-800',
      'ready': 'bg-purple-100 text-purple-800',
      'Pronto': 'bg-purple-100 text-purple-800',
      'Pronto para Entrega': 'bg-purple-100 text-purple-800',
      'accepted_by_delivery': 'bg-pink-100 text-pink-800',
      'Aguardando Retirada': 'bg-pink-100 text-pink-800',
      'delivering': 'bg-orange-100 text-orange-800',
      'Saiu para Entrega': 'bg-orange-100 text-orange-800',
      'delivered': 'bg-green-100 text-green-800',
      'Entregue': 'bg-green-100 text-green-800',
      'Concluído': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'Cancelado': 'bg-red-100 text-red-800',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  // ✅ TRADUÇÃO DE STATUS PARA EXIBIÇÃO
  const translateStatus = (status) => {
    const translations = {
      'pending': 'Pendente',
      'accepted': 'Aceito',
      'preparing': 'Em Preparo',
      'ready': 'Pronto para Entrega',
      'accepted_by_delivery': 'Entregador a Caminho',
      'delivering': 'Saiu para Entrega',
      'delivered': 'Entregue',
      'cancelled': 'Cancelado',
      'archived': 'Arquivado'
    };
    return translations[status] || status;
  };

  const renderContent = () => {
    if (loading) {
      return <p className="text-center text-gray-500 py-10">A carregar os seus pedidos...</p>;
    }
    if (error) {
      return <p className="text-center text-red-500 py-10">Erro: {error}</p>;
    }
    if (orders.length === 0) {
      return <p className="text-center text-gray-500 py-10">Você ainda não fez nenhum pedido.</p>;
    }
    return orders.map((order) => (
      <div key={order.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Pedido em {order.restaurant_name}</h2>
            <p className="text-sm text-gray-500 font-mono mt-1">{order.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-sm font-bold rounded-full ${getStatusClasses(order.status)}`}>
              {translateStatus(order.status)}
            </span>
            {(order.status === 'delivered' || order.status === 'Concluído' || order.status === 'Cancelado' || order.status === 'cancelled') && (
              <button
                onClick={() => handleDeleteOrder(order.id)}
                className="text-gray-400 hover:text-red-600 transition-colors"
                title="Excluir pedido antigo"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </div>

        {/* ✅ INFORMAÇÕES DO PEDIDO */}
        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="text-gray-700">
            <strong>Valor Total:</strong> R$ {parseFloat(order.total_amount).toFixed(2)}
          </p>
          <p className="text-gray-700">
            <strong>Data:</strong> {new Date(order.created_at).toLocaleString('pt-BR')}
          </p>
        </div>

        {/* ✅ CÓDIGOS DE RETIRADA E ENTREGA */}
        <PickupCodeDisplay orderId={order.id} orderStatus={order.status} />
      </div>
    ));
  };

  return (
    <div className="bg-amber-50 min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-semibold">
          <ArrowLeft size={18} />
          Voltar para a página inicial
        </Link>

        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Meus Pedidos</h1>
        <div>{renderContent()}</div>
      </div>
    </div>
  );
};

export default MyOrdersPage;
