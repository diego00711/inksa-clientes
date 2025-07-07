// Local: src/components/Header.jsx

import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Menu, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext"; // 1. Importamos o hook do carrinho
import { Badge } from "./ui/badge"; // 2. Importamos o Badge para o contador

export function Header() {
  const { isAuthenticated, logout } = useAuth();
  const { totalItemsInCart } = useCart(); // 3. Pegamos o total de itens do contexto
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center p-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/inka-logo.png" alt="Inksa Delivery Logo" className="h-16 w-auto" />
          <span className="text-xl font-bold text-primary hidden sm:inline">
            Inksa Delivery
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {isAuthenticated && (
            <>
              {/* 4. Alteramos o botão do carrinho para incluir o contador */}
              <Link to="/carrinho" className="relative">
                <Button variant="ghost" size="icon" aria-label="Carrinho">
                  <ShoppingCart className="h-5 w-5" />
                  {/* O contador só aparece se houver itens no carrinho */}
                  {totalItemsInCart > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center p-0"
                    >
                      {totalItemsInCart}
                    </Badge>
                  )}
                </Button>
              </Link>

              <Link to="/perfil">
                <Button variant="ghost" size="icon" aria-label="Perfil">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" aria-label="Sair" onClick={handleLogout}>
                <LogOut className="h-5 w-5 text-red-500" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" aria-label="Menu" className="sm:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </nav>
      </div>
    </header>
  );
}