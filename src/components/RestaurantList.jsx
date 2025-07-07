// Local: src/components/RestaurantList.jsx

import { RestaurantCard } from "./RestaurantCard";

// Este componente agora recebe 'onToggleFavorite'
export function RestaurantList({ restaurants, onToggleFavorite }) { // <-- onToggleFavorite recebido aqui
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-10">
      {restaurants.map((restaurant) => (
        <RestaurantCard
          key={restaurant.id}
          restaurant={restaurant}
          // Passamos as novas props para cada RestaurantCard
          isFavorited={restaurant.isFavorited} // Esta prop já vem do HomePage (mapeada e calculada)
          onToggleFavorite={onToggleFavorite} // <-- onToggleFavorite repassado para RestaurantCard
        />
      ))}
    </div>
  );
}