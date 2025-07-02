import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { 
  ShoppingCart, MapPin, Clock, Star, Heart, Search,
  Plus, Minus, Filter, ChefHat, Truck, User,
  CreditCard, Phone, Home, Settings, LogOut,
  CheckCircle, Package, Timer, Award, Utensils,
  ThumbsUp, MessageCircle, Share2, Gift
} from 'lucide-react';
import logoImg from './assets/logo-cliente.png';
import './App.css';

// Dados simulados
const mockRestaurants = [
  {
    id: 1, name: 'Burger King', category: 'Hambúrgueres', rating: 4.5, deliveryTime: '25-35 min',
    deliveryFee: 5.99, image: '', featured: true,
    dishes: [
      { id: 1, name: 'Whopper', price: 18.90, description: 'Hambúrguer grelhado, alface, tomate, picles.', image: 'https://via.placeholder.com/150' },
    ]
  },
  {
    id: 2, name: 'Pizza Hut', category: 'Pizzas', rating: 4.3, deliveryTime: '30-40 min',
    deliveryFee: 4.99, image: 'https://via.placeholder.com/300x200/E74C3C/FFFFFF?text=Pizza+Hut', featured: true,
    dishes: [
      { id: 4, name: 'Pizza Margherita', price: 32.90, description: 'Molho de tomate, mussarela e manjericão.', image: 'https://via.placeholder.com/150' },
    ]
  },
];

const mockOrders = [
  { id: '#P001', restaurant: 'Burger King', items: ['1x Whopper', '1x Batata'], total: 25.80, status: 'delivered', date: '2025-06-22', time: '14:30', rating: 5 },
  { id: '#P002', restaurant: 'Pizza Hut', items: ['1x Pizza Margherita'], total: 37.89, status: 'preparing', date: '2025-06-22', time: '15:15', rating: null },
];

// Componente de Login
function LoginPage({ onLogin }) {
  // ... (código do LoginPage como estava antes)
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <img src={logoImg} alt="Inksa Logo" className="w-24 h-24 mx-auto mb-4" />
          <CardTitle>Login</CardTitle>
          <CardDescription>Acesse sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="seu@email.com" defaultValue="cliente@inksa.com" />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" defaultValue="cli123" />
            </div>
            <Button type="submit" className="w-full">Entrar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de Header
function Header({ userName, cartCount, onLogout }) {
  // ... (código do Header como estava antes)
  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
            <img src={logoImg} alt="Inksa Logo" className="h-10 w-10"/>
            <h1 className="text-xl font-bold">Olá, {userName}!</h1>
        </div>
        <div className="flex items-center gap-4">
            <ShoppingCart />
            <Button onClick={onLogout}>Sair</Button>
        </div>
    </header>
  );
}

// Componente de Card de Restaurante
function RestaurantCard({ restaurant, onSelect }) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelect(restaurant)}>
      <div className="relative">
        {restaurant.image ? (
          <img 
            src={restaurant.image} 
            alt={restaurant.name}
            className="w-full h-48 object-cover rounded-t-lg"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-t-lg">
            <Utensils className="w-12 h-12 text-gray-400" /> 
          </div>
        )}
        {restaurant.featured && (
          <Badge className="absolute top-2 left-2 bg-orange-500">Destaque</Badge>
        )}
        <Button 
          variant="ghost" 
          size="sm" 
          className="absolute top-2 right-2 bg-white/80 hover:bg-white"
        >
          <Heart className="w-4 h-4" />
        </Button>
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold">{restaurant.name}</h3>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm font-medium">{restaurant.rating}</span>
          </div>
        </div>
        <p className="text-gray-600 text-sm mb-3">{restaurant.category}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-1"><Clock className="w-4 h-4" /><span>{restaurant.deliveryTime}</span></div>
            <div className="flex items-center gap-1"><Truck className="w-4 h-4" /><span>R$ {restaurant.deliveryFee.toFixed(2)}</span></div>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente de Card de Prato
function DishCard({ dish, onAddToCart }) {
    // ... (código do DishCard como estava antes)
    return <div>{dish.name}</div>;
}

// Componente de Card de Pedido
function OrderCard({ order }) {
    // ... (código do OrderCard como estava antes)
    return <div>{order.id}</div>;
}

// Componente Principal
function ClientApp({ onLogout }) {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  const handleSelectRestaurant = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setActiveTab('restaurant');
  };

  if (selectedRestaurant) {
    return (
      <div>
        <Header userName="Usuário" cartCount={0} onLogout={onLogout} />
        <main className="p-6">
          <Button onClick={() => setSelectedRestaurant(null)}>← Voltar</Button>
          <h1 className="text-2xl font-bold my-4">{selectedRestaurant.name}</h1>
          {/* Aqui entraria a lista de pratos, etc. */}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userName="Usuário" cartCount={0} onLogout={onLogout} />
      <main className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="home">Início</TabsTrigger>
            <TabsTrigger value="search">Buscar</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
          </TabsList>
          <TabsContent value="home" className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Restaurantes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockRestaurants.map(restaurant => (
                <RestaurantCard 
                  key={restaurant.id} 
                  restaurant={restaurant} 
                  onSelect={handleSelectRestaurant}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// Componente de Gerenciamento de Estado
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <ClientApp onLogout={handleLogout} />;
}

export default App;