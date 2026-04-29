// Local: src/pages/RestaurantDetailsPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ChevronLeft, Star, Loader2, MapPin, Clock, Phone, AlertCircle, Plus, Minus } from "lucide-react";
import { useCart } from '../context/CartContext';
import RestaurantService from '../services/restaurantService';

export function RestaurantDetailsPage() {
  const { id } = useParams();
  const { addItemToCart } = useCart();

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

  const handleAddToCart = (item) => {
    const quantity = quantities[item.id] || 1;
    const itemWithRestaurantId = {
      ...item,
      restaurant_id: restaurant.id,
      quantity
    };
    
    for (let i = 0; i < quantity; i++) {
      addItemToCart(itemWithRestaurantId);
    }
    
    // Reset quantity after adding
    setQuantities(prev => ({ ...prev, [item.id]: 0 }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
        <p className="text-gray-600">Carregando restaurante...</p>
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
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Restaurante não encontrado</h1>
          <p className="text-gray-600 mb-6">O restaurante que você procura não existe ou foi removido.</p>
          <Link to="/" className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors">
            Voltar à página inicial
          </Link>
        </div>
      </div>
    );
  }

  const ratingValue = restaurant.rating ?? 0;
  const deliveryFee = restaurant.delivery_fee ?? 0;
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
          <div className="relative h-64">
            <img 
              src={restaurant.logo_url || 'https://via.placeholder.com/800x300?text=Inksa+Delivery'} 
              alt={restaurant.restaurant_name} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
              <h2 className="text-2xl font-bold mb-2">{restaurant.restaurant_name}</h2>
              <div className="flex items-center gap-4 text-sm">
                {restaurant.category && (
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    {restaurant.category}
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{parseFloat(ratingValue).toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Informações do Restaurante */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  {deliveryFee === 0 ? (
                    <span className="text-green-600 font-semibold">Entrega Grátis</span>
                  ) : (
                    `Entrega: R$ ${parseFloat(deliveryFee).toFixed(2)}`
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

        {/* Cardápio */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
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
                  <div key={item.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                    <div className="flex gap-4">
                      <img 
                        src={item.image_url || 'https://via.placeholder.com/100x100?text=Item'} 
                        alt={item.name} 
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      />
                      
                      <div className="flex-grow">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-3 leading-relaxed">{item.description}</p>
                        )}
                        <p className="text-xl font-bold text-orange-600 mb-3">
                          R$ {parseFloat(item.price ?? 0).toFixed(2)}
                        </p>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 bg-gray-100 rounded-lg">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleQuantityChange(item.id, -1)}
                              disabled={quantity === 0}
                              className="h-8 w-8 p-0 hover:bg-gray-200"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">{quantity}</span>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleQuantityChange(item.id, 1)}
                              className="h-8 w-8 p-0 hover:bg-gray-200"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <Button 
                            onClick={() => handleAddToCart(item)}
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                            disabled={quantity === 0}
                          >
                            {quantity === 0 ? 'Adicionar' : `Adicionar ${quantity}`}
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
      </div>
    </div>
  );
}
