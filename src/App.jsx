import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { Layout } from "./components/Layout";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CartProvider } from "./context/CartContext";
import { LocationProvider } from "./context/LocationContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import OnboardingSlides from "./components/onboarding/OnboardingSlides";
import GuidedTour from "./components/onboarding/GuidedTour";
import FirstOrderCelebration from "./components/onboarding/FirstOrderCelebration";
import GlobalError from "./components/GlobalError";
import WakingUpScreen from "./components/WakingUpScreen";
import SupportButton from "./components/SupportButton";

// --- Lazy-loaded pages ---
const HomePage = lazy(() => import("./pages/HomePage").then(m => ({ default: m.HomePage })));
const RestaurantDetailsPage = lazy(() => import("./pages/RestaurantDetailsPage").then(m => ({ default: m.RestaurantDetailsPage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const CartPage = lazy(() => import("./pages/CartPage").then(m => ({ default: m.CartPage })));
const ProfilePage = lazy(() => import("./pages/ProfilePage").then(m => ({ default: m.ProfilePage })));
const MyOrdersPage = lazy(() => import("./pages/MyOrdersPage"));
const ClientEvaluationsCenter = lazy(() => import("./pages/ClientEvaluationsCenter"));
const ClientGamificationDevPage = lazy(() => import("./pages/ClientGamificationDevPage"));
const GamificationPage = lazy(() => import("./pages/GamificationPage"));
const OrderTrackingPage = lazy(() => import("./pages/OrderTrackingPage").then(m => ({ default: m.OrderTrackingPage })));
const PaymentSuccessPage = lazy(() => import("./pages/PaymentSuccessPage"));
const PaymentFailurePage = lazy(() => import("./pages/PaymentFailurePage"));
const PaymentPendingPage = lazy(() => import("./pages/PaymentPendingPage"));
const ClubePage = lazy(() => import("./pages/ClubePage"));
const SuportePage = lazy(() => import("./pages/SuportePage"));

const PageLoader = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
  </div>
);

function AuthUnauthorizedHandler() {
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const handleUnauthorized = () => {
      addToast('error', 'Sessão expirada, faça login novamente');
      navigate('/login');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
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

function OnboardingManager() {
  const { isAuthenticated } = useAuth();

  const [showOnboarding, setShowOnboarding] = useState(
    localStorage.getItem('inksa_onboarding_done') !== 'true'
  );
  const [showTour, setShowTour] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (
      isAuthenticated &&
      localStorage.getItem('inksa_onboarding_done') === 'true' &&
      localStorage.getItem('inksa_tour_done') !== 'true'
    ) {
      setShowTour(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleFirstOrder = () => {
      if (localStorage.getItem('inksa_first_order_done') !== 'true') {
        setShowCelebration(true);
      }
    };
    window.addEventListener('order:first_confirmed', handleFirstOrder);
    return () => window.removeEventListener('order:first_confirmed', handleFirstOrder);
  }, []);

  return (
    <>
      {showOnboarding && (
        <OnboardingSlides
          onComplete={() => {
            setShowOnboarding(false);
            if (isAuthenticated && localStorage.getItem('inksa_tour_done') !== 'true') {
              setShowTour(true);
            }
          }}
        />
      )}
      {showTour && <GuidedTour onComplete={() => setShowTour(false)} />}
      {showCelebration && <FirstOrderCelebration onComplete={() => setShowCelebration(false)} />}
    </>
  );
}

function AppContent() {
  const [serverReady, setServerReady] = useState(false);

  return (
    <>
      <WakingUpScreen onReady={() => setServerReady(true)} />
      {serverReady && (
        <>
          <AuthUnauthorizedHandler />
          <OnlineStatusHandler />
          <GlobalError />
          <OnboardingManager />
          <SupportButton />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/pagamento/sucesso" element={<PaymentSuccessPage />} />
              <Route path="/pagamento/falha" element={<PaymentFailurePage />} />
              <Route path="/pagamento/pendente" element={<PaymentPendingPage />} />

              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/" element={<HomePage />} />
                <Route path="restaurantes/:id" element={<RestaurantDetailsPage />} />
                <Route path="carrinho" element={<CartPage />} />
                <Route path="perfil" element={<ProfilePage />} />
                <Route path="meus-pedidos" element={<MyOrdersPage />} />
                <Route path="avaliacoes" element={<ClientEvaluationsCenter />} />
                <Route path="gamificacao" element={<GamificationPage />} />
                <Route path="gamificacao-dev" element={<ClientGamificationDevPage />} />
                <Route path="clube" element={<ClubePage />} />
                <Route path="suporte" element={<SuportePage />} />
                <Route path="pedido/:orderId/acompanhar" element={<OrderTrackingPage />} />
              </Route>
            </Routes>
          </Suspense>
        </>
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
            <AppContent />
          </ToastProvider>
        </LocationProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
