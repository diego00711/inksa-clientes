import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Search, Star, Clock, Utensils } from "lucide-react";
import RestaurantService, { supabase } from "../services/restaurantService";
import { RestaurantList } from "../components/RestaurantList";
import RotatingBanner from "../components/RotatingBanner"; // Banner dinâmico
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const HomePage = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const navigate = useNavigate();

  const categories = ["Todos", "Comida Brasileira", "Pizza", "Hambúrguer", "Japonesa", "Italiana", "Sobremesas"];

  useEffect(() => {
    loadRestaurants();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Erro ao obter localização:", error);
          setLocationError("Não conseguimos acessar sua localização no navegador. Mostrando restaurantes sem ordenação por distância.");
        }
      );
    } else {
      setLocationError("Geolocalização não é suportada neste navegador.");
    }
  };

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const data = await RestaurantService.getRestaurants();
      setRestaurants(data);
    } catch (error) {
      console.error("Erro ao carregar restaurantes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const matchesSearch = restaurant.restaurant_name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "Todos" || restaurant.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleRestaurantClick = (restaurant) => {
    navigate(`/restaurant/${restaurant.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg mb-8"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Banner Dinâmico */}
        <div className="mb-8">
          <RotatingBanner />
        </div>

        {/* Cabeçalho da Página */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bem-vindo ao Inksa Delivery!
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Encontre o melhor restaurante para você.
          </p>
        </div>

        {/* Sistema de Gamificação */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center">
                <span className="mr-2">🏆</span>
                Sistema de Gamificação
              </h2>
              <p className="text-lg opacity-90 mb-4">
                Ganhe pontos, desbloqueie badges e troque por recompensas incríveis!
              </p>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1" />
                  <span>Pontos por pedidos</span>
                </div>
                <div className="flex items-center">
                  <span className="w-4 h-4 mr-1">🏅</span>
                  <span>Recompensas exclusivas</span>
                </div>
                <div className="flex items-center">
                  <span className="w-4 h-4 mr-1">⚡</span>
                  <span>Em desenvolvimento</span>
                </div>
              </div>
            </div>
            <Button
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => navigate("/gamification")}
            >
              Saiba Mais
            </Button>
          </div>
        </div>

        {/* Barra de Pesquisa */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar por nome do restaurante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Button className="h-12 px-6">
              <Search className="w-5 h-5 mr-2" />
              Buscar
            </Button>
          </div>
        </div>

        {/* Filtros de Categoria */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Categorias</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full transition-colors ${
                  selectedCategory === category
                    ? "bg-orange-500 text-white"
                    : "bg-white text-gray-700 hover:bg-orange-100"
                } border border-orange-200`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Aviso de Localização */}
        {locationError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <MapPin className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
              <p className="text-yellow-800 text-sm">{locationError}</p>
            </div>
          </div>
        )}

        {/* Lista de Restaurantes */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Restaurantes Disponíveis
            </h2>
            <span className="text-gray-600">
              {filteredRestaurants.length} restaurante(s) encontrado(s)
            </span>
          </div>

          {filteredRestaurants.length === 0 ? (
            <div className="text-center py-12">
              <Utensils className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum restaurante encontrado
              </h3>
              <p className="text-gray-600">
                Tente ajustar sua pesquisa ou categoria.
              </p>
            </div>
          ) : (
            <RestaurantList
              restaurants={filteredRestaurants}
              onRestaurantClick={handleRestaurantClick}
              userLocation={userLocation}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
