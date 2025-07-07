// Local: src/components/Header.jsx - CRIE ESTE ARQUIVO!

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Menu } from "lucide-react"; // Ícones

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo ou Nome do App */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary hover:text-primary/90 transition-colors">
          {/* Certifique-se que o arquivo 'inka-logo.png' está na sua pasta 'public/' */}
          <img src="/inka-logo.png" alt="Inksa Delivery Logo" className="h-8 w-auto" /> 
        </Link>

        {/* Navegação Principal / Ícones de Ação */}
        <nav className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/carrinho">
              <ShoppingCart className="h-5 w-5 text-primary" /> 
              <span className="sr-only">Carrinho</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link to="/perfil">
              <User className="h-5 w-5 text-primary" /> 
              <span className="sr-only">Perfil</span>
            </Link>
          </Button>
          {/* Exemplo de menu hambúrguer para futura expansão */}
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5 text-primary" />
            <span className="sr-only">Menu</span>
          </Button>
        </nav>
      </div>
    </header>
  );
}