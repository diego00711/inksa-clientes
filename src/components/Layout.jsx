import { useEffect, useMemo, useRef } from "react";
import { Outlet, NavLink, Link, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Home, Receipt, ShoppingCart, User } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { CLIENT_API_URL, createAuthHeaders } from "../services/api";
import { apiFetch } from "../services/apiClient.js";
import { NotificationPrompt } from "./NotificationPrompt";
import { CompleteCadastro } from "./CompleteCadastro";
import { pendente as indicacaoPendente } from "../utils/indicacao";

function BottomNav() {
  const { totalItemsInCart } = useCart();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  const tabs = [
    { to: "/", icon: Home, label: "Início" },
    { to: "/meus-pedidos", icon: Receipt, label: "Pedidos" },
    { to: "/carrinho", icon: ShoppingCart, label: "Carrinho", badge: totalItemsInCart },
    { to: "/perfil", icon: User, label: "Perfil" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] flex sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map(({ to, icon: Icon, label, badge }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium min-h-[56px] relative transition-colors ${
              isActive ? "text-orange-500" : "text-gray-500"
            }`
          }
        >
          <div className="relative">
            <Icon className="w-6 h-6" />
            {badge > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </div>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

// Presença + foto do carrinho. O carrinho vive no localStorage, então sem isto
// o servidor nunca fica sabendo que alguém montou um pedido e desistiu — e
// abandono por atrito no checkout (frete que não calcula, pagamento recusado)
// vira invisível, porque cliente que desiste não reclama, só some.
function usePresencaCliente() {
  const { cartItems } = useCart();
  const { isAuthenticated } = useAuth();
  const carrinhoRef = useRef(cartItems);
  useEffect(() => { carrinhoRef.current = cartItems; }, [cartItems]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const ping = () => {
      const itens = carrinhoRef.current || [];
      const qtd = itens.reduce((t, i) => t + (i.quantity || 0), 0);
      const valor = itens.reduce((t, i) => t + (Number(i.price) || 0) * (i.quantity || 0), 0);
      apiFetch(`${CLIENT_API_URL}/api/client/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...createAuthHeaders() },
        body: JSON.stringify({ cart_items: qtd, cart_value: Number(valor.toFixed(2)) }),
      }).catch(() => {});   // best-effort: nunca atrapalha o app
    };
    ping();
    const id = setInterval(ping, 2 * 60 * 1000);
    const onVisible = () => { if (document.visibilityState === 'visible') ping(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isAuthenticated]);
}

/**
 * Faixa do convite, enquanto ele não tem conta.
 *
 * REGRESSÃO QUE ISTO CONSERTA: quando o app exigia login pra tudo, quem clicava
 * no link do convite caía direto na tela de login, e lá o convite era anunciado.
 * Ao abrir a vitrine, ele passou a cair na HOME — onde nada dizia que a
 * promessa do link estava viva. O código continuava guardado e o prêmio
 * continuava saindo, mas ele navegava sem saber, e a promessa do WhatsApp
 * parecia não ter sido cumprida.
 *
 * Fica no Layout, então acompanha ele pela home, pela loja e pelo carrinho —
 * que é justamente o trajeto até criar a conta.
 */
function FaixaDeConvite() {
  const { isAuthenticated } = useAuth();
  const local = useLocation();
  // Relê a cada navegação. Ler localStorage direto no render não avisa o React
  // quando o valor muda por fora — e quem apaga o convite é o IndicacaoHandler,
  // de fora daqui, ao aplicar o código. Sem isto a faixa continuaria prometendo
  // frete grátis depois de o convite já ter sido usado.
  const codigo = useMemo(
    () => indicacaoPendente(), [local.pathname, isAuthenticated]);
  if (isAuthenticated || !codigo) return null;
  return (
    <Link
      to="/register"
      className="flex items-center justify-center gap-2 bg-orange-100 px-4 py-2 text-center text-sm text-orange-900 hover:bg-orange-200"
    >
      <span aria-hidden>🎁</span>
      <span>
        <strong>Convite ativo:</strong> seu primeiro pedido sai{' '}
        <strong>sem frete</strong>. Criar conta →
      </span>
    </Link>
  );
}

export function Layout() {
  usePresencaCliente();
  return (
    <div className="bg-orange-50 min-h-screen">
      <Header />
      <FaixaDeConvite />
      <main className="w-full max-w-screen-2xl mx-auto pb-[calc(72px+env(safe-area-inset-bottom))] sm:pb-0">
        <NotificationPrompt />
        <CompleteCadastro />
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
