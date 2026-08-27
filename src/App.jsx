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
import { configurarAcoesDePush } from "./services/notificationService";
import { CLIENT_API_URL, createAuthHeaders } from "./services/api";
import {
  capturarDaUrl as capturarIndicacaoDaUrl,
  pendente as indicacaoPendente,
  limpar as limparIndicacao,
} from "./utils/indicacao";

// --- Lazy-loaded pages ---
const HomePage = lazy(() => import("./pages/HomePage").then(m => ({ default: m.HomePage })));
const RestaurantDetailsPage = lazy(() => import("./pages/RestaurantDetailsPage").then(m => ({ default: m.RestaurantDetailsPage })));
const StoreReviewsPage = lazy(() => import("./pages/StoreReviewsPage"));
const LoginPage = lazy(() => import("./pages/LoginPage").then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const CartPage = lazy(() => import("./pages/CartPage").then(m => ({ default: m.CartPage })));
const ProfilePage = lazy(() => import("./pages/ProfilePage").then(m => ({ default: m.ProfilePage })));
const MyOrdersPage = lazy(() => import("./pages/MyOrdersPage"));
const ClientEvaluationsCenter = lazy(() => import("./pages/ClientEvaluationsCenter"));
const GamificationPage = lazy(() => import("./pages/GamificationPage"));
const IndiqueGanhePage = lazy(() => import("./pages/IndiqueGanhePage"));
const OrderTrackingPage = lazy(() => import("./pages/OrderTrackingPage").then(m => ({ default: m.OrderTrackingPage })));
const PaymentSuccessPage = lazy(() => import("./pages/PaymentSuccessPage"));
const PaymentFailurePage = lazy(() => import("./pages/PaymentFailurePage"));
const PaymentPendingPage = lazy(() => import("./pages/PaymentPendingPage"));
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

/**
 * Liga o toque na notificação ao roteador (só no app instalado).
 *
 * No navegador quem faz isso é o `notificationclick` do
 * firebase-messaging-sw.js; no APK é um listener do plugin, e sem ele o push
 * abre a home e a pessoa procura sozinha o pedido que gerou o aviso.
 */
function PushAcoesHandler() {
  const navigate = useNavigate();
  useEffect(() => { configurarAcoesDePush(navigate); }, [navigate]);
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

// Rede de segurança pós-pagamento: ao mandar o cliente pro checkout hospedado
// do Asaas, o CartPage grava a flag 'payment_redirect'. Quando ele volta pro
// app (mesmo que o Asaas NÃO tenha redirecionado — típico no PIX, que confirma
// no app do banco), levamos direto pra tela de acompanhamento do pedido.
function PaymentReturnHandler() {
  const navigate = useNavigate();
  useEffect(() => {
    let raw = null;
    try { raw = localStorage.getItem('payment_redirect'); } catch {}
    if (!raw) return;
    try { localStorage.removeItem('payment_redirect'); } catch {}
    let data = null;
    try { data = JSON.parse(raw); } catch { return; }
    if (!data?.id) return;
    // só honra se voltou há pouco; e não atropela as páginas que já se viram
    // sozinhas (/pagamento/* e /pedido/*)
    const recente = Date.now() - (data.ts || 0) < 30 * 60 * 1000;
    const path = window.location.pathname || '';
    const jaTratada = path.startsWith('/pagamento/') || path.startsWith('/pedido/');
    if (recente && !jaTratada) {
      navigate(`/pedido/${data.id}/acompanhar`, { replace: true });
    }
  }, [navigate]);
  return null;
}

// Indicação que chegou por link (?ref=INKABC123).
//
// Captura assim que o app abre — ANTES do login, porque quem clica no convite
// ainda não tem conta. Aplica no primeiro acesso já autenticado, que pode ser
// muitos minutos e um cadastro depois.
//
// Resposta do servidor com status 200 encerra o assunto, tenha dado certo ou
// não: "você já usou um código" é resposta definitiva, e insistir a cada
// abertura do app viraria um pedido inútil pra sempre. Só erro de rede mantém
// o código guardado pra tentar de novo.
function IndicacaoHandler() {
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const tentado = useRef(false);

  useEffect(() => { capturarIndicacaoDaUrl(); }, []);

  useEffect(() => {
    if (!isAuthenticated || tentado.current) return;
    const codigo = indicacaoPendente();
    if (!codigo) return;
    tentado.current = true;
    (async () => {
      try {
        const r = await fetch(`${CLIENT_API_URL}/api/referrals/aplicar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...createAuthHeaders() },
          body: JSON.stringify({ code: codigo }),
        });
        // SÓ APAGA O CÓDIGO DIANTE DE UMA RESPOSTA DE NEGÓCIO.
        //
        // Antes bastava não ser 5xx pra apagar, e isso destruía o convite em
        // estados que são NORMAIS no primeiro acesso — justamente quando o
        // convite acabou de ser usado:
        //   404  o client_profile ainda não existe. O próprio AuthContext
        //        documenta essa janela ("conta recém-criada"): ele deixa a
        //        pessoa entrar antes de o perfil aparecer.
        //   401  token gravado meio passo depois do isAuthenticated.
        //   429  limitador de taxa.
        // Nenhum desses é resposta sobre a indicação — são "pergunte de novo".
        // Como `tentado` também volta a false, a próxima abertura do app tenta
        // outra vez em vez de perder a promessa feita no WhatsApp.
        const RETENTAR = [401, 403, 404, 408, 425, 429];
        if (!r.ok && (r.status >= 500 || RETENTAR.includes(r.status))) {
          tentado.current = false;
          return;
        }
        const j = await r.json().catch(() => ({}));
        limparIndicacao();
        if (j?.ok) {
          addToast('success',
            `Frete grátis no seu primeiro pedido! Use o código ${j.cupom} no checkout.`);
        }
      } catch {
        tentado.current = false;   // sem rede: deixa guardado e tenta depois
      }
    })();
  }, [isAuthenticated, addToast]);

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
          <PushAcoesHandler />
          <OnlineStatusHandler />
          <PaymentReturnHandler />
          <IndicacaoHandler />
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

              {/* VITRINE — sem conta.
                  O app inteiro ficava atrás do login: abria e tomava tela de
                  senha, sem poder ver uma loja sequer. Pedir cadastro antes de
                  mostrar qualquer valor é pedir compromisso antes de dar
                  motivo — e foi a primeira coisa que um parceiro reclamou.
                  Os endpoints de loja, cardápio e opções já eram públicos; o
                  bloqueio era só este roteador.
                  O carrinho também entra: deixar montar o pedido cria o
                  compromisso que faz a pessoa criar conta pra não perder o que
                  escolheu. A conta é exigida no FINALIZAR. */}
              {/* ⚠️ UM <Layout /> SÓ, e as protegidas ANINHADAS dentro dele.
                  Não separe em duas árvores de rota (era assim antes):

                    <Route element={<Layout />}>            ...públicas
                    <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>

                  Pro React Router aqueles são elementos DIFERENTES. Ir de "/"
                  para "/perfil" desmontava o Layout inteiro e montava outro —
                  Header, heartbeat, CompleteCadastro e NotificationPrompt,
                  todos do zero, a cada travessia. Dava dois sintomas que não
                  pareciam ter relação: o app ficou lento depois da vitrine
                  livre, e a permissão de notificação "caía" (o efeito do
                  NotificationPrompt reexecutava e regravava o token toda vez).
                  Aninhado, o Layout monta UMA vez e só o miolo troca. */}
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="restaurantes/:id" element={<RestaurantDetailsPage />} />
                {/* Avaliações da loja — pública, o cliente lê antes de pedir. */}
                <Route path="restaurantes/:id/avaliacoes" element={<StoreReviewsPage />} />
                <Route path="carrinho" element={<CartPage />} />

                {/* Daqui pra baixo é coisa de quem já tem conta: dados pessoais,
                    histórico, prêmios e o acompanhamento do próprio pedido.
                    ProtectedRoute sem children devolve <Outlet />, então ele
                    funciona como rota "pathless" e só guarda o que vem abaixo. */}
                <Route element={<ProtectedRoute />}>
                  <Route path="perfil" element={<ProfilePage />} />
                  <Route path="meus-pedidos" element={<MyOrdersPage />} />
                  <Route path="avaliacoes" element={<ClientEvaluationsCenter />} />
                  {/* Clube Inksa unificado (absorveu a antiga Gamificação/Minha Pontuação) */}
                  <Route path="clube" element={<GamificationPage />} />
                  {/* O push do prêmio manda pra cá (data.url = /indique). */}
                  <Route path="indique" element={<IndiqueGanhePage />} />
                  <Route path="gamificacao" element={<Navigate to="/clube" replace />} />
                  <Route path="suporte" element={<SuportePage />} />
                  <Route path="pedido/:orderId/acompanhar" element={<OrderTrackingPage />} />
                </Route>
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
