// Local: src/pages/RestaurantDetailsPage.jsx - EXIBINDO ITENS DO CARDÁPIO

import React from 'react';
import { useParams, Link } from 'react-router-dom'; 
import { Button } from "@/components/ui/button";     
import { ChevronLeft, Star } from "lucide-react"; 

// IMPORTANTE: Adicione mockRestaurants aqui também para que RestaurantDetailsPage possa acessá-lo.
// Idealmente, em uma aplicação real, você buscaria os detalhes e o cardápio do restaurante de uma API.
const mockRestaurants = [
  { 
    id: 1, 
    name: "Pizzaria Sabor Divino", 
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591", 
    category: "Pizza", 
    rating: 4.8, 
    deliveryFee: 5.00, 
    deliveryTime: "30-45 min",
    menuItems: [ 
      { id: 'p1', name: "Pizza Calabresa", description: "Muçarela, calabresa, cebola e orégano.", price: 45.00, imageUrl: "https://images.unsplash.com/photo-1596200236473-b78f844f24c3?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 'p2', name: "Pizza Marguerita", description: "Muçarela, tomate, manjericão e azeite.", price: 42.00, imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 'p3', name: "Pizza Frango c/ Catupiry", description: "Muçarela, frango desfiado e catupiry.", price: 48.00, imageUrl: "https://images.unsplash.com/photo-1564759226500-111059f33887?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 'b1', name: "Coca-Cola Lata", description: "Refrigerante 350ml.", price: 7.00, imageUrl: "https://images.unsplash.com/photo-1627962635489-08bf1841364d" },
    ]
  },
  { 
    id: 2, 
    name: "Burger-Mania", 
    imageUrl: "https://images.unsplash.com/photo-1571091718767-18b5b1457add", 
    category: "Lanches", 
    rating: 4.9, 
    deliveryFee: 0.00, 
    deliveryTime: "25-35 min",
    menuItems: [ 
      { id: 'h1', name: "Hambúrguer Clássico", description: "Pão, carne, queijo, alface, tomate e maionese.", price: 32.00, imageUrl: "https://images.unsplash.com/photo-1568901346379-8ce8e6042132?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 'h2', name: "Cheeseburguer Duplo", description: "Dois hambúrgueres, queijo cheddar, picles e cebola.", price: 45.00, imageUrl: "https://images.unsplash.com/photo-1594212699903-ec8a3ecc439c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 'h3', name: "Batata Frita G", description: "Porção grande de batatas fritas.", price: 15.00, imageUrl: "https://images.unsplash.com/photo-1616788880468-b76e1a477382?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 'b2', name: "Guaraná Antarctica", description: "Refrigerante 350ml.", price: 7.00, imageUrl: "https://images.unsplash.com/photo-1627962635489-08bf1841364d" },
    ]
  },
  { 
    id: 3, 
    name: "Sushi House", 
    imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c", 
    category: "Japonesa", 
    rating: 4.7, 
    deliveryFee: 7.00, 
    deliveryTime: "45-60 min",
    menuItems: [ 
      { id: 's1', name: "Combinado 20 peças", description: "Mix de sushis e sashimis variados.", price: 89.00, imageUrl: "https://images.unsplash.com/photo-1563612116035-7c152a41d6b0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 's2', name: "Temaki Salmão", description: "Cone de alga com arroz, salmão e cream cheese.", price: 35.00, imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 's3', name: "Gyoza (6 unidades)", description: "Pastéis japoneses de carne suína.", price: 28.00, imageUrl: "https://images.unsplash.com/photo-1628172905295-8e27c191a2a4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 'b3', name: "H2OH! Limoneto", description: "Bebida leve 500ml.", price: 8.00, imageUrl: "https://images.unsplash.com/photo-1627962635489-08bf1841364d" },
    ]
  },
  { id: 4, name: "Cantina da Nona", imageUrl: "https://images.unsplash.com/photo-1598866594243-7b36de3ca16c", category: "Italiana", rating: 4.6, deliveryFee: 6.00, deliveryTime: "40-50 min", menuItems: [] }, 
  { id: 5, name: "Padaria Doce Pão", imageUrl: "https://images.unsplash.com/photo-1627962635489-08bf1841364d", category: "Padaria", rating: 4.1, deliveryFee: 3.00, deliveryTime: "20-30 min", menuItems: [] },
  { id: 6, name: "Churrascaria Gaúcha", imageUrl: "https://images.unsplash.com/photo-1610444738580-044237f3747f", category: "Churrasco", rating: 3.9, deliveryFee: 8.00, deliveryTime: "45-60 min", menuItems: [] },
  { id: 7, name: "Temaki Express", imageUrl: "https://images.unsplash.com/photo-1563612116035-7c152a41d6b0", category: "Japonesa", rating: 4.5, deliveryFee: 6.00, deliveryTime: "35-45 min", menuItems: [] },
  { id: 8, name: "Café da Esquina", imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93", category: "Cafeteria", rating: 4.2, deliveryFee: 4.00, deliveryTime: "20-30 min", menuItems: [] },
  { id: 9, name: "Doceria Encantada", imageUrl: "https://images.unsplash.com/photo-1587314168485-3236d6710814", category: "Doces", rating: 4.9, deliveryFee: 5.00, deliveryTime: "30-40 min", menuItems: [] },
  { id: 10, name: "Comida Caseira da Vovó", imageUrl: "https://images.unsplash.com/photo-1512621776951-a5732159c961", category: "Brasileira", rating: 4.3, deliveryFee: 6.00, deliveryTime: "40-55 min", menuItems: [] },
  { id: 11, name: "Hamburgueria Artesanal", imageUrl: "https://images.unsplash.com/photo-1568901346379-8ce8e6042132", category: "Lanches", rating: 4.7, deliveryFee: 0.00, deliveryTime: "25-35 min", menuItems: [] },
  { id: 12, name: "Tacos Mexicanos", imageUrl: "https://images.unsplash.com/photo-1552532450-fa7585021287", category: "Mexicana", rating: 4.4, deliveryFee: 7.00, deliveryTime: "35-45 min", menuItems: [] },
  { id: 13, name: "Açaí Tropical", imageUrl: "https://images.unsplash.com/photo-1550596334-7ad447547781", category: "Saudável", rating: 4.6, deliveryFee: 3.00, deliveryTime: "20-30 min", menuItems: [] },
  { id: 14, name: "Esfiharia Árabe", imageUrl: "https://images.unsplash.com/photo-1621995543166-51d30324866b", category: "Árabe", rating: 4.0, deliveryFee: 5.00, deliveryTime: "30-40 min", menuItems: [] },
];

export function RestaurantDetailsPage() {
  const { id } = useParams(); 

  const restaurant = mockRestaurants.find(r => r.id === parseInt(id));

  if (!restaurant) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Restaurante não encontrado</h1>
        <p className="text-lg text-muted-foreground">O restaurante com ID "{id}" não existe ou não foi possível carregar.</p>
        <Link to="/" className="text-primary mt-4 inline-block hover:underline">Voltar à página inicial</Link>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/">
            <ChevronLeft className="h-6 w-6 text-accent" /> {/* Ícone da seta com cor accent */}
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold ml-4 text-gray-800">{restaurant.name}</h1>
      </div>

      <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-xl overflow-hidden mb-6">
        <img
          src={restaurant.imageUrl}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="space-y-4 text-lg text-gray-700">
        <p><strong>Categoria:</strong> <span className="font-semibold text-primary">{restaurant.category}</span></p>
        <p className="flex items-center gap-1"> {/* Flex para alinhar estrela e texto */}
          <strong>Avaliação:</strong> 
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-400" /> {/* Ícone de estrela */}
          <span className="font-semibold text-gray-800">{restaurant.rating} estrelas</span>
        </p>
        <p>
          <strong>Taxa de Entrega:</strong> 
          {restaurant.deliveryFee === 0 ? (
            <span className="font-semibold text-green-600 ml-1">Grátis!</span>
          ) : (
            <span className="font-semibold ml-1">R$ {restaurant.deliveryFee.toFixed(2)}</span>
          )}
        </p>
        <p><strong>Tempo de Entrega:</strong> <span className="font-semibold ml-1">{restaurant.deliveryTime}</span></p>
        
        {/* NOVO: Seção de Cardápio Real */}
        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-800">Cardápio</h2>
        {restaurant.menuItems && restaurant.menuItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Layout de grid para itens de menu */}
            {restaurant.menuItems.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex gap-4 items-center">
                <img 
                  src={item.imageUrl || 'https://via.placeholder.com/80x80?text=Item'} // Imagem do item ou placeholder
                  alt={item.name} 
                  className="w-20 h-20 object-cover rounded-md"
                />
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-gray-800">{item.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                  <p className="text-md font-bold text-primary">R$ {item.price.toFixed(2)}</p>
                </div>
                {/* Futuramente, aqui virá o seletor de quantidade e o botão "Adicionar" */}
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">Adicionar</Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-muted-foreground text-center">
            <p>Este restaurante não possui um cardápio disponível no momento.</p>
          </div>
        )}

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