// Local: src/components/Header.jsx - COM CONTADOR DE ITENS NO CARRINHO

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Menu } from "lucide-react";
// 1. Importe o hook useCart
import { useCart } from '../context/CartContext'; 

export function Header() {
  // 2. Use o hook useCart para obter o total de itens no carrinho
  const { totalItemsInCart } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary hover:text-primary/90 transition-colors">
          <img src="/inka-logo.png" alt="Inksa Delivery Logo" className="h-8 w-auto" /> 
        </Link>

        <nav className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/carrinho" className="relative"> {/* Adicionado relative para posicionar o contador */}
              <ShoppingCart className="h-5 w-5 text-primary" />
              <span className="sr-only">Carrinho</span>
              {/* 3. Exiba o contador de itens no carrinho */}
              {totalItemsInCart > 0 && ( // Mostra o contador apenas se for maior que 0
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs font-bold w-5 h-5 flex items-center justify-center">
                  {totalItemsInCart}
                </span>
              )}
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link to="/perfil">
              <User className="h-5 w-5 text-primary" /> 
              <span className="sr-only">Perfil</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5 text-primary" />
            <span className="sr-only">Menu</span>
          </Button>
        </nav>
      </div>
    </header>
  );
}