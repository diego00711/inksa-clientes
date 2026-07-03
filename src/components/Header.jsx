import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, LogOut, Receipt, Star, Trophy, Medal, Menu, X, LifeBuoy } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  const { isAuthenticated, logout, user } = useAuth();
  const { totalItemsInCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('touchstart', onClick);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('touchstart', onClick);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userFirstName = user?.first_name || 'Usuário';
  const userInitials = userFirstName ? userFirstName[0].toUpperCase() : "U";

  return (
    <header className="bg-white shadow-md sticky top-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
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

              <Link to="/meus-pedidos" className="relative hidden sm:flex min-h-[44px] min-w-[44px] items-center justify-center">
                <Button variant="ghost" size="icon" aria-label="Meus Pedidos">
                  <Receipt className="h-5 w-5" />
                </Button>
              </Link>

              {/* Avaliações — desktop apenas */}
              <Link to="/avaliacoes" className="relative hidden md:flex min-h-[44px] min-w-[44px] items-center justify-center">
                <Button variant="ghost" size="icon" aria-label="Avaliações">
                  <Star className="h-5 w-5" />
                </Button>
              </Link>

              {/* Gamificação — desktop apenas */}
              <Link to="/gamificacao" className="relative hidden md:flex min-h-[44px] min-w-[44px] items-center justify-center">
                <Button variant="ghost" size="icon" aria-label="Minha Pontuação">
                  <Trophy className="h-5 w-5 text-amber-500" />
                </Button>
              </Link>

              {/* Clube — desktop apenas */}
              <Link to="/clube" className="relative hidden md:flex min-h-[44px] min-w-[44px] items-center justify-center">
                <Button variant="ghost" size="icon" aria-label="Clube Inksa">
                  <Medal className="h-5 w-5 text-orange-400" />
                </Button>
              </Link>

              <Link to="/carrinho" className="relative hidden sm:flex min-h-[44px] min-w-[44px] items-center justify-center">
                <Button variant="ghost" size="icon" aria-label="Carrinho">
                  <ShoppingCart className="h-5 w-5" />
                  {totalItemsInCart > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center p-0 text-xs">
                      {totalItemsInCart}
                    </Badge>
                  )}
                </Button>
              </Link>

              {/* Menu hambúrguer — mobile apenas */}
              <div className="relative md:hidden" ref={menuRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Abrir menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen(v => !v)}
                  className="min-h-[44px] min-w-[44px]"
                >
                  {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <Link to="/avaliacoes" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700">
                      <Star className="h-5 w-5 text-gray-500" />
                      <span>Avaliações</span>
                    </Link>
                    <Link to="/gamificacao" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      <span>Minha Pontuação</span>
                    </Link>
                    <Link to="/clube" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700">
                      <Medal className="h-5 w-5 text-orange-400" />
                      <span>Clube Inksa</span>
                    </Link>
                    <Link to="/suporte" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700">
                      <LifeBuoy className="h-5 w-5 text-blue-500" />
                      <span>Suporte</span>
                    </Link>
                    <div className="h-px bg-gray-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Sair</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Sair — desktop apenas */}
              <Button variant="ghost" size="icon" aria-label="Sair" onClick={handleLogout} className="hidden md:flex min-h-[44px] min-w-[44px]">
                <LogOut className="h-5 w-5 text-red-500" />
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
