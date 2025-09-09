// Local: src/pages/HomePage.jsx - VERSÃO MELHORADA

import { useState, useEffect, useCallback } from "react";
import RestaurantService, { supabase } from "../services/restaurantService";
import { RestaurantList } from "../components/RestaurantList";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  MapPin, 
  Star, 
  Clock, 
  Truck, 
  Zap, 
  Gift,
  TrendingUp,
  Filter,
  RefreshCw
} from "lucide-react";
import { FilterDrawer } from "../components/FilterDrawer";
import { useLocation } from "../context/LocationContext";

// --- DADOS VISUAIS E OPÇÕES ---
const featuredBanner = {
  imageUrl: "/banner-gamificacao.jpg",
  title: "Ganhe Recompensas Incríveis!",
  subtitle: "Acumule pontos em cada pedido e troque por descontos exclusivos.",
  points: "50 Points",
  ctaText: "Saiba Mais"
};

const quickCategories = [
  { name: "Todos", icon: "🍽️", color: "bg-gray-100" },
  { name: "Pizza", icon: "🍕", color: "bg-red-100" },
  { name: "Hambúrguer", icon: "🍔", color: "bg-yellow-100" },
  { name: "Japonesa", icon: "🍱", color: "bg-green-100" },
  { name: "Italiana", icon: "🍝", color: "bg-orange-100" },
  { name: "Brasileira", icon: "🇧🇷", color: "bg-blue-100" },
  { name: "Doces", icon: "🍰", color: "bg-pink-100" },
  { name: "Saudável", icon: "🥗", color: "bg-emerald-100" }
];

const sortOptions = [
  { label: "Mais Próximos", value: "distance-asc", icon: MapPin },
  { label: "Melhor Avaliados", value: "rating-desc", icon: Star },
  { label: "Entrega Rápida", value: "delivery-time", icon: Clock },
  { label: "Mais Populares", value: "popular", icon: TrendingUp }
];

const ratingFilters = ["Todos", 4.0, 4.5];

const promotions = [
  {
    title: "Frete Grátis",
    subtitle: "Em pedidos acima de R$ 30",
    icon: Truck,
    color: "bg-green-500"
  },
  {
    title: "Entrega Rápida", 
    subtitle: "30 min ou menos",
    icon: Zap,
    color: "bg-yellow-500"
  },
  {
    title: "Cashback",
    subtitle: "5% de volta em pontos",
    icon: Gift,
    color: "bg-purple-500"
  }
];

