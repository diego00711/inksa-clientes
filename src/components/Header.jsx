// Local: src/components/Header.jsx

import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, LogOut, Receipt } from "lucide-react"; 
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  const { isAuthenticated, logout, user } = useAuth();
  const { totalItemsInCart } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Esta lógica agora vai funcionar, pois 'user.profile' existirá
  const userInitials = user?.profile?.first_name ? user.profile.first_name[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : "U");

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center p-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/inka-logo.png" alt="Inksa Delivery Logo" className="h-10 w-auto" />
          <span className="text-xl font-bold text-primary hidden sm:inline">
            Inksa Delivery
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          {isAuthenticated && user && ( 
            <>
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-800">
                  Olá, {user?.profile?.first_name || 'Usuário'}!
                </span>
                <span className="text-xs text-muted-foreground">
                  Bem-vindo(a) de volta
                </span>
              </div>

              <Link to="/perfil">
                <Avatar className="h-10 w-10 border-2 border-gray-200">
                  {/* Esta linha agora encontrará a URL da imagem */}
                  <AvatarImage src={user?.profile?.avatar_url} alt={user?.profile?.first_name} />
                  <AvatarFallback className="bg-gray-200 font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Link>
              
              <Link to="/meus-pedidos" className="relative">
                <Button variant="ghost" size="icon" aria-label="Meus Pedidos">
                  <Receipt className="h-5 w-5" />
                </Button>
              </Link>

              <Link to="/carrinho" className="relative">
                <Button variant="ghost" size="icon" aria-label="Carrinho">
                  <ShoppingCart className="h-5 w-5" />
                  {totalItemsInCart > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center p-0">
                      {totalItemsInCart}
                    </Badge>
                  )}
                </Button>
              </Link>

              <Button variant="ghost" size="icon" aria-label="Sair" onClick={handleLogout}>
                <LogOut className="h-5 w-5 text-red-500" />
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}