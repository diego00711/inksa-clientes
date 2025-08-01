// Local: src/components/RestaurantCard.jsx

import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, Clock } from "lucide-react"; 

export function RestaurantCard({ restaurant }) {
  // Para depuração: podemos ver todos os dados que o card recebe
  // console.log("Dados recebidos pelo card:", restaurant); 

  // --- LÓGICA DE DADOS ---
  const deliveryFee = restaurant.delivery_fee ?? 0;
  const isFreeDelivery = deliveryFee === 0;
  const ratingValue = restaurant.rating ?? 0;
  const deliveryTime = restaurant.delivery_time;
  const category = restaurant.category ?? "Restaurante";
  const imageUrl = restaurant.logo_url || 'https://via.placeholder.com/400x200?text=Inksa';
  const isOpen = restaurant.is_open;
  const deliveryType = restaurant.delivery_type;
  
  // ✅ CORREÇÃO: Garantindo que pegamos a distância corretamente
  const distance = restaurant.distance_km;

  // --- COMPONENTE INTERNO PARA O TEXTO DA ENTREGA ---
  const DeliveryInfo = () => {
    if (deliveryType === 'platform') {
      return <span className="font-medium text-blue-600">Entrega a calcular</span>;
    }
    if (isFreeDelivery) {
      return <span className="font-medium text-green-600">Entrega Grátis</span>;
    }
    return `Entrega: R$ ${parseFloat(deliveryFee).toFixed(2)}`;
  };

  // --- COMPONENTE WRAPPER ---
  const CardWrapper = ({ children }) => {
    if (isOpen) {
      return <Link to={`/restaurantes/${restaurant.id}`}>{children}</Link>;
    }
    return <div className="cursor-not-allowed">{children}</div>;
  };

  return (
    <CardWrapper>
      <Card 
        className={`
          w-full border-2 border-transparent 
          ${isOpen ? 'hover:border-primary' : 'grayscale opacity-60'} 
          transition-all duration-300 group overflow-hidden rounded-xl shadow-sm
        `}
      >
        <div className="relative">
          <img
            src={imageUrl}
            alt={restaurant.restaurant_name}
            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          <Badge 
            className={`
              absolute top-3 right-3 text-xs font-bold tracking-wider
              ${isOpen ? 'bg-green-600 text-white' : 'bg-gray-700 text-white'}
            `}
          >
            {isOpen ? 'ABERTO' : 'FECHADO'}
          </Badge>

          <Badge className="absolute top-3 left-3 bg-white text-primary font-bold border-primary border px-2 py-0.5 text-xs rounded-full shadow-md">
            {category}
          </Badge>
        </div>
        <CardContent className="p-3">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-base font-bold truncate" title={restaurant.restaurant_name}>
              {restaurant.restaurant_name}
            </h3>
            <div className="flex items-center gap-1 text-orange-500">
              <Star className="w-4 h-4 fill-orange-500" />
              <span className="font-semibold text-sm">
                {parseFloat(ratingValue).toFixed(1)}
              </span>
            </div>
          </div>
          {/* ✅ CORREÇÃO: Seção inferior com a distância incluída */}
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
            <span>
              <DeliveryInfo />
            </span>
            
            {/* Exibe a distância apenas se ela existir */}
            {distance !== undefined && distance !== null && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {distance} km
                </span>
              </>
            )}

            {/* Exibe o tempo de entrega apenas se ele existir */}
            {deliveryTime && (
                <>
                 <span>•</span>
                 <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {deliveryTime}
                 </span>
                </>
            )}
          </div>
        </CardContent>
      </Card>
    </CardWrapper>
  );
}