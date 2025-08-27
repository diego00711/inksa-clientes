import React, { useState, useEffect, useCallback } from 'react';
import AuthService from '../services/authService';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { getOrders, deleteOrder } from '../services/orderService';

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
      const result = await getOrders();
      setOrders(Array.isArray(result) ? result : (result?.data || []));
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar pedidos:', err);
      addToast('error', err.message || 'Erro ao carregar os pedidos.');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchOrders();
    const intervalId = setInterval(() => {
      console.log('Cliente: Verificando status dos pedidos...');
      fetchOrders();
    }, 10000);
    return () => clearInterval(intervalId);
  }, [fetchOrders]);

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.')) {
      return;
    }
    try {
      await deleteOrder(orderId);
      addToast('success', 'Pedido excluído com sucesso!');
      setOrders(prev => prev.filter(order => order.id !== orderId));
    } catch (err) {
      console.error('Erro ao excluir pedido:', err);
      addToast('error', err.message || 'Falha ao excluir o pedido.');
    }
  };

  const getStatusClasses = (status) => {
    const statusMap = {
      'Pendente': 'bg-yellow-100 text-yellow-800',
      'Aceito': 'bg-blue-100 text-blue-800',
      'Em Preparo': 'bg-indigo-100 text-indigo-800',
      'Pronto para Entrega': 'bg-purple-100 text-purple-800',
      'Concluído': 'bg-green-100 text-green-800',
      'Cancelado': 'bg-red-100 text-red-800',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex items-center gap-2">
        <Link to="/" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="inline-block" />
        </Link>
        <h1 className="text-2xl font-semibold">Meus Pedidos</h1>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : orders.length === 0 ? (
        <p>Você ainda não possui pedidos.</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id} className="rounded border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Pedido #{order.id}</p>
                  <p className={`mt-1 inline-block rounded px-2 py-0.5 text-xs ${getStatusClasses(order.status)}`}>
                    {order.status}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteOrder(order.id)}
                  className="text-red-600 hover:text-red-700"
                  title="Excluir pedido"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyOrdersPage;