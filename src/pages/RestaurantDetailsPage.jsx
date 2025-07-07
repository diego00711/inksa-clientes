// Local: src/pages/RestaurantDetailsPage.jsx - VERSÃO CORRIGIDA E BÁSICA

import React from 'react';
import { useParams, Link } from 'react-router-dom'; // Importa useParams para pegar o ID da URL e Link para navegação
import { Button } from "@/components/ui/button";     // Importa o componente Button do Shadcn/ui
import { ChevronLeft } from "lucide-react";         // Importa o ícone de seta para a esquerda

// Importa os mockRestaurants para poder encontrar os detalhes do restaurante
// Em uma aplicação real, você buscaria os detalhes do restaurante de uma API
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


export function RestaurantDetailsPage() {
  const { id } = useParams(); // Obtém o ID do restaurante da URL (string)

  // Busca o restaurante pelo ID (converte o ID da URL para número inteiro)
  const restaurant = mockRestaurants.find(r => r.id === parseInt(id));

  // Caso o restaurante não seja encontrado (ID inválido ou não existe no mock)
  if (!restaurant) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Restaurante não encontrado</h1>
        <p className="text-lg text-muted-foreground">O restaurante com ID "{id}" não existe ou não foi possível carregar.</p>
        <Link to="/" className="text-primary mt-4 inline-block hover:underline">Voltar à página inicial</Link>
      </div>
    );
  }

  // Se o restaurante for encontrado, exibe seus detalhes
  return (
    <div className="py-6">
      <div className="flex items-center mb-6">
        {/* Botão de Voltar para a página inicial */}
        <Button variant="ghost" size="icon" asChild>
          <Link to="/">
            <ChevronLeft className="h-6 w-6 text-primary" /> {/* Ícone da seta */}
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        {/* Título com o nome do restaurante */}
        <h1 className="text-3xl font-bold ml-4 text-gray-800">{restaurant.name}</h1>
      </div>

      {/* Imagem do Restaurante */}
      <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-xl overflow-hidden mb-6">
        <img
          src={restaurant.imageUrl}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        {/* Você pode adicionar badges de categoria/avaliação aqui futuramente, como no card */}
      </div>

      {/* Detalhes do Restaurante */}
      <div className="space-y-4 text-lg text-gray-700">
        <p><strong>Categoria:</strong> <span className="font-semibold text-primary">{restaurant.category}</span></p>
        <p><strong>Avaliação:</strong> <span className="font-semibold text-yellow-600">{restaurant.rating} estrelas</span></p>
        <p>
          <strong>Taxa de Entrega:</strong> 
          {restaurant.deliveryFee === 0 ? (
            <span className="font-semibold text-green-600 ml-1">Grátis!</span>
          ) : (
            <span className="font-semibold ml-1">R$ {restaurant.deliveryFee.toFixed(2)}</span>
          )}
        </p>
        <p><strong>Tempo de Entrega:</strong> <span className="font-semibold ml-1">{restaurant.deliveryTime}</span></p>
        
        {/* Seção de Menu (placeholder) */}
        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-800">Cardápio</h2>
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <p className="text-muted-foreground">O cardápio completo do restaurante estará disponível aqui.</p>
          <ul className="list-disc list-inside mt-4 text-base text-gray-700">
            <li>Item de exemplo 1: Delicioso prato de massa (R$ 45,00)</li>
            <li>Item de exemplo 2: Hambúrguer especial (R$ 32,50)</li>
            <li>Item de exemplo 3: Sobremesa da casa (R$ 18,00)</li>
          </ul>
        </div>

        {/* Seção de Avaliações (placeholder) */}
        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-800">Avaliações</h2>
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <p className="text-muted-foreground">As avaliações dos clientes aparecerão em breve.</p>
          <p className="text-sm text-gray-500 mt-2">Nenhuma avaliação ainda. Seja o primeiro a avaliar!</p>
        </div>
      </div>
    </div>
  );
}