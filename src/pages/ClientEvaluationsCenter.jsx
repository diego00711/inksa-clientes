import React, { useState } from "react";
import { Star, MessageCircle, Utensils, Truck, Clock, ThumbsUp, ShoppingBag } from "lucide-react";
import RestaurantReviewForm from "../components/RestaurantReviewForm";
import DeliveryReviewForm from "../components/DeliveryReviewForm";
import useDeliveredOrders from "../hooks/useDeliveredOrders";
import { useProfile } from "../context/ProfileContext";

export default function ClientEvaluationsCenter() {
  const { profile, loading } = useProfile();
  const { orders, loading: loadingOrders } = useDeliveredOrders(profile?.id, "client");
  const [highlightOrderId, setHighlightOrderId] = useState(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-500 mx-auto"></div>
          <p className="text-blue-600 font-semibold mt-4">Carregando suas avaliações...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="text-blue-500 text-6xl mb-4">🍕</div>
          <h2 className="text-2xl font-bold text-gray-700">Perfil não encontrado</h2>
          <p className="text-gray-500 mt-2">Entre em contato com o suporte</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header Section - Cliente */}
      <div className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-xl shadow-lg">
              <Star className="h-6 w-6 md:h-8 md:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-gray-800">
                Minhas Avaliações & Feedback
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                Compartilhe sua experiência com restaurantes e entregadores
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Future Reviews Received Section */}
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 md:p-6">
            <div className="flex items-center gap-3">
              <ThumbsUp className="h-5 w-5 md:h-6 md:w-6 text-white" />
              <div>
                <h2 className="text-lg md:text-2xl font-bold text-white">
                  Como você está sendo avaliado?
                </h2>
                <p className="text-indigo-100 text-sm">
                  Em breve: veja como restaurantes e entregadores te avaliam
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 md:p-6">
            <div className="text-center py-8">
              <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Funcionalidade em desenvolvimento
              </h3>
              <p className="text-gray-500 text-sm">
                Em breve você poderá ver as avaliações que restaurantes e entregadores deixam sobre você como cliente
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action for All Orders */}
        {orders?.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg md:text-xl font-bold text-gray-800">Avaliações Pendentes</h2>
              </div>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                {orders.length} pedido{orders.length !== 1 ? 's' : ''} para avaliar
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                onClick={() => {
                  alert(`${orders.length} avaliação${orders.length !== 1 ? 'ões' : ''} enviada${orders.length !== 1 ? 's' : ''} como positiva${orders.length !== 1 ? 's' : ''}!`);
                }}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Star className="h-4 w-4" />
                Avaliar Todos (Positivo)
              </button>
              <button 
                onClick={() => {
                  alert("Avaliações adiadas para depois.");
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Avaliar Depois
              </button>
            </div>
          </div>
        )}

        {/* Individual Orders for Review */}
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 md:p-6">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 md:h-6 md:w-6 text-white" />
              <div>
                <h2 className="text-lg md:text-2xl font-bold text-white">
                  Avalie seus pedidos
                </h2>
                <p className="text-blue-100 text-sm">
                  Sua opinião ajuda outros clientes e melhora o serviço
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6">
            {loadingOrders ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600 text-sm">Carregando seus pedidos...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {orders?.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-gray-600 mb-1">
                      Nenhum pedido para avaliar
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Quando você receber pedidos, poderá avaliá-los aqui
                    </p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div
                      key={order.id}
                      className={`rounded-xl border-2 transition-all duration-300 ${
                        highlightOrderId === order.id
                          ? "border-blue-300 bg-blue-50 shadow-lg"
                          : "border-gray-200 bg-white hover:border-blue-200 hover:shadow-md"
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-lg">
                              <span className="text-white font-bold text-sm">#{order.id}</span>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-800 text-sm md:text-base">
                                Pedido #{order.id}
                              </h3>
                              <div className="flex items-center gap-2 text-gray-500">
                                <Clock className="h-3 w-3" />
                                <span className="text-xs">
                                  {new Date(order.completed_at).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              
                              {/* Order Summary */}
                              <div className="mt-2 text-xs text-gray-600">
                                <span className="bg-gray-100 px-2 py-1 rounded text-xs mr-2">
                                  {order.restaurant_name}
                                </span>
                                <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                  Entregador: {order.deliveryman_name}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => setHighlightOrderId(
                              highlightOrderId === order.id ? null : order.id
                            )}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                              highlightOrderId === order.id
                                ? "bg-red-500 hover:bg-red-600 text-white"
                                : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg"
                            }`}
                          >
                            {highlightOrderId === order.id ? "Fechar" : "Avaliar"}
                          </button>
                        </div>

                        {highlightOrderId === order.id && (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mt-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Restaurant Evaluation */}
                              <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="bg-orange-100 p-2 rounded-lg">
                                    <Utensils className="h-4 w-4 text-orange-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-800 text-sm">
                                      Avaliar Restaurante
                                    </h4>
                                    <p className="text-gray-600 text-xs">
                                      {order.restaurant_name}
                                    </p>
                                  </div>
                                </div>
                                <RestaurantReviewForm
                                  restaurantId={order.restaurant_id}
                                  orderId={order.id}
                                  onSuccess={() => {
                                    alert("Avaliação do restaurante enviada!");
                                    setHighlightOrderId(null);
                                  }}
                                />
                              </div>

                              {/* Delivery Evaluation */}
                              <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="bg-green-100 p-2 rounded-lg">
                                    <Truck className="h-4 w-4 text-green-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-800 text-sm">
                                      Avaliar Entregador
                                    </h4>
                                    <p className="text-gray-600 text-xs">
                                      {order.deliveryman_name}
                                    </p>
                                  </div>
                                </div>
                                <DeliveryReviewForm
                                  deliverymanId={order.deliveryman_id}
                                  orderId={order.id}
                                  onSuccess={() => {
                                    alert("Avaliação do entregador enviada!");
                                    setHighlightOrderId(null);
                                  }}
                                />
                              </div>
                            </div>
                            
                            {/* Quick Action Buttons */}
                            <div className="flex gap-2 pt-2 border-t border-blue-200">
                              <button 
                                onClick={() => {
                                  alert("Avaliações positivas enviadas para restaurante e entregador!");
                                  setHighlightOrderId(null);
                                }}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
                              >
                                👍 Tudo Perfeito (5⭐)
                              </button>
                              <button 
                                onClick={() => setHighlightOrderId(null)}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg text-sm transition-colors"
                              >
                                Depois
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tips for Clients */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">💡</span>
            <h3 className="font-semibold text-green-800">Por que avaliar é importante:</h3>
          </div>
          <ul className="text-green-700 text-sm space-y-1">
            <li>• Ajuda outros clientes a escolherem melhores restaurantes</li>
            <li>• Reconhece o bom trabalho de entregadores dedicados</li>
            <li>• Incentiva restaurantes a manterem alta qualidade</li>
            <li>• Melhora o serviço de delivery para todos</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
