import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { 
  ShoppingCart, MapPin, Clock, Star, Heart, Search,
  Plus, Minus, Filter, ChefHat, Truck, User,
  CreditCard, Phone, Home, Settings, LogOut,
  CheckCircle, Package, Timer, Award, Utensils,
  ThumbsUp, MessageCircle, Share2, Gift
} from 'lucide-react'
// A logo NÃO é mais importada aqui. Usaremos o caminho direto da pasta /public
import './App.css'

// Dados simulados para restaurantes e pratos
const mockRestaurants = [
  {
    id: 1,
    name: 'Burger King (Sem Imagem)',
    category: 'Hambúrgueres',
    rating: 4.5,
    deliveryTime: '25-35 min',
    deliveryFee: 5.99,
    image: '', // Deixado vazio para testar o placeholder
    featured: true,
    dishes: [
      { id: 1, name: 'Whopper', price: 18.90, description: 'Hambúrguer com carne grelhada, alface, tomate, cebola, picles e maionese', image: 'https://via.placeholder.com/150x150/FF6B35/FFFFFF?text=Whopper' },
      { id: 2, name: 'Big King', price: 16.90, description: 'Dois hambúrgueres, alface, queijo, molho especial e cebola', image: 'https://via.placeholder.com/150x150/FF6B35/FFFFFF?text=Big+King' },
      { id: 3, name: 'Chicken Crispy', price: 15.90, description: 'Frango empanado crocante com alface e maionese', image: 'https://via.placeholder.com/150x150/FF6B35/FFFFFF?text=Chicken' }
    ]
  },
  {
    id: 2,
    name: 'Pizza Hut',
    category: 'Pizzas',
    rating: 4.3,
    deliveryTime: '30-40 min',
    deliveryFee: 4.99,
    image: 'https://via.placeholder.com/300x200/E74C3C/FFFFFF?text=Pizza+Hut',
    featured: true,
    dishes: [
      { id: 4, name: 'Pizza Margherita', price: 32.90, description: 'Molho de tomate, mussarela e manjericão fresco', image: 'https://via.placeholder.com/150x150/E74C3C/FFFFFF?text=Margherita' },
      { id: 5, name: 'Pizza Pepperoni', price: 36.90, description: 'Molho de tomate, mussarela e pepperoni', image: 'https://via.placeholder.com/150x150/E74C3C/FFFFFF?text=Pepperoni' },
      { id: 6, name: 'Pizza Quatro Queijos', price: 38.90, description: 'Mussarela, parmesão, gorgonzola e provolone', image: 'https://via.placeholder.com/150x150/E74C3C/FFFFFF?text=4+Queijos' }
    ]
  },
  {
    id: 3,
    name: 'Subway',
    category: 'Sanduíches',
    rating: 4.2,
    deliveryTime: '20-30 min',
    deliveryFee: 3.99,
    image: 'https://via.placeholder.com/300x200/00A651/FFFFFF?text=Subway',
    featured: false,
    dishes: [
      { id: 7, name: 'Subway Melt', price: 14.90, description: 'Peru, presunto, bacon, queijo e vegetais', image: 'https://via.placeholder.com/150x150/00A651/FFFFFF?text=Melt' },
    ]
  },
  {
    id: 4,
    name: 'McDonald\'s',
    category: 'Fast Food',
    rating: 4.4,
    deliveryTime: '20-30 min',
    deliveryFee: 5.99,
    image: 'https://via.placeholder.com/300x200/FFC72C/000000?text=McDonald\'s',
    featured: true,
    dishes: [
      { id: 10, name: 'Big Mac', price: 17.90, description: 'Dois hambúrgueres, alface, queijo, molho especial, cebola, picles', image: 'https://via.placeholder.com/150x150/FFC72C/000000?text=Big+Mac' },
    ]
  }
]

const mockOrders = [
  { id: '#P001', restaurant: 'Burger King', items: ['1x Whopper', '1x Batata Grande'], total: 25.80, status: 'delivered', date: '2025-06-22', time: '14:30', rating: 5 },
  { id: '#P002', restaurant: 'Pizza Hut', items: ['1x Pizza Margherita'], total: 37.89, status: 'preparing', date: '2025-06-22', time: '15:15', rating: null },
  { id: '#P003', restaurant: 'McDonald\'s', items: ['1x Big Mac', '1x Coca-Cola'], total: 22.80, status: 'on_way', date: '2025-06-22', time: '15:45', rating: null }
]

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      // Usando valores padrão para o formulário para simplificar o login
      localStorage.setItem('clientLoggedIn', 'true');
      onLogin(true);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src="/logo-cliente.png" 
              alt="Inksa Logo" 
              className="w-20 h-20 rounded-xl object-contain bg-white p-2"
            />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-gray-900">Inksa</CardTitle>
            <CardDescription className="text-lg text-gray-600">Delivery de Comida</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input id="email" type="email" placeholder="cliente@inksa.com" defaultValue="cliente@inksa.com" required onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
              <Input id="password" type="password" placeholder="••••••••" defaultValue="cli123" required onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full h-11 text-base font-medium bg-orange-600 hover:bg-orange-700" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Header({ userName, cartCount, onLogout }) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img 
            src="/logo-cliente.png" 
            alt="Inksa Logo" 
            className="w-10 h-10 rounded-lg object-contain"
          />
          <div>
            <h1 className="text-2xl font-bold text-orange-600">Inksa</h1>
            <p className="text-gray-600">Olá, {userName}!</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative"><ShoppingCart className="w-6 h-6 text-gray-600" /></div>
          <Button variant="outline" size="sm"><Settings className="w-4 h-4 mr-2" />Configurações</Button>
          <Button variant="outline" size="sm" onClick={onLogout}><LogOut className="w-4 h-4 mr-2" />Sair</Button>
        </div>
      </div>
    </header>
  );
}

