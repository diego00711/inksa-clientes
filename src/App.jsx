import { Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { RestaurantDetailsPage } from "./pages/RestaurantDetailsPage";
import { LoginPage } from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import { Layout } from "./components/Layout";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CartPage } from "./pages/CartPage";
import { ProfilePage } from "./pages/ProfilePage";
import { CartProvider } from "./context/CartContext";
import MyOrdersPage from "./pages/MyOrdersPage";
import { LocationProvider } from "./context/LocationContext";
import { ToastProvider } from "./context/ToastContext";
import ClientEvaluationsCenter from "./pages/ClientEvaluationsCenter"; 

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <LocationProvider>
          <ToastProvider>
            <Routes>
              {/* Rotas públicas que NÃO usam o Layout com cabeçalho */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Rota "mãe" que aplica o Layout protegido a todas as rotas "filhas" */}
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/" element={<HomePage />} />
                <Route path="restaurantes/:id" element={<RestaurantDetailsPage />} />
                <Route path="carrinho" element={<CartPage />} />
                <Route path="perfil" element={<ProfilePage />} />
                <Route path="meus-pedidos" element={<MyOrdersPage />} />
                <Route path="avaliacoes" element={<ClientEvaluationsCenter />} />
              </Route>
            </Routes>
          </ToastProvider>
        </LocationProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
