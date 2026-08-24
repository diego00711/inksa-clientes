// Local: src/pages/RestaurantDetailsPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star, Loader2, MapPin, Clock, Phone, AlertCircle, Plus, Minus } from "lucide-react";
import { useCart, montarItemComOpcoes } from '../context/CartContext';
import RestaurantService from '../services/restaurantService';
import StoreCoupons from '../components/StoreCoupons';
import EscolherOpcoes from '../components/EscolherOpcoes';

export function RestaurantDetailsPage() {
  const { id } = useParams();
  const { addItemToCart, totalItemsInCart, subTotal } = useCart();

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await RestaurantService.getRestaurantDetails(id);
        setRestaurant(data);
        const items = data.menu_items || data.menuItems || data.items || [];
        setMenuItems(items);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchDetails();
    }
  }, [id]);

  const handleQuantityChange = (itemId, change) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + change)
    }));
  };

  // Item com grupos de opção abre a tela de escolha antes de cair no carrinho.
  // Descobrir se TEM opção custa uma consulta; fazer isso pra cada item ao
  // desenhar o cardápio seria uma consulta por linha. Então pergunta só quando
  // a pessoa aperta adicionar — e se não houver grupo nenhum, a tela devolve
  // na hora e o item entra direto, sem passo a mais pra quem não usa opções.
  const [itemEscolhendo, setItemEscolhendo] = useState(null);

  const colocarNoCarrinho = (item, quantity, opcoes) => {
    const base = { ...item, restaurant_id: restaurant.id, quantity };
    const comOpcoes = opcoes?.length ? montarItemComOpcoes(base, opcoes) : base;
    for (let i = 0; i < quantity; i++) addItemToCart(comOpcoes);
    setQuantities(prev => ({ ...prev, [item.id]: 0 }));
  };

  const handleAddToCart = (item) => {
    const quantity = quantities[item.id] || 1;
    setItemEscolhendo({ item, quantity });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
        <p className="text-gray-600">Carregando loja...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="bg-red-50 p-8 rounded-xl max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4 text-red-800">Erro ao Carregar</h1>
          <p className="text-red-600 mb-6">{error}</p>
          <Link to="/" className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors">
            Voltar à página inicial
          </Link>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-20">
        <div className="bg-gray-50 p-8 rounded-xl max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Loja não encontrada</h1>
          <p className="text-gray-600 mb-6">A loja que você procura não existe ou foi removida.</p>
          <Link to="/" className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors">
            Voltar à página inicial
          </Link>
        </div>
      </div>
    );
  }

  const ratingValue = restaurant.rating ?? 0;
  const deliveryFee = restaurant.delivery_fee ?? 0;
  // Loja de entrega PRÓPRIA cobra a taxa fixa dela; loja da plataforma tem
  // frete por distância e peso, que só existe depois do endereço. Mostrar o
  // delivery_fee estático nesse caso era anunciar R$ 1,00 e cobrar R$ 30 no
  // carrinho — o card da lista já tratava isso, esta tela não.
  const temTaxaPropria = (restaurant.delivery_type ?? 'platform') !== 'platform'
    && Number(deliveryFee) > 0;
  const deliveryTime = restaurant.delivery_time;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com botão voltar */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="hover:bg-gray-100">
              <Link to="/">
                <ChevronLeft className="h-6 w-6" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold text-gray-800 truncate">
              {restaurant.restaurant_name}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Banner do Restaurante */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="relative h-44 sm:h-64">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={restaurant.restaurant_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                <span className="text-6xl select-none" aria-hidden>🍽️</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 text-white">
              <h2 className="text-lg sm:text-2xl font-bold mb-1 truncate">{restaurant.restaurant_name}</h2>
              <div className="flex items-center gap-4 text-sm">
                {restaurant.category && (
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    {restaurant.category}
                  </span>
                )}
                {/* A nota é o atalho pras avaliações: toca aqui e abre a página
                    cheia. Antes o bloco de avaliações ficava no meio da página
                    e poluía o cardápio. */}
                <Link
                  to={`/restaurantes/${id}/avaliacoes`}
                  className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full hover:bg-white/30 transition-colors"
                  aria-label="Ver avaliações da loja"
                >
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{parseFloat(ratingValue).toFixed(1)}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-80" />
                </Link>
              </div>
            </div>
          </div>

          {/* Informações do Restaurante */}
          <div className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-5 h-5 text-orange-500" />
                <span className="text-sm">
                  {restaurant.distance_km ? `${restaurant.distance_km} km` : 'Distância não calculada'}
                </span>
              </div>
              
              {deliveryTime && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <span className="text-sm">{deliveryTime}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-gray-600">
                <span className="text-sm font-medium">
                  {temTaxaPropria ? (
                    `Entrega: R$ ${parseFloat(deliveryFee).toFixed(2)}`
                  ) : (
                    <span className="text-blue-600 font-medium">Frete calculado no seu endereço</span>
                  )}
                </span>
              </div>
            </div>

            {restaurant.description && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-gray-700 leading-relaxed">{restaurant.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Cupons da loja — antes do cardápio, pra decidir o pedido já sabendo
            que tem desconto. */}
        <StoreCoupons coupons={restaurant.coupons} />

        {/* Cardápio */}
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800 flex items-center gap-2">
            🍽️ Cardápio
            <span className="text-sm font-normal text-gray-500">
              ({menuItems.length} {menuItems.length === 1 ? 'item' : 'itens'})
            </span>
          </h2>
          
          {menuItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {menuItems.map(item => {
                const quantity = quantities[item.id] || 0;
                return (
                  <div key={item.id} className="border border-gray-200 rounded-xl p-3 sm:p-4 hover:shadow-sm transition-shadow">
                    <div className="flex gap-3">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg flex-shrink-0 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                          <span className="text-2xl select-none" aria-hidden>🍔</span>
                        </div>
                      )}

                      <div className="flex-grow min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 leading-tight">{item.name}</h3>
                        {item.description && (
                          <p className="text-xs sm:text-sm text-gray-600 mb-2 leading-relaxed line-clamp-2">{item.description}</p>
                        )}
                        <p className="text-lg sm:text-xl font-bold text-orange-600 mb-2">
                          R$ {parseFloat(item.price ?? 0).toFixed(2)}
                        </p>

                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1 bg-gray-100 rounded-lg">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleQuantityChange(item.id, -1)}
                              disabled={quantity === 0}
                              className="h-9 w-9 min-h-[36px] p-0 hover:bg-gray-200"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-7 text-center font-medium text-sm">{quantity}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleQuantityChange(item.id, 1)}
                              className="h-9 w-9 min-h-[36px] p-0 hover:bg-gray-200"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          <Button
                            onClick={() => handleAddToCart(item)}
                            className="bg-orange-500 hover:bg-orange-600 text-white min-h-[36px] text-sm px-3"
                            disabled={quantity === 0}
                          >
                            {quantity === 0 ? 'Adicionar' : `+ ${quantity}`}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-50 rounded-xl p-8">
                <div className="text-gray-400 text-6xl mb-4">🍽️</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Cardápio em preparação</h3>
                <p className="text-gray-600 mb-4">
                  Este restaurante ainda não cadastrou itens no cardápio.
                </p>
                <p className="text-sm text-gray-500">
                  Entre em contato para verificar as opções disponíveis.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* espaçador: evita o último item ficar atrás da barra "Ver carrinho" */}
        {totalItemsInCart > 0 && <div className="h-20" aria-hidden />}
      </div>

      {/* Barra flutuante "Ver carrinho" — aparece quando há itens no carrinho */}
      {totalItemsInCart > 0 && (
        <div
          className="fixed left-0 right-0 z-40 px-4 sm:px-6"
          style={{ bottom: 'calc(64px + env(safe-area-inset-bottom))' }}
        >
          <div className="max-w-4xl mx-auto">
            <Link
              to="/carrinho"
              className="flex items-center justify-between gap-3 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold rounded-2xl shadow-lg shadow-orange-500/30 px-5 py-3.5 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="bg-white/25 text-sm font-bold rounded-full min-w-[24px] h-6 px-2 flex items-center justify-center">
                  {totalItemsInCart}
                </span>
                Ver carrinho
              </span>
              <span className="font-bold">R$ {Number(subTotal || 0).toFixed(2)}</span>
            </Link>
          </div>
        </div>
      )}

      {itemEscolhendo && (
        <EscolherOpcoes
          item={itemEscolhendo.item}
          quantidade={itemEscolhendo.quantity}
          onConfirmar={(opcoes) => {
            colocarNoCarrinho(itemEscolhendo.item, itemEscolhendo.quantity, opcoes);
            setItemEscolhendo(null);
          }}
          onFechar={() => setItemEscolhendo(null)}
        />
      )}
    </div>
  );
}
