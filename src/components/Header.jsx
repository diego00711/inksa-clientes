import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, LogOut, Receipt, Star, Medal, Menu, X, LifeBuoy, Gift, MessageCircle } from "lucide-react";
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
    <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md sticky top-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="container mx-auto flex justify-between items-center px-2 sm:px-3 py-2 sm:py-3 gap-2">
        {/* Menu hambúrguer — mobile apenas, fixo à esquerda */}
        {isAuthenticated && user && (
          <div className="relative md:hidden" ref={menuRef}>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(v => !v)}
              className="min-h-[44px] min-w-[44px] text-white hover:bg-white/15 hover:text-white"
            >
              {/* Usa size-* (não h-/w-): o Button força [&_svg:not([class*='size-'])]:size-4,
                  então h-7 w-7 era ignorado e o ícone renderizava com 16px */}
              {menuOpen ? <X className="size-8" /> : <Menu className="size-8" />}
            </Button>

            {menuOpen && (
              <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <Link to="/avaliacoes" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700">
                  <Star className="h-5 w-5 text-gray-500" />
                  <span>Avaliações</span>
                </Link>
                <Link to="/clube" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700">
                  <Medal className="h-5 w-5 text-orange-400" />
                  <span>Clube Inksa</span>
                </Link>
                <Link to="/indique" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700">
                  <Gift className="h-5 w-5 text-orange-500" />
                  <span>Indique e ganhe</span>
                </Link>
                {/* Dois destinos diferentes, então dois nomes que dizem o
                    destino. "Falar no WhatsApp" é literal: abre o WhatsApp.
                    "Suporte" continua sendo a central de chamados, com o nome
                    que o pessoal já conhece — renomeá-la para "Meus chamados"
                    fez parecer que a página tinha sumido. */}
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); window.dispatchEvent(new CustomEvent('inksa:abrir-suporte')); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700"
                >
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  <span>Falar no WhatsApp</span>
                </button>
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
        )}

        <Link to="/" className="flex items-center gap-2 min-h-[44px]">
          <img src="/inka-logo.png" alt="Inksa Delivery Logo" className="h-9 w-9 rounded-lg object-cover" />
          <span className="text-lg font-bold text-white">
            Inksa Delivery
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-3">
          {/* SUPORTE — fora do bloco autenticado DE PROPÓSITO.
              /suporte é a central de chamados e exige login; este botão abre o
              contato direto (WhatsApp, e-mail, telefone) e precisa alcançar
              justamente quem AINDA não tem conta — o visitante que chegou pelo
              link do Instagram ou pela rádio. Antes isso morava num círculo
              flutuante que cobria o cardápio; agora mora aqui, onde não
              atrapalha a navegação. */}
          <Button
            variant="ghost"
            size="icon"
            aria-label={isAuthenticated ? 'Suporte' : 'Falar com o suporte'}
            title={isAuthenticated ? 'Suporte' : 'Falar com o suporte'}
            onClick={() => {
              // MESMO BOTÃO, MELHOR CANAL PARA CADA UM.
              //
              // Quem tem conta vai para /suporte, a central de chamados: lá o
              // histórico fica registrado, com número e resposta escrita. É o
              // que o dono do app espera ao tocar em "suporte", e foi o que
              // gerou o susto quando este ícone abria só o WhatsApp.
              //
              // Quem NÃO tem conta não consegue entrar na central (rota
              // protegida), então recebe o contato direto — que para essa
              // pessoa é o único canal existente. Mandá-la para a tela de
              // login seria transformar "preciso de ajuda" em "crie uma conta".
              if (isAuthenticated) navigate('/suporte');
              else window.dispatchEvent(new CustomEvent('inksa:abrir-suporte'));
            }}
            className="min-h-[44px] min-w-[44px] text-white hover:bg-white/15 hover:text-white"
          >
            <LifeBuoy className="h-5 w-5" />
          </Button>

          {isAuthenticated && user && (
            <>
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold text-white">
                  Olá, {userFirstName}!
                </span>
                <span className="text-xs text-white/80">
                  Bem-vindo(a) de volta
                </span>
              </div>

              <Link to="/perfil" className="min-h-[44px] min-w-[44px] flex items-center justify-center">
                <Avatar className="h-9 w-9 border-2 border-white/40">
                  <AvatarImage src={user?.avatar_url} alt={userFirstName} />
                  <AvatarFallback className="bg-white/20 text-white font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <Link to="/meus-pedidos" className="relative hidden sm:flex min-h-[44px] min-w-[44px] items-center justify-center">
                <Button variant="ghost" size="icon" aria-label="Meus Pedidos" className="text-white hover:bg-white/15 hover:text-white">
                  <Receipt className="h-5 w-5" />
                </Button>
              </Link>

              {/* Avaliações — desktop apenas */}
              <Link to="/avaliacoes" className="relative hidden md:flex min-h-[44px] min-w-[44px] items-center justify-center">
                <Button variant="ghost" size="icon" aria-label="Avaliações" className="text-white hover:bg-white/15 hover:text-white">
                  <Star className="h-5 w-5" />
                </Button>
              </Link>

              {/* Clube — desktop apenas */}
              <Link to="/clube" className="relative hidden md:flex min-h-[44px] min-w-[44px] items-center justify-center">
                <Button variant="ghost" size="icon" aria-label="Clube Inksa" className="text-white hover:bg-white/15 hover:text-white">
                  <Medal className="h-5 w-5" />
                </Button>
              </Link>

              <Link to="/carrinho" className="relative hidden sm:flex min-h-[44px] min-w-[44px] items-center justify-center">
                <Button variant="ghost" size="icon" aria-label="Carrinho" className="text-white hover:bg-white/15 hover:text-white">
                  <ShoppingCart className="h-5 w-5" />
                  {totalItemsInCart > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center p-0 text-xs">
                      {totalItemsInCart}
                    </Badge>
                  )}
                </Button>
              </Link>

              {/* Sair — desktop apenas */}
              <Button variant="ghost" size="icon" aria-label="Sair" onClick={handleLogout} className="hidden md:flex min-h-[44px] min-w-[44px] text-white hover:bg-white/15 hover:text-white">
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Visitante: o app agora abre sem conta, então o cabeçalho precisa
              de um caminho pra entrar — e do carrinho, que ele pode montar
              antes de ter conta. Sem isto ele navegaria sem saída visível. */}
          {!isAuthenticated && (
            <>
              <Link to="/carrinho" className="relative flex min-h-[44px] min-w-[44px] items-center justify-center">
                <Button variant="ghost" size="icon" aria-label="Carrinho" className="text-white hover:bg-white/15 hover:text-white">
                  <ShoppingCart className="h-5 w-5" />
                  {totalItemsInCart > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center p-0 text-xs">
                      {totalItemsInCart}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link to="/login">
                <Button className="min-h-[40px] bg-white px-4 font-bold text-orange-600 hover:bg-orange-50">
                  Entrar
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