// --- COMPONENTE PRINCIPAL ---
export function HomePage() {
  // --- ESTADOS ---
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentSort, setCurrentSort] = useState("distance-asc");
  const [minRating, setMinRating] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [categories, setCategories] = useState(["Todos"]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPromotions, setShowPromotions] = useState(true);
  const { location, loading: locationLoading, error: locationError } = useLocation();

  // --- FUNÇÃO DE BUSCA ---
  const fetchRestaurants = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await RestaurantService.getAllRestaurants(location);
      const list = Array.isArray(data) ? data : data?.data || [];
      setAllRestaurants(list);

      const uniqueCategories = ["Todos", ...new Set(list.map((r) => r.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (err) {
      setError(err?.message || "Não foi possível carregar restaurantes.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [location]);

  // --- EFEITOS (HOOKS) ---
  useEffect(() => {
    if (!location && !locationError) return;
    fetchRestaurants();
  }, [location, locationError, fetchRestaurants]);

  // Atualizações em tempo real
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("restaurant-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "restaurant_profiles",
        },
        (payload) => {
          setAllRestaurants((currentRestaurants) =>
            currentRestaurants.map((restaurant) =>
              restaurant.id === payload.new.id ? { ...restaurant, ...payload.new } : restaurant
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- LÓGICA DE FILTRO E ORDENAÇÃO ---
  const filteredAndSortedRestaurants = allRestaurants
    .filter((restaurant) => {
      const name = (restaurant.restaurant_name || restaurant.name || "").toLowerCase();
      const matchesSearch = name.includes(searchTerm.toLowerCase());
      const ratingValue = restaurant.rating ?? 0;
      const matchesRating = minRating === 0 || ratingValue >= minRating;
      const matchesCategory =
        selectedCategory === "Todos" || restaurant.category === selectedCategory;
      return matchesSearch && matchesRating && matchesCategory;
    })
    .sort((a, b) => {
      if (currentSort === "rating-desc") {
        return (b.rating ?? 0) - (a.rating ?? 0);
      }
      if (currentSort === "distance-asc") {
        const dist = (r) =>
          r.distance_meters ?? r.distance ?? Number.POSITIVE_INFINITY;
        return dist(a) - dist(b);
      }
      if (currentSort === "delivery-time") {
        return (a.delivery_time ?? 30) - (b.delivery_time ?? 30);
      }
      if (currentSort === "popular") {
        return (b.order_count ?? 0) - (a.order_count ?? 0);
      }
      return 0;
    });

  // --- FUNÇÕES DE EVENTO (HANDLERS) ---
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchRestaurants();
  }, [fetchRestaurants]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setMinRating(0);
    setSelectedCategory("Todos");
    setCurrentSort("distance-asc");
  }, []);

  const handleCategoryClick = useCallback((category) => {
    setSelectedCategory(category);
  }, []);

  const handleRatingFilterClick = useCallback((rating) => {
    setMinRating(rating);
  }, []);

  const handleSortChange = useCallback((sortValue) => {
    setCurrentSort(sortValue);
  }, []);

  // --- COMPONENTE DE SKELETON ---
  const SkeletonCard = () => (
    <div className="bg-white rounded-xl shadow-md animate-pulse">
      <div className="h-40 bg-gray-200 rounded-t-xl"></div>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        <div className="flex gap-2">
          <div className="h-3 bg-gray-200 rounded w-8"></div>
          <div className="h-3 bg-gray-200 rounded w-12"></div>
        </div>
      </div>
    </div>
  );

  // --- RENDERIZAÇÃO PRINCIPAL ---
  return (
    <div className="space-y-8">
      {/* Header Welcome */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold text-gray-800">
          Olá, {location ? 'aqui estão os restaurantes próximos!' : 'bem-vindo ao Inksa Delivery!'}
        </h1>
        <p className="text-lg text-gray-600">
          {location 
            ? 'Descubra sabores incríveis na sua região' 
            : 'Encontre o melhor restaurante para você'
          }
        </p>
        {location && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <MapPin className="w-4 h-4" />
            <span>Localização detectada</span>
          </div>
        )}
      </div>

      {/* Banner Gamificação Melhorado */}
      <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-lg bg-gradient-to-r from-orange-500 to-red-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 flex items-center justify-between p-8">
          <div className="text-white space-y-3">
            <h2 className="text-4xl font-extrabold drop-shadow-lg">
              {featuredBanner.title}
            </h2>
            <p className="text-lg max-w-md drop-shadow-lg opacity-90">
              {featuredBanner.subtitle}
            </p>
            <Button className="bg-white text-orange-600 hover:bg-gray-100 font-semibold">
              {featuredBanner.ctaText}
            </Button>
          </div>
          <div className="hidden md:flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
            <div className="text-3xl font-bold">{featuredBanner.points}</div>
            <div className="text-sm opacity-90">Seus Pontos</div>
          </div>
        </div>
      </div>

      {/* Seção de Promoções */}
      {showPromotions && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {promotions.map((promo, index) => {
            const Icon = promo.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${promo.color}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{promo.title}</h3>
                    <p className="text-sm text-gray-600">{promo.subtitle}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Área de Filtros Melhorada */}
      <div className="sticky top-[80px] bg-white/95 backdrop-blur-sm py-4 z-10 rounded-lg shadow-sm border">
        {/* Barra de Busca com melhor design */}
        <div className="relative mb-4">
          <Input
            placeholder="Buscar por nome do restaurante..."
            className="w-full pl-12 pr-4 h-14 text-base border-2 focus:border-orange-500 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => setSearchTerm("")}
            >
              ✕
            </Button>
          )}
        </div>

        {/* Categorias Rápidas Melhoradas */}
        <div className="flex items-center gap-4 mb-4">
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Categorias:</span>
          <div className="flex-grow flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {quickCategories.map((category) => (
              <button
                key={category.name}
                onClick={() => handleCategoryClick(category.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === category.name
                    ? "bg-orange-500 text-white shadow-lg scale-105"
                    : `${category.color} text-gray-700 hover:scale-105 hover:shadow-md`
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Controles de Ordenação e Filtros */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {filteredAndSortedRestaurants.length} restaurante{filteredAndSortedRestaurants.length !== 1 ? 's' : ''} encontrado{filteredAndSortedRestaurants.length !== 1 ? 's' : ''}
            </span>
            {(searchTerm || selectedCategory !== "Todos" || minRating > 0) && (
              <Badge variant="secondary" className="text-xs">
                Filtros ativos
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>

            <FilterDrawer
              selectedCategory={selectedCategory}
              onCategoryClick={handleCategoryClick}
              minRating={minRating}
              onRatingFilterClick={handleRatingFilterClick}
              currentSort={currentSort}
              onSortChange={handleSortChange}
              onClearFilters={handleClearFilters}
              categories={categories}
              ratingFilters={ratingFilters}
              sortOptions={sortOptions}
            />
          </div>
        </div>

        {/* Aviso de localização melhorado */}
        {locationError && (
          <div className="mt-4 flex items-center gap-3 text-sm bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-4 py-3">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <div>
              <span className="font-medium">Localização não disponível.</span>
              <span className="ml-1">Mostrando todos os restaurantes disponíveis.</span>
            </div>
          </div>
        )}
      </div>

      {/* Renderização da Lista e Mensagens */}
      <div>
        {locationLoading && (
          <div className="text-center py-16 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p>Detectando sua localização...</p>
          </div>
        )}

        {isLoading && !locationLoading && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
              <span className="text-gray-600">Carregando restaurantes...</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        )}

        {!isLoading && error && (
          <div className="text-center py-16">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Ops! Algo deu errado</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={handleRefresh} className="bg-red-600 hover:bg-red-700">
                Tentar Novamente
              </Button>
            </div>
          </div>
        )}

        {!isLoading && !error && filteredAndSortedRestaurants.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhum restaurante encontrado</h3>
              <p className="text-gray-600 mb-4">
                Tente ajustar seus filtros ou buscar por outro termo.
              </p>
              <Button onClick={handleClearFilters} variant="outline">
                Limpar Filtros
              </Button>
            </div>
          </div>
        )}

        {!isLoading && !error && filteredAndSortedRestaurants.length > 0 && (
          <RestaurantList restaurants={filteredAndSortedRestaurants} />
        )}
      </div>
    </div>
  );
}
