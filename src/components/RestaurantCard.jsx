// Local: src/components/RestaurantCard.jsx

import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, Clock, Heart, Info } from "lucide-react"; 

export function RestaurantCard({ restaurant }) {
  // --- LÓGICA DE DADOS ---
  const deliveryFee = restaurant.delivery_fee ?? 0;
  const isFreeDelivery = deliveryFee === 0;
  const ratingValue = restaurant.rating ?? 0;
  const deliveryTime = restaurant.delivery_time;
  const category = restaurant.category ?? "Restaurante";
  const imageUrl = restaurant.logo_url || 'https://via.placeholder.com/400x240?text=Inksa+Delivery';
  const isOpen = restaurant.is_open;
  const deliveryType = restaurant.delivery_type;
  const distance = restaurant.distance_km;
  const totalReviews = restaurant.total_reviews ?? 0;

  // --- COMPONENTE INTERNO PARA O TEXTO DA ENTREGA ---
  const DeliveryInfo = () => {
    if (deliveryType === 'platform') {
      return (
        <span className="flex items-center gap-1 font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs">
          <Info className="w-3 h-3" />
          Entrega a calcular
        </span>
      );
    }
    if (isFreeDelivery) {
      return (
        <span className="flex items-center gap-1 font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs">
          Entrega Grátis
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-full text-xs">
        R$ {parseFloat(deliveryFee).toFixed(2)}
      </span>
    );
  };

  // --- COMPONENTE WRAPPER ---
  const CardWrapper = ({ children }) => {
    if (isOpen) {
      return (
        <Link 
          to={`/restaurantes/${restaurant.id}`}
          className="block transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
        >
          {children}
        </Link>
      );
    }
    return (
      <div className="cursor-not-allowed transform transition-all duration-200">
        {children}
      </div>
    );
  };

  return (
    <CardWrapper>
      <Card 
        className={`
          w-full border border-gray-100 bg-white
          ${isOpen 
            ? 'hover:border-orange-200 hover:shadow-md' 
            : 'grayscale opacity-70'
          } 
          transition-all duration-300 overflow-hidden rounded-2xl shadow-sm
          relative group
        `}
      >
        {/* Container da Imagem */}
        <div className="relative overflow-hidden">
          <img
            src={imageUrl}
            alt={restaurant.restaurant_name}
            className={`
              w-full h-48 object-cover transition-transform duration-500
              ${isOpen ? 'group-hover:scale-110' : ''}
            `}
            loading="lazy"
          />
          
          {/* Overlay gradiente sutil */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          
          {/* Badge de Status */}
          <Badge 
            className={`
              absolute top-3 right-3 text-xs font-bold tracking-wider shadow-lg
              ${isOpen 
                ? 'bg-green-500 text-white border-green-600' 
                : 'bg-red-500 text-white border-red-600'
              }
            `}
          >
            {isOpen ? 'ABERTO' : 'FECHADO'}
          </Badge>

          {/* Badge da Categoria */}
          <Badge className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-orange-600 font-semibold border border-orange-200 px-3 py-1 text-xs rounded-full shadow-md">
            {category}
          </Badge>

          {/* Botão de Favorito (placeholder) */}
          <button 
            className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Lógica para adicionar/remover favoritos aqui
            }}
          >
            <Heart className="w-4 h-4 text-gray-600 hover:text-red-500 transition-colors" />
          </button>
        </div>

        {/* Conteúdo do Card */}
        <CardContent className="p-4 space-y-3">
          {/* Header com Nome e Rating */}
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 truncate leading-tight" title={restaurant.restaurant_name}>
                {restaurant.restaurant_name}
              </h3>
            </div>
            
            {/* Rating */}
            <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-full shrink-0">
              <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
              <span className="font-bold text-sm text-orange-600">
                {parseFloat(ratingValue).toFixed(1)}
              </span>
              {totalReviews > 0 && (
                <span className="text-xs text-gray-500 ml-1">
                  ({totalReviews})
                </span>
              )}
            </div>
          </div>

          {/* Informações de Entrega e Distância */}
          <div className="space-y-2">
            {/* Primeira linha: Taxa de entrega e Distância */}
            <div className="flex items-center justify-between gap-2">
              <DeliveryInfo />
              
              {/* Distância - vamos sempre mostrar para debug */}
              <div className="flex gap-2">
                {distance !== undefined && distance !== null && distance !== "" ? (
                  <span className="flex items-center gap-1 text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    <MapPin className="w-3 h-3" />
                    {distance} km
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                    <MapPin className="w-3 h-3" />
                    Calculando...
                  </span>
                )}
              </div>
            </div>
            
            {/* Segunda linha: Tempo de entrega */}
            {deliveryTime && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{deliveryTime}</span>
              </div>
            )}
          </div>

          {/* Indicador de Hover (apenas para lojas abertas) */}
          {isOpen && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">
              <div className="text-xs text-orange-600 font-medium bg-orange-50 py-2 rounded-lg">
                Clique para ver o cardápio →
              </div>
            </div>
          )}
        </CardContent>

        {/* Overlay para lojas fechadas */}
        {!isOpen && (
          <div className="absolute inset-0 bg-gray-900/20 flex items-center justify-center rounded-2xl">
            <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
              <span className="text-sm font-medium text-gray-700">
                Fechado no momento
              </span>
            </div>
          </div>
        )}
      </Card>
    </CardWrapper>
  );
}
