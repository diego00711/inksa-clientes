// Local: src/components/RestaurantCard.jsx - VERSÃO DEFINITIVA E CORRIGIDA

import { Link } from "react-router-dom";
// APENAS UMA IMPORTAÇÃO PARA CADA COMPONENTE SHADCN/UI
import { Card, CardContent, CardTitle } from "@/components/ui/card"; // Caminho correto para Shadcn/ui
import { Badge } from "@/components/ui/badge";     // Caminho correto para Shadcn/ui
import { Button } from "@/components/ui/button";   // Caminho correto para Shadcn/ui
import { Star, Heart } from "lucide-react";       // Ícones Lucide

// Adicionamos as props: restaurant, isFavorited, onToggleFavorite
export function RestaurantCard({ restaurant, isFavorited, onToggleFavorite }) {
  const isFreeDelivery = restaurant.deliveryFee === 0;

  return (
    // Estilos do Card: bordas, sombras, transições, elevação no hover e posicionamento relativo
    <Card
      className="
        w-full border-2 border-muted cursor-pointer overflow-hidden rounded-xl
        shadow-md                           
        transition-all duration-300 ease-in-out 
        hover:border-primary                  
        hover:shadow-xl                       
        hover:-translate-y-1                  
        relative                             
      "
    >
      {/* O Link envolve a imagem e o conteúdo principal do card para navegação */}
      <Link to={`/restaurantes/${restaurant.id}`}> 
        <div className="relative">
          <img
            src={restaurant.imageUrl}
            alt={restaurant.name}
            className="w-full h-40 object-cover" // h-40 para altura consistente da imagem
          />
          {/* Badge de Categoria */}
          <Badge
            className="absolute top-3 left-3 bg-white text-primary font-bold border-primary border
                       px-3 py-1 text-xs rounded-full shadow-sm"
          >
            {restaurant.category}
          </Badge>

          {/* Badge de Frete Grátis - aparece SOMENTE SE deliveryFee for 0 */}
          {isFreeDelivery && (
            <Badge
              className="absolute top-3 right-3 bg-green-500 text-white font-bold
                         px-3 py-1 text-xs rounded-full shadow-md z-10" // z-10 para garantir que esteja acima
            >
              Frete Grátis
            </Badge>
          )}
        </div>

        <CardContent className="p-4 sm:p-5"> {/* Padding interno responsivo */}
          <div className="flex justify-between items-start mb-2"> {/* items-start para alinhamento superior */}
            <CardTitle className="text-lg font-extrabold truncate" title={restaurant.name}> {/* font-extrabold para mais destaque */}
              {restaurant.name}
            </CardTitle>
            {/* Div para a Avaliação (Estrela e Pontuação) */}
            <div className="flex items-center gap-1 text-primary-foreground bg-primary rounded-full px-2 py-1 ml-2">
              <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" /> {/* Estrela menor */}
              <span className="font-semibold text-xs">{restaurant.rating}</span> {/* Texto menor para a pontuação */}
            </div>
          </div>

          <div className="flex justify-between text-sm text-muted-foreground mt-3"> {/* Espaçamento superior */}
            {/* Exibição da taxa de entrega ou "Entrega Grátis!" */}
            <span>
              {isFreeDelivery ? (
                <span className="font-medium text-green-600">Entrega Grátis!</span>
              ) : (
                <span className="font-medium">{`Entrega: R$ ${restaurant.deliveryFee.toFixed(2)}`}</span>
              )}
            </span>
            <span className="text-right">{restaurant.deliveryTime}</span> {/* Alinhamento à direita */}
          </div>
        </CardContent>
      </Link> {/* Fim do Link principal do card */}

      {/* Botão de Favorito - posicionado absolutamente e clicável separadamente */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-3 right-3 z-20" // Posição no canto superior direito do card
        onClick={(e) => {
          e.preventDefault(); // Impede a navegação do Link ao clicar no coração
          e.stopPropagation(); // Impede que o clique se propague para o Link pai
          onToggleFavorite(restaurant.id); // Chama a função para alternar o favorito
        }}
      >
        <Heart 
          className={`h-6 w-6 transition-colors duration-200 ${
            isFavorited ? "text-red-500 fill-red-500" : "text-gray-400 hover:text-red-500 hover:fill-red-500"
          }`}
        />
        <span className="sr-only">Favoritar</span>
      </Button>
    </Card>
  );
}