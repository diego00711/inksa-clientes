// Local: src/pages/HomePage.jsx

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom"; // ✅ Adicionado import do Link
import RestaurantService, { supabase } from "../services/restaurantService";
import { RestaurantList } from "../components/RestaurantList";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"; // ✅ Adicionado import do Button
import { Card, CardContent } from "@/components/ui/card"; // ✅ Adicionado imports do Card
import { Search, Trophy, Star, Gift, Zap } from "lucide-react"; // ✅ Adicionados novos ícones
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

      {/* ✅ NOVO: Card promocional da Gamificação */}
      <Card className="mb-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Trophy className="w-8 h-8 text-yellow-300" />
                <h3 className="text-2xl font-bold">Sistema de Gamificação</h3>
              </div>
              <p className="text-blue-100 mb-4 text-lg">
                Ganhe pontos, desbloqueie badges e troque por recompensas incríveis!
              </p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-300" />
                  <span>Pontos por pedidos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-green-300" />
                  <span>Recompensas exclusivas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-300" />
                  <span>Em desenvolvimento</span>
                </div>
              </div>
            </div>
            <div className="ml-6">
              <Link to="/gamificacao">
                <Button variant="secondary" size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold">
                  Saiba Mais
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

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
