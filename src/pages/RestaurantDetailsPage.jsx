// Local: src/pages/RestaurantDetailsPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ChevronLeft, Star, Loader2 } from "lucide-react";
import { useCart } from '../context/CartContext';
import RestaurantService from '../services/restaurantService';

export function RestaurantDetailsPage() {
  const { id } = useParams();
  const { addItemToCart } = useCart();

  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await RestaurantService.getRestaurantDetails(id);
        setRestaurant(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const handleAddToCart = (item) => {
    const itemWithRestaurantId = {
      ...item,
      restaurant_id: restaurant.id,
    };
    addItemToCart(itemWithRestaurantId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-500">
        <h1 className="text-3xl font-bold mb-4">Erro ao Carregar</h1>
        <p>{error}</p>
        <Link to="/" className="text-primary mt-4 inline-block hover:underline">Voltar à página inicial</Link>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Restaurante não encontrado</h1>
        <Link to="/" className="text-primary mt-4 inline-block hover:underline">Voltar à página inicial</Link>
      </div>
    );
  }

  const ratingValue = restaurant.rating ?? 0;
  const menuItems = restaurant.menu_items || [];

  return (
    <div className="py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/"><ChevronLeft className="h-6 w-6" /></Link>
        </Button>
        <h1 className="text-3xl font-bold ml-4 text-gray-800">{restaurant.restaurant_name}</h1>
      </div>

      <div className="relative w-full h-80 rounded-xl overflow-hidden mb-6">
        <img src={restaurant.logo_url || 'https://via.placeholder.com/800x400?text=Inksa'} alt={restaurant.restaurant_name} className="w-full h-full object-cover" />
      </div>

      <div className="space-y-4 text-lg text-gray-700">
        <p><strong>Categoria:</strong> <span className="font-semibold text-primary">{restaurant.category || 'Não informada'}</span></p>
        <p className="flex items-center gap-1">
          <strong>Avaliação:</strong>
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-400" />
          <span className="font-semibold text-gray-800">{parseFloat(ratingValue).toFixed(1)} estrelas</span>
        </p>

        {/* --- CAMPO DE DESCRIÇÃO ADICIONADO AQUI --- */}
        {restaurant.description && (
          <p className="text-base text-gray-600 pt-2 border-t mt-4">
            {restaurant.description}
          </p>
        )}
        
        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-800">Cardápio</h2>
        {menuItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {menuItems.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border flex gap-4 items-center">
                <img src={item.image_url || 'https://via.placeholder.com/80x80?text=Item'} alt={item.name} className="w-20 h-20 object-cover rounded-md" />
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-gray-800">{item.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                  <p className="text-md font-bold text-primary">R$ {parseFloat(item.price ?? 0).toFixed(2)}</p>
                </div>
                <Button size="sm" onClick={() => handleAddToCart(item)}>Adicionar</Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-lg border text-muted-foreground text-center">
            <p>Este restaurante ainda não cadastrou itens no cardápio.</p>
          </div>
        )}
      </div>
    </div>
  );
}