// Local: src/pages/HomePage.jsx

import { useState, useEffect, useCallback } from "react";
// ✅ CORREÇÃO DEFINITIVA: Importando o supabase a partir do arquivo de serviço que já sabemos que existe.
import RestaurantService, { supabase } from "../services/restaurantService"; 
import { RestaurantList } from "../components/RestaurantList";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { FilterDrawer } from "../components/FilterDrawer";
import { useLocation } from "../context/LocationContext";

// --- DADOS VISUAIS E OPÇÕES ---
const featuredBanner = {
  imageUrl: "/banner-gamificacao.jpg",
  title: "Ganhe Recompensas Incríveis!",
  subtitle: "Acumule pontos em cada pedido e troque por descontos exclusivos.",
};
const sortOptions = [
  { label: "Mais Próximos", value: "distance-asc" },
  { label: "Melhor Avaliados", value: "rating-desc" },
];
const ratingFilters = ["Todos", 4.0, 4.5];

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
  const { location, loading: locationLoading, error: locationError } = useLocation();

  // --- EFEITOS (HOOKS) ---
  // Efeito para buscar os dados iniciais
  useEffect(() => {
    if (!location && !locationError) return;
    
    const fetchRestaurants = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await RestaurantService.getAllRestaurants(location);
        setAllRestaurants(data || []);
        if (data) {
          const uniqueCategories = ["Todos", ...new Set(data.map(r => r.category).filter(Boolean))];
          setCategories(uniqueCategories);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRestaurants();
  }, [location, locationError]);

  // Efeito para atualizações em tempo real
  useEffect(() => {
    if (supabase) {
      const channel = supabase
        .channel('restaurant-updates')
        .on(
          'postgres_changes',
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'restaurant_profiles' 
          },
          (payload) => {
            console.log('Mudança em tempo real recebida!', payload.new);
            setAllRestaurants(currentRestaurants =>
              currentRestaurants.map(restaurant =>
                restaurant.id === payload.new.id ? payload.new : restaurant
              )
            );
          }
        )
        .subscribe();

      // Função de limpeza para parar de escutar quando o usuário sai da página
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []); // O array vazio [] garante que isso só rode uma vez

  // --- LÓGICA DE FILTRO E ORDENAÇÃO ---
  const filteredAndSortedRestaurants = allRestaurants
    .filter(restaurant => {
      const matchesSearch = (restaurant.restaurant_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRating = minRating === 0 || (restaurant.rating ?? 0) >= minRating;
      const matchesCategory = selectedCategory === "Todos" || restaurant.category === selectedCategory;
      return matchesSearch && matchesRating && matchesCategory;
    })
    .sort((a, b) => {
      if (currentSort === "rating-desc") {
        return (b.rating ?? 0) - (a.rating ?? 0);
      }
      return 0;
    });

  // --- FUNÇÕES DE EVENTO (HANDLERS) ---
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
      </div>
    </div>
  );

  // --- RENDERIZAÇÃO PRINCIPAL ---
  return (
    <>
      <h1 className="text-4xl font-extrabold mb-4 text-gray-800">Bem-vindo ao Inksa Delivery!</h1>
      <p className="text-lg text-gray-600 mb-10">Encontre o melhor restaurante para você.</p>

      {/* Banner */}
      <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-lg mb-12">
        <img src={featuredBanner.imageUrl} alt={featuredBanner.title} className="w-full h-full object-cover brightness-[.4]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <h2 className="text-white text-4xl font-extrabold mb-2 drop-shadow-lg">{featuredBanner.title}</h2>
          <p className="text-white text-lg max-w-md drop-shadow-lg">{featuredBanner.subtitle}</p>
        </div>
      </div>
      
      {/* Área de Filtros */}
      <div className="sticky top-[80px] bg-white/80 backdrop-blur-sm py-4 z-10">
        {/* Barra de Busca */}
        <div className="relative mb-4">
          <Input
            placeholder="Buscar por nome do restaurante..."
            className="w-full pl-10 h-12 text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        
        {/* Filtros Rápidos de Categoria + Botão de Filtros Avançados */}
        <div className="flex items-center gap-4">
          <div className="flex-grow flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-gray-800 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
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

      {/* Renderização da Lista e Mensagens */}
      <div className="mt-8">
        {locationLoading && <div className="text-center py-16 text-gray-500"><p>A obter a sua localização...</p></div>}
        {isLoading && !locationLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}
        {!isLoading && (error || locationError) && (
          <div className="text-center py-16 text-red-500"><p>Falha ao carregar restaurantes: {error || locationError}</p></div>
        )}
        {!isLoading && !error && !locationError && (
          <RestaurantList restaurants={filteredAndSortedRestaurants} />
        )}
      </div>
    </>
  );
}