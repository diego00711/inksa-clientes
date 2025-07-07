// Local: src/App.jsx

import { Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { RestaurantDetailsPage } from "./pages/RestaurantDetailsPage";
import { LoginPage } from "./pages/LoginPage";
import { Layout } from "./components/Layout";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CartPage } from "./pages/CartPage";
import { ProfilePage } from "./pages/ProfilePage";
import { CartProvider } from "./context/CartContext";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          {/* Rota pública que NÃO usa o Layout com cabeçalho */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rota "mãe" que aplica o Layout protegido a todas as rotas "filhas" */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<HomePage />} />
            <Route path="restaurantes/:id" element={<RestaurantDetailsPage />} />
            <Route path="carrinho" element={<CartPage />} />
            <Route path="perfil" element={<ProfilePage />} />
          </Route>
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;