// Local: src/components/RestaurantList.jsx

import { useState, useEffect } from "react";
import { RestaurantCard } from "./RestaurantCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw, MapPin, Filter, SlidersHorizontal, ChefHat, Grid3X3, List, Star, Clock, DollarSign } from "lucide-react";

export function RestaurantList({ 
  restaurants = [], 
  loading = false, 
  error = null, 
  onRetry,
  filters = {},
  onFiltersChange 
}) {
  const [displayCount, setDisplayCount] = useState(12);
  const [sortBy, setSortBy] = useState('distance'); // distance, rating, delivery_fee, name
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [showFilters, setShowFilters] = useState(false);
  
  // Função para ordenar restaurantes
  const sortedRestaurants = [...restaurants].sort((a, b) => {
    switch (sortBy) {
      case 'distance':
        const distA = a.distance_km || 999;
        const distB = b.distance_km || 999;
        return distA - distB;
      
      case 'rating':
        const ratingA = parseFloat(a.rating) || 0;
        const ratingB = parseFloat(b.rating) || 0;
        return ratingB - ratingA; // Maior rating primeiro
      
      case 'delivery_fee':
        const feeA = parseFloat(a.delivery_fee) || 0;
        const feeB = parseFloat(b.delivery_fee) || 0;
        return feeA - feeB; // Menor taxa primeiro
      
      case 'name':
        return a.restaurant_name.localeCompare(b.restaurant_name);
      
      default:
        return 0;
    }
  });

  // Restaurantes para exibir
  const displayedRestaurants = sortedRestaurants.slice(0, displayCount);
  const hasMoreRestaurants = sortedRestaurants.length > displayCount;

  // Estados dos restaurantes
  const openRestaurants = restaurants.filter(r => r.is_open).length;
  const closedRestaurants = restaurants.filter(r => !r.is_open).length;

  // Component Loading
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading Header */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        {/* Loading Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Component Error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="bg-red-50 p-4 rounded-full">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">Ops! Algo deu errado</h3>
          <p className="text-gray-600 max-w-md">
            Não conseguimos carregar os restaurantes. Verifique sua conexão e tente novamente.
          </p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        )}
      </div>
    );
  }

  // Empty state
  if (restaurants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="bg-orange-50 p-4 rounded-full">
          <ChefHat className="h-8 w-8 text-orange-500" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">Nenhum restaurante encontrado</h3>
          <p className="text-gray-600 max-w-md">
            Não há restaurantes disponíveis na sua região no momento. Tente expandir a área de busca.
          </p>
        </div>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          className="flex items-center gap-2"
        >
          <MapPin className="h-4 w-4" />
          Atualizar localização
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas e controles */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Estatísticas */}
          <div className="flex items-center gap-6">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{restaurants.length}</span> restaurantes
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{openRestaurants} abertos</span>
              </div>
              {closedRestaurants > 0 && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>{closedRestaurants} fechados</span>
                </div>
              )}
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center gap-2">
            {/* Ordenação */}
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="distance">Distância</option>
              <option value="rating">Avaliação</option>
              <option value="delivery_fee">Taxa de entrega</option>
              <option value="name">Nome</option>
            </select>

            {/* Modo de visualização */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-orange-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-orange-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Botão de filtros */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
            </Button>
          </div>
        </div>

        {/* Filtros expandidos */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avaliação mínima</label>
                <select 
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  onChange={(e) => onFiltersChange?.({ ...filters, minRating: e.target.value })}
                >
                  <option value="">Qualquer</option>
                  <option value="4">4+ estrelas</option>
                  <option value="3">3+ estrelas</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taxa de entrega</label>
                <select 
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  onChange={(e) => onFiltersChange?.({ ...filters, deliveryFee: e.target.value })}
                >
                  <option value="">Qualquer</option>
                  <option value="free">Entrega grátis</option>
                  <option value="low">Até R$ 5,00</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  onChange={(e) => onFiltersChange?.({ ...filters, status: e.target.value })}
                >
                  <option value="">Todos</option>
                  <option value="open">Apenas abertos</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de restaurantes */}
      <div className={
        viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "space-y-4"
      }>
        {displayedRestaurants.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            viewMode={viewMode}
          />
        ))}
      </div>

      {/* Botão "Carregar mais" */}
      {hasMoreRestaurants && (
        <div className="flex justify-center pt-8">
          <Button 
            onClick={() => setDisplayCount(prev => prev + 12)}
            variant="outline"
            size="lg"
            className="flex items-center gap-2"
          >
            Ver mais restaurantes ({sortedRestaurants.length - displayCount} restantes)
          </Button>
        </div>
      )}

      {/* Footer com informações */}
      <div className="text-center text-sm text-gray-500 py-4">
        Mostrando {displayedRestaurants.length} de {restaurants.length} restaurantes
      </div>
    </div>
  );
}