function RestaurantCard({ restaurant, onSelect }) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelect(restaurant)}>
      <div className="relative">
        {restaurant.image ? (
          <img src={restaurant.image} alt={restaurant.name} className="w-full h-48 object-cover rounded-t-lg" />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-t-lg">
            <Utensils className="w-12 h-12 text-gray-400" /> 
          </div>
        )}
        {restaurant.featured && (<Badge className="absolute top-2 left-2 bg-orange-500">Destaque</Badge>)}
        <Button variant="ghost" size="sm" className="absolute top-2 right-2 bg-white/80 hover:bg-white"><Heart className="w-4 h-4" /></Button>
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{restaurant.name}</h3>
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm font-medium">{restaurant.rating}</span>
          </div>
        </div>
        <p className="text-gray-600 text-sm mb-3">{restaurant.category}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1"><Clock className="w-4 h-4" /><span>{restaurant.deliveryTime}</span></div>
          <div className="flex items-center space-x-1"><Truck className="w-4 h-4" /><span>R$ {restaurant.deliveryFee.toFixed(2)}</span></div>
        </div>
      </CardContent>
    </Card>
  );
}

function DishCard({ dish, onAddToCart }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex space-x-4">
          <img src={dish.image} alt={dish.name} className="w-20 h-20 object-cover rounded-lg" />
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-900 mb-1">{dish.name}</h4>
            <p className="text-gray-600 text-sm mb-2">{dish.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-orange-600">R$ {dish.price.toFixed(2)}</span>
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={() => onAddToCart(dish)}><Plus className="w-4 h-4 mr-1" />Adicionar</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderCard({ order }) {
    // Código original do OrderCard restaurado
    const getStatusColor = (status) => {
        switch (status) {
          case 'preparing': return 'bg-yellow-100 text-yellow-800'
          case 'on_way': return 'bg-blue-100 text-blue-800'
          case 'delivered': return 'bg-green-100 text-green-800'
          default: return 'bg-gray-100 text-gray-800'
        }
    }
    const getStatusText = (status) => {
        switch (status) {
          case 'preparing': return 'Preparando'
          case 'on_way': return 'A caminho'
          case 'delivered': return 'Entregue'
          default: return 'Desconhecido'
        }
    }
    const getStatusIcon = (status) => {
        switch (status) {
          case 'preparing': return <ChefHat className="w-4 h-4" />
          case 'on_way': return <Truck className="w-4 h-4" />
          case 'delivered': return <CheckCircle className="w-4 h-4" />
          default: return <Package className="w-4 h-4" />
        }
    }
    return (
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{order.id}</h3>
                <p className="text-gray-600">{order.restaurant}</p>
                <p className="text-sm text-gray-500">{order.date} às {order.time}</p>
              </div>
              <Badge className={getStatusColor(order.status)}>
                {getStatusIcon(order.status)}
                <span className="ml-1">{getStatusText(order.status)}</span>
              </Badge>
            </div>
          </CardContent>
        </Card>
    );
}

function ClientApp({ onLogout }) {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddToCart = (dish) => setCart([...cart, { ...dish, quantity: 1, id: Date.now() }]);
  const handleSelectRestaurant = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setActiveTab('restaurant');
  };

  const filteredRestaurants = mockRestaurants.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedRestaurant) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header userName="João Silva" cartCount={cart.length} onLogout={onLogout} />
        <main className="p-6">
          <div className="mb-6">
            <Button variant="outline" onClick={() => setSelectedRestaurant(null)} className="mb-4">← Voltar</Button>
            <div className="relative mb-6">
              {selectedRestaurant.image ? (
                <img src={selectedRestaurant.image} alt={selectedRestaurant.name} className="w-full h-64 object-cover rounded-lg" />
              ) : (
                <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded-lg"><Utensils className="w-24 h-24 text-gray-400" /></div>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Cardápio</h2>
            {selectedRestaurant.dishes.map(dish => <DishCard key={dish.id} dish={dish} onAddToCart={handleAddToCart} />)}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userName="João Silva" cartCount={cart.length} onLogout={onLogout} />
      <main className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="home">Início</TabsTrigger>
            <TabsTrigger value="search">Buscar</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-6">
            <div className="flex items-center justify-between"><h2 className="text-2xl font-bold text-gray-900">Restaurantes em Destaque</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockRestaurants.filter(r => r.featured).map(r => <RestaurantCard key={r.id} restaurant={r} onSelect={handleSelectRestaurant} />)}
            </div>
            <div className="flex items-center justify-between"><h2 className="text-2xl font-bold text-gray-900">Todos os Restaurantes</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockRestaurants.map(r => <RestaurantCard key={r.id} restaurant={r} onSelect={handleSelectRestaurant} />)}
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Buscar Restaurantes</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input placeholder="Buscar por restaurante ou categoria..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-12 text-base" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRestaurants.map(r => <RestaurantCard key={r.id} restaurant={r} onSelect={handleSelectRestaurant} />)}
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Meus Pedidos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockOrders.map(order => <OrderCard key={order.id} order={order} />)}
            </div>
          </TabsContent>
          
        </Tabs>
      </main>
    </div>
  );
}


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem('clientLoggedIn') === 'true';
    if (loggedIn) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (status) => {
    setIsLoggedIn(status);
  };

  const handleLogout = () => {
    localStorage.removeItem('clientLoggedIn');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <ClientApp onLogout={handleLogout} />;
}

export default App;