// src/pages/ClientEvaluationsCenter.jsx - VERSÃO ATUALIZADA

import React, { useState, useEffect } from "react";
import { Star, MessageCircle, Utensils, Truck, Clock, ThumbsUp, ShoppingBag, UserCheck } from "lucide-react";
import RestaurantReviewForm from "../components/RestaurantReviewForm";
import DeliveryReviewForm from "../components/DeliveryReviewForm";
import useDeliveredOrders from "../hooks/useDeliveredOrders";
import { useProfile } from "../context/ProfileContext";
import { getClientReviewsReceived } from "../services/reviewService";

// Componente para renderizar uma única avaliação recebida
const ReceivedReviewCard = ({ review }) => {
  const isRestaurant = review.reviewer_type === 'restaurant';
  const icon = isRestaurant ? <Utensils className="h-4 w-4 text-orange-600" /> : <Truck className="h-4 w-4 text-green-600" />;
  const bgColor = isRestaurant ? "bg-orange-50" : "bg-green-50";

  return (
    <div className={`p-3 rounded-lg ${bgColor} border border-gray-200`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-full bg-white">{icon}</div>
          <div>
            <p className="text-xs font-bold text-gray-700">{review.reviewer_name}</p>
            <p className="text-xs text-gray-500">
              Avaliou como: <span className="font-semibold">{review.rating} de 5 estrelas</span>
            </p>
          </div>
        </div>
        <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString('pt-BR')}</span>
      </div>
      {review.comment && (
        <p className="text-xs text-gray-600 mt-2 pl-8 italic">"{review.comment}"</p>
      )}
    </div>
  );
};


export default function ClientEvaluationsCenter() {
  const { profile, loading: loadingProfile } = useProfile();
  
  // ✅ CORREÇÃO: Adiciona refetch ao hook
  const { orders, loading: loadingOrders, refetch } = useDeliveredOrders(profile?.id);
  
  const [highlightOrderId, setHighlightOrderId] = useState(null);

  // Estados para as avaliações recebidas
  const [receivedReviewsData, setReceivedReviewsData] = useState(null);
  const [loadingReceived, setLoadingReceived] = useState(true);
  const [errorReceived, setErrorReceived] = useState(null);

  // useEffect para buscar as avaliações recebidas
  useEffect(() => {
    if (profile) {
      setLoadingReceived(true);
      getClientReviewsReceived()
        .then(data => {
          setReceivedReviewsData(data);
        })
        .catch(err => {
          setErrorReceived(err.message);
        })
        .finally(() => {
          setLoadingReceived(false);
        });
    }
  }, [profile]);


  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-500 mx-auto"></div>
          <p className="text-blue-600 font-semibold mt-4">Carregando suas informações...</p>
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
      {/* Header Section */}
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
                Compartilhe sua experiência e veja como você é avaliado
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Seção "Como você está sendo avaliado?" */}
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ThumbsUp className="h-5 w-5 md:h-6 md:w-6 text-white" />
                <div>
                  <h2 className="text-lg md:text-2xl font-bold text-white">
                    Como você está sendo avaliado?
                  </h2>
                  <p className="text-indigo-100 text-sm">
                    Veja o feedback de restaurantes e entregadores
                  </p>
                </div>
              </div>
              {receivedReviewsData && (
                <div className="text-right">
                  <p className="text-white font-bold text-xl">{receivedReviewsData.average_rating.toFixed(1)} ⭐</p>
                  <p className="text-indigo-200 text-xs">Média de {receivedReviewsData.total_reviews} avaliações</p>
                </div>
              )}
            </div>
          </div>
          <div className="p-4 md:p-6">
            {loadingReceived ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="text-gray-500 text-sm mt-3">Buscando suas avaliações...</p>
              </div>
            ) : errorReceived ? (
              <div className="text-center py-8 text-red-500">
                <p>Erro ao carregar suas avaliações: {errorReceived}</p>
              </div>
            ) : receivedReviewsData?.reviews?.length > 0 ? (
              <div className="space-y-2">
                {receivedReviewsData.reviews.map((review, index) => (
                  <ReceivedReviewCard key={index} review={review} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <UserCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Nenhuma avaliação recebida ainda
                </h3>
                <p className="text-gray-500 text-sm">
                  Quando restaurantes e entregadores te avaliarem, elas aparecerão aqui.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Seção "Avalie seus pedidos" */}
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
                              <span className="text-white font-bold text-sm">#{order.id.slice(0, 8)}</span>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-800 text-sm md:text-base">
                                {order.restaurant_name}
                              </h3>
                              <div className="flex items-center gap-2 text-gray-500">
                                <Clock className="h-3 w-3" />
                                <span className="text-xs">
                                  {new Date(order.completed_at).toLocaleDateString('pt-BR')}
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
                                    refetch(); // ✅ ATUALIZA A LISTA
                                  }}
                                />
                              </div>

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
                                    refetch(); // ✅ ATUALIZA A LISTA
                                  }}
                                />
                              </div>
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
      </div>
    </div>
  );
}
