// Local: src/pages/HomePage.jsx

import { useState, useEffect, useCallback } from "react";
import RestaurantService, { supabase } from "../services/restaurantService";
import { RestaurantList } from "../components/RestaurantList";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useLocation } from "../context/LocationContext";

// --- DADOS VISUAIS ---
const featuredBanner = {
  imageUrl: "/banner-gamificacao.jpg",
  title: "Ganhe Recompensas Incríveis!",
  subtitle: "Acumule pontos em cada pedido e troque por descontos exclusivos.",
};

// --- COMPONENTE PRINCIPAL ---
export function HomePage() {
  // --- ESTADOS ---
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [categories, setCategories] = useState(["Todos"]);
  const [filters, setFilters] = useState({});
  const { location, loading: locationLoading, error: locationError } = useLocation();

  // --- EFEITOS (HOOKS) ---
  useEffect(() => {
    if (!location && !locationError) return;

    const fetchRestaurants = async () => {
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
      }
    };

    fetchRestaurants();
  }, [location, locationError]);

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

  // --- LÓGICA DE FILTRO ---
  const filteredRestaurants = allRestaurants
    .filter((restaurant) => {
      const name = (restaurant.restaurant_name || restaurant.name || "").toLowerCase();
      const matchesSearch = name.includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "Todos" || restaurant.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

  // --- FUNÇÕES DE EVENTO ---
  const handleCategoryClick = useCallback((category) => {
    setSelectedCategory(category);
  }, []);

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleRetry = useCallback(() => {
    if (location || locationError) {
      const fetchRestaurants = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const data = await RestaurantService.getAllRestaurants(location);
          const list = Array.isArray(data) ? data : data?.data || [];
          setAllRestaurants(list);
        } catch (err) {
          setError(err?.message || "Não foi possível carregar restaurantes.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchRestaurants();
    }
  }, [location, locationError]);

  // --- RENDERIZAÇÃO PRINCIPAL ---
  return (
    <>
      <h1 className="text-4xl font-extrabold mb-4 text-gray-800">Bem-vindo ao Inksa Delivery!</h1>
      <p className="text-lg text-gray-600 mb-10">Encontre o melhor restaurante para você.</p>

      {/* Banner */}
      <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-lg mb-12">
        <img
          src={featuredBanner.imageUrl}
          alt={featuredBanner.title}
          className="w-full h-full object-cover brightness-[.4]"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <h2 className="text-white text-4xl font-extrabold mb-2 drop-shadow-lg">
            {featuredBanner.title}
          </h2>
          <p className="text-white text-lg max-w-md drop-shadow-lg">
            {featuredBanner.subtitle}
          </p>
        </div>
      </div>

      {/* Área de Busca e Filtros */}
      <div className="sticky top-[80px] bg-white/80 backdrop-blur-sm py-4 z-10 mb-8">
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

        {/* Filtros Rápidos de Categoria */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Aviso de localização */}
        {locationError && (
          <div className="mt-3 text-sm bg-amber-50 text-amber-800 border border-amber-200 rounded px-3 py-2">
            Não conseguimos acessar sua localização no navegador. Mostrando restaurantes sem ordenação por distância.
          </div>
        )}
      </div>

      {/* Lista de Restaurantes */}
      <div className="mt-8">
        {locationLoading && (
          <div className="text-center py-16 text-gray-500">
            <p>Obtendo a sua localização...</p>
          </div>
        )}

        <RestaurantList 
          restaurants={filteredRestaurants}
          loading={isLoading && !locationLoading}
          error={!isLoading ? error : null}
          onRetry={handleRetry}
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
      </div>
    </>
  );
}
