import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, LogOut, Receipt, Star, Trophy, Medal } from "lucide-react";
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

  // ✅ CORREÇÃO: Usa 'user.first_name' que é o campo correto vindo da API.
  const userFirstName = user?.first_name || 'Usuário';
  const userInitials = userFirstName ? userFirstName[0].toUpperCase() : "U";

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center px-2 sm:px-3 py-2 sm:py-3">
        <Link to="/" className="flex items-center gap-2 min-h-[44px]">
          <img src="/inka-logo.png" alt="Inksa Delivery Logo" className="h-9 w-auto" />
          <span className="text-lg font-bold text-primary hidden sm:inline">
            Inksa Delivery
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-3">
          {isAuthenticated && user && (
            <>
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-800">
                  {/* ✅ CORREÇÃO: Exibe o primeiro nome do usuário */}
                  Olá, {userFirstName}!
                </span>
                <span className="text-xs text-muted-foreground">
                  Bem-vindo(a) de volta
                </span>
              </div>

              <Link to="/perfil" className="min-h-[44px] min-w-[44px] flex items-center justify-center">
                <Avatar className="h-9 w-9 border-2 border-gray-200">
                  <AvatarImage src={user?.avatar_url} alt={userFirstName} />
                  <AvatarFallback className="bg-gray-200 font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <Link to="/meus-pedidos" className="relative min-h-[44px] min-w-[44px] flex items-center justify-center">
                <Button variant="ghost" size="icon" aria-label="Meus Pedidos">
                  <Receipt className="h-5 w-5" />
                </Button>
              </Link>

              {/* NOVO LINK: Central de Avaliações */}
              <Link to="/avaliacoes" className="relative hidden sm:flex min-h-[44px] min-w-[44px] items-center justify-center">
                <Button variant="ghost" size="icon" aria-label="Avaliações">
                  <Star className="h-5 w-5" />
                </Button>
              </Link>

              {/* NOVO LINK: Gamificação / Pontos */}
              <Link to="/gamificacao" className="relative hidden sm:flex min-h-[44px] min-w-[44px] items-center justify-center">
                <Button variant="ghost" size="icon" aria-label="Minha Pontuação">
                  <Trophy className="h-5 w-5 text-amber-500" />
                </Button>
              </Link>

              {/* Clube Inksa */}
              <Link to="/clube" className="relative hidden sm:flex min-h-[44px] min-w-[44px] items-center justify-center">
                <Button variant="ghost" size="icon" aria-label="Clube Inksa">
                  <Medal className="h-5 w-5 text-orange-400" />
                </Button>
              </Link>

              <Link to="/carrinho" className="relative min-h-[44px] min-w-[44px] flex items-center justify-center">
                <Button variant="ghost" size="icon" aria-label="Carrinho">
                  <ShoppingCart className="h-5 w-5" />
                  {totalItemsInCart > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center p-0 text-xs">
                      {totalItemsInCart}
                    </Badge>
                  )}
                </Button>
              </Link>

              <Button variant="ghost" size="icon" aria-label="Sair" onClick={handleLogout} className="min-h-[44px] min-w-[44px]">
                <LogOut className="h-5 w-5 text-red-500" />
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
