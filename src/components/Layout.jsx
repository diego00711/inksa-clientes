import { Outlet, NavLink } from "react-router-dom";
import { Header } from "./Header";
import { Home, Receipt, ShoppingCart, User } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

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

export function Layout() {
  return (
    <div className="bg-orange-50 min-h-screen">
      <Header />
      <main className="w-full max-w-screen-2xl mx-auto pb-[calc(72px+env(safe-area-inset-bottom))] sm:pb-0">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
