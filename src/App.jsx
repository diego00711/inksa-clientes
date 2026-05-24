import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { HomePage } from "./pages/HomePage";
import { RestaurantDetailsPage } from "./pages/RestaurantDetailsPage";
import { LoginPage } from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import { Layout } from "./components/Layout";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CartPage } from "./pages/CartPage";
import { ProfilePage } from "./pages/ProfilePage";
import { CartProvider } from "./context/CartContext";
import MyOrdersPage from "./pages/MyOrdersPage";
import { LocationProvider } from "./context/LocationContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import ClientEvaluationsCenter from "./pages/ClientEvaluationsCenter";
import ClientGamificationDevPage from "./pages/ClientGamificationDevPage";
import GamificationPage from "./pages/GamificationPage";
import { OrderTrackingPage } from "./pages/OrderTrackingPage";
import OnboardingSlides from "./components/onboarding/OnboardingSlides";
import GuidedTour from "./components/onboarding/GuidedTour";
import FirstOrderCelebration from "./components/onboarding/FirstOrderCelebration";
import GlobalError from "./components/GlobalError";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentFailurePage from "./pages/PaymentFailurePage";
import PaymentPendingPage from "./pages/PaymentPendingPage";

// Componente interno: precisa estar dentro de ToastProvider para acessar useToast,
// e dentro de BrowserRouter (via main.jsx) para acessar useNavigate.
function AuthUnauthorizedHandler() {
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const handleUnauthorized = () => {
      addToast('error', 'Sessão expirada, faça login novamente');
      navigate('/login');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [addToast, navigate]);

  return null;
}

function OnlineStatusHandler() {
  const { addToast } = useToast();
  const isOnline = useOnlineStatus();
  const prevRef = useRef(null);

  useEffect(() => {
    if (prevRef.current === null) { prevRef.current = isOnline; return; }
    if (isOnline && !prevRef.current) addToast('success', 'Conexão restaurada');
    if (!isOnline && prevRef.current) addToast('error', 'Você está offline');
    prevRef.current = isOnline;
  }, [isOnline, addToast]);

  return null;
}

// Componente interno que gerencia todos os overlays de onboarding.
// Fica dentro de AuthProvider/ToastProvider para acessar useAuth,
// e renderiza sobreposto às rotas sem alterar a estrutura delas.
function OnboardingManager() {
  const { isAuthenticated } = useAuth();

  const [showOnboarding, setShowOnboarding] = useState(
    localStorage.getItem('inksa_onboarding_done') !== 'true'
  );
  const [showTour, setShowTour] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Exibe o tour guiado quando o usuário fizer login,
  // mas só se o onboarding já tiver sido concluído e o tour ainda não.
  useEffect(() => {
    if (
      isAuthenticated &&
      localStorage.getItem('inksa_onboarding_done') === 'true' &&
      localStorage.getItem('inksa_tour_done') !== 'true'
    ) {
      setShowTour(true);
    }
  }, [isAuthenticated]);

  // Exibe a celebração do primeiro pedido via evento customizado.
  useEffect(() => {
    const handleFirstOrder = () => {
      if (localStorage.getItem('inksa_first_order_done') !== 'true') {
        setShowCelebration(true);
      }
    };
    window.addEventListener('order:first_confirmed', handleFirstOrder);
    return () => {
      window.removeEventListener('order:first_confirmed', handleFirstOrder);
    };
  }, []);

  return (
    <>
      {showOnboarding && (
        <OnboardingSlides
          onComplete={() => {
            setShowOnboarding(false);
            // Após o onboarding, se já autenticado, inicia o tour
            if (
              isAuthenticated &&
              localStorage.getItem('inksa_tour_done') !== 'true'
            ) {
              setShowTour(true);
            }
          }}
        />
      )}
      {showTour && (
        <GuidedTour onComplete={() => setShowTour(false)} />
      )}
      {showCelebration && (
        <FirstOrderCelebration onComplete={() => setShowCelebration(false)} />
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <LocationProvider>
          <ToastProvider>
            <AuthUnauthorizedHandler />
            <OnlineStatusHandler />
            <GlobalError />
            <OnboardingManager />
            <Routes>
              {/* Rotas públicas que NÃO usam o Layout com cabeçalho */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/pagamento/sucesso" element={<PaymentSuccessPage />} />
              <Route path="/pagamento/falha" element={<PaymentFailurePage />} />
              <Route path="/pagamento/pendente" element={<PaymentPendingPage />} />

              {/* Rota "mãe" que aplica o Layout protegido a todas as rotas "filhas" */}
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/" element={<HomePage />} />
                <Route path="restaurantes/:id" element={<RestaurantDetailsPage />} />
                <Route path="carrinho" element={<CartPage />} />
                <Route path="perfil" element={<ProfilePage />} />
                <Route path="meus-pedidos" element={<MyOrdersPage />} />
                <Route path="avaliacoes" element={<ClientEvaluationsCenter />} />
                <Route path="gamificacao" element={<GamificationPage />} />
                <Route path="gamificacao-dev" element={<ClientGamificationDevPage />} />
                <Route path="pedido/:orderId/acompanhar" element={<OrderTrackingPage />} />
              </Route>
            </Routes>
          </ToastProvider>
        </LocationProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
