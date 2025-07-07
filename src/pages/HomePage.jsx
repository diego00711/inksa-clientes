// Local: src/pages/HomePage.jsx - VERSÃO COMPLETA E CORRIGIDA (ERRO DE SINTAXE 'return')

import { useState, useEffect, useCallback } from "react"; 
import { RestaurantList } from "../components/RestaurantList";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { FilterDrawer } from "../components/FilterDrawer"; // Adicionado import do FilterDrawer

const INITIAL_LOAD_COUNT = 8; 

const mockRestaurants = [
  { id: 1, name: "Pizzaria Sabor Divino", imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591", category: "Pizza", rating: 4.8, deliveryFee: 5.00, deliveryTime: "30-45 min" },
  { id: 2, name: "Burger-Mania", imageUrl: "https://images.unsplash.com/photo-1571091718767-18b5b1457add", category: "Lanches", rating: 4.9, deliveryFee: 0.00, deliveryTime: "25-35 min" },
  { id: 3, name: "Sushi House", imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c", category: "Japonesa", rating: 4.7, deliveryFee: 7.00, deliveryTime: "45-60 min" },
  { id: 4, name: "Cantina da Nona", imageUrl: "https://images.unsplash.com/photo-1598866594243-7b36de3ca16c", category: "Italiana", rating: 4.6, deliveryFee: 6.00, deliveryTime: "40-50 min" },
  { id: 5, name: "Padaria Doce Pão", imageUrl: "https://images.unsplash.com/photo-1627962635489-08bf1841364d", category: "Padaria", rating: 4.1, deliveryFee: 3.00, deliveryTime: "20-30 min" },
  { id: 6, name: "Churrascaria Gaúcha", imageUrl: "https://images.unsplash.com/photo-1610444738580-044237f3747f", category: "Churrasco", rating: 3.9, deliveryFee: 8.00, deliveryTime: "45-60 min" },
  { id: 7, name: "Temaki Express", imageUrl: "https://images.unsplash.com/photo-1563612116035-7c152a41d6b0", category: "Japonesa", rating: 4.5, deliveryFee: 6.00, deliveryTime: "35-45 min" },
  { id: 8, name: "Café da Esquina", imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93", category: "Cafeteria", rating: 4.2, deliveryFee: 4.00, deliveryTime: "20-30 min" },
  { id: 9, name: "Doceria Encantada", imageUrl: "https://images.unsplash.com/photo-1587314168485-3236d6710814", category: "Doces", rating: 4.9, deliveryFee: 5.00, deliveryTime: "30-40 min" },
  { id: 10, name: "Comida Caseira da Vovó", imageUrl: "https://images.unsplash.com/photo-1512621776951-a5732159c961", category: "Brasileira", rating: 4.3, deliveryFee: 6.00, deliveryTime: "40-55 min" },
  { id: 11, name: "Hamburgueria Artesanal", imageUrl: "https://images.unsplash.com/photo-1568901346379-8ce8e6042132", category: "Lanches", rating: 4.7, deliveryFee: 0.00, deliveryTime: "25-35 min" },
  { id: 12, name: "Tacos Mexicanos", imageUrl: "https://images.unsplash.com/photo-1552532450-fa7585021287", category: "Mexicana", rating: 4.4, deliveryFee: 7.00, deliveryTime: "35-45 min" },
  { id: 13, name: "Açaí Tropical", imageUrl: "https://images.unsplash.com/photo-1550596334-7ad447547781", category: "Saudável", rating: 4.6, deliveryFee: 3.00, deliveryTime: "20-30 min" },
  { id: 14, name: "Esfiharia Árabe", imageUrl: "https://images.unsplash.com/photo-1621995543166-51d30324866b", category: "Árabe", rating: 4.0, deliveryFee: 5.00, deliveryTime: "30-40 min" },
];

const categories = ["Todos", ...new Set(mockRestaurants.map(r => r.category))];
const ratingFilters = ["Todos", 4.0, 4.5];

const featuredBanner = {
  imageUrl: "https://images.unsplash.com/photo-1579547621804-03a0134f593b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  title: "Ganhe Recompensas Incríveis!",
  subtitle: "Acumule pontos em cada pedido e troque por descontos exclusivos. Comece a ganhar agora!",
};

const sortOptions = [
  { label: "Mais Relevantes", value: "relevance" }, 
  { label: "Melhor Avaliados", value: "rating-desc" },
  { label: "Menor Tempo de Entrega", value: "deliveryTime-asc" },
  { label: "Menor Taxa de Entrega", value: "deliveryFee-asc" },
];


export function HomePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [isLoading, setIsLoading] = useState(true);
  const [restaurants, setRestaurants] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [visibleRestaurantsCount, setVisibleRestaurantsCount] = useState(INITIAL_LOAD_COUNT);
  const [currentSort, setCurrentSort] = useState("relevance"); 
  
  const [favoriteRestaurantIds, setFavoriteRestaurantIds] = useState(() => {
    try { 
      const savedFavorites = localStorage.getItem('inka_favorite_restaurants');
      return savedFavorites ? JSON.parse(savedFavorites) : [];
    } catch (error) {
      console.error("Erro ao carregar favoritos do localStorage:", error);
      return []; 
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('inka_favorite_restaurants', JSON.stringify(favoriteRestaurantIds));
    } catch (error) {
      console.error("Erro ao salvar favoritos no localStorage:", error);
    }
  }, [favoriteRestaurantIds]); 

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setRestaurants(mockRestaurants);
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const filteredAndSortedRestaurants = restaurants
    .filter(restaurant => {
      const matchesSearch = searchTerm === "" || restaurant.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "Todos" || restaurant.category === selectedCategory;
      const matchesRating = minRating === 0 || restaurant.rating >= minRating;
      return matchesSearch && matchesCategory && matchesRating;
    })
    .slice() 
    .sort((a, b) => {
      if (currentSort === "rating-desc") {
        return b.rating - a.rating; 
      }
      if (currentSort === "deliveryTime-asc") {
        const timeA = parseInt(a.deliveryTime.split('-')[0]);
        const timeB = parseInt(b.deliveryTime.split('-')[0]);
        return timeA - timeB; 
      }
      if (currentSort === "deliveryFee-asc") {
        return a.deliveryFee - b.deliveryFee; 
      }
      return 0; 
    });

  const restaurantsWithFavoriteStatus = filteredAndSortedRestaurants.map(restaurant => ({
    ...restaurant, 
    isFavorited: favoriteRestaurantIds.includes(restaurant.id) 
  }));

  const restaurantsToDisplay = restaurantsWithFavoriteStatus.slice(0, visibleRestaurantsCount);

  const handleLoadMore = () => {
    setVisibleRestaurantsCount(prevCount => prevCount + INITIAL_LOAD_COUNT);
  };

  const hasMoreRestaurants = visibleRestaurantsCount < filteredAndSortedRestaurants.length;

  const toggleFavorite = useCallback((restaurantId) => {
    setFavoriteRestaurantIds(prevFavorites => {
      if (prevFavorites.includes(restaurantId)) {
        return prevFavorites.filter(id => id !== restaurantId);
      } else {
        return [...prevFavorites, restaurantId];
      }
    });
  }, []); 

  const handleCategoryClick = useCallback((category) => {
    setSelectedCategory(category);
    setVisibleRestaurantsCount(INITIAL_LOAD_COUNT);
  }, []);

  const handleRatingFilterClick = useCallback((rating) => {
    setMinRating(rating);
    setVisibleRestaurantsCount(INITIAL_LOAD_COUNT);
  }, []);

  const handleSortChange = useCallback((sortValue) => {
    setCurrentSort(sortValue);
    setVisibleRestaurantsCount(INITIAL_LOAD_COUNT);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedCategory("Todos");
    setMinRating(0);
    setCurrentSort("relevance");
    setVisibleRestaurantsCount(INITIAL_LOAD_COUNT);
  }, []);


  const SkeletonCard = () => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse border-2 border-gray-200">
      <div className="h-40 bg-gray-200"></div>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        <div className="flex justify-between mt-4">
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );

  // Começa o 'return' na linha 88. A correção é aqui!
  return (
    <div>
      <h1 className="text-4xl font-extrabold mb-3 text-gray-800">Bem-vindo ao Inksa Delivery!</h1>
      <p className="text-lg text-muted-foreground mb-8">Encontre o melhor restaurante para você.</p>

      <div className="relative w-full h-48 sm:h-64 md:h-72 lg:h-80 rounded-xl overflow-hidden shadow-lg mb-12">
        <img
          src={featuredBanner.imageUrl}
          alt={featuredBanner.title}
          className="w-full h-full object-cover brightness-[.3]"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <h2 className="text-white text-3xl sm:text-4xl md:text-5xl font-extrabold mb-2 leading-tight drop-shadow-lg">
            {featuredBanner.title}
          </h2>
          <p className="text-white text-base sm:text-lg md:text-xl mb-4 max-w-md drop-shadow-lg">
            {featuredBanner.subtitle}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-8 max-w-full sm:max-w-xl">
        <div className="relative flex-grow mr-4">
          <Input
            placeholder="Buscar por nome do restaurante..."
            className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setVisibleRestaurantsCount(INITIAL_LOAD_COUNT);
            }}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>

        {/* Botão que abre o FilterDrawer */}
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
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-10">
          {[...Array(INITIAL_LOAD_COUNT)].map((_, i) => ( 
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredAndSortedRestaurants.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-xl font-semibold mb-3">Nenhum restaurante encontrado.</p>
          <p className="text-base">
            Tente ajustar sua busca ou mudar os filtros.
          </p>
          {(searchTerm !== "" || selectedCategory !== "Todos" || minRating !== 0 || currentSort !== "relevance") && ( 
            <Button 
              className="mt-6" 
              variant="outline" 
              onClick={() => { 
                setSearchTerm(""); 
                setSelectedCategory("Todos"); 
                setMinRating(0);
                setVisibleRestaurantsCount(INITIAL_LOAD_COUNT);
                setCurrentSort("relevance"); 
              }}
            >
              Limpar Busca e Filtros
            </Button>
          )}
        </div>
      ) : (
        <> 
          <RestaurantList
            restaurants={restaurantsWithFavoriteStatus.slice(0, visibleRestaurantsCount)} 
            onToggleFavorite={toggleFavorite} 
          />
          {hasMoreRestaurants && ( 
            <div className="flex justify-center mt-10 mb-20"> 
              <Button 
                onClick={handleLoadMore} 
                className="px-8 py-3 text-lg font-semibold rounded-full shadow-lg"
              >
                Carregar Mais Restaurantes
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}