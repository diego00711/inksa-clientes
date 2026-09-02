// src/context/AuthContext.jsx - VERSÃO ULTRA-SIMPLIFICADA (USA EMAIL DO LOGIN)

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService, { guardarSessao } from '../services/authService';
import clientService from '../services/clientService';
import { requestNotificationPermission, obterTokenFCM, saveFcmToken } from '../services/notificationService';
import { CLIENT_API_URL, createAuthHeaders } from '../services/api';
import { isTokenExpired, refreshSession, REFRESH_NETWORK_ERROR } from '../services/apiClient';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAndSetUser = useCallback(async () => {
    let token = authService.getToken();
    // TOKEN VENCIDO NÃO É SESSÃO PERDIDA — é sessão que precisa renovar.
    // Antes isto deslogava direto, ignorando que existe um refresh_token
    // guardado e válido. Quem voltava ao app depois de uma hora caía no login
    // sem motivo. Ver o comentário do intervalo de 30s mais abaixo.
    if (token && isTokenExpired(token)) {
      const novo = await refreshSession();
      if (novo === REFRESH_NETWORK_ERROR) {
        // Backend hibernando ou wi-fi caiu: NÃO é sessão inválida. Segue com
        // o token velho; o apiClient renova na primeira chamada que der certo.
      } else if (novo) {
        token = novo;
      } else {
        console.warn('[AuthContext] Token expirado e refresh recusado — encerrando sessão.');
        authService.logout();
        setUser(null);
        setIsLoading(false);
        return;
      }
    }
    if (token) {
      try {
        // 1️⃣ Pega dados salvos no localStorage (do login - TEM O EMAIL!)
        const storedAuthData = authService.getCurrentUser();

        // 2️⃣ Busca o perfil completo — não faz logout se não encontrado (conta recém-criada)
        let profileData = {};
        try {
          profileData = await clientService.getProfile();
        } catch (profileErr) {
          console.warn("[AuthContext] Perfil não encontrado (conta recém-criada ou erro temporário):", profileErr);
          // Não faz logout — usa dados básicos do login para permitir acesso
        }

        // 3️⃣ COMBINA: perfil + email do localStorage
        const combinedUser = {
          ...profileData,
          email: storedAuthData?.email || null,  // EMAIL VEM DO LOGIN!
          user_type: storedAuthData?.user_type || 'client',
          id: profileData.id || storedAuthData?.id
        };

        console.log('✅ [AuthContext] Usuário montado:', combinedUser);
        console.log('✅ [AuthContext] Email do usuário:', combinedUser.email);

        setUser(combinedUser);
      } catch (error) {
        console.error("❌ [AuthContext] Erro crítico ao montar usuário:", error);
        authService.logout();
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAndSetUser();
  }, [fetchAndSetUser]);

  // Registra o aparelho pra push também na RETOMADA de sessão, não só no
  // login. Quem já estava logado nunca passava pelo login() de novo — daí 1
  // token em 22 clientes. Idempotente: reenviar o mesmo token não faz mal.
  //
  // Onde a permissão ainda não foi concedida, o navegador ignora o pedido sem
  // gesto do usuário; esse caso continua sendo do painel em Perfil, que tem
  // botão. Aqui a gente resgata quem JÁ autorizou e mesmo assim não constava.
  useEffect(() => {
    if (!user) return;
    let vivo = true;
    (async () => {
      try {
        const { token, erro } = await obterTokenFCM();
        if (!vivo) return;
        if (!token) {
          console.warn('Push: token não gerado —', erro);
          return;
        }
        const r = await saveFcmToken(token, CLIENT_API_URL, createAuthHeaders());
        if (!r?.ok) console.warn('Push: servidor não salvou o token —', r?.motivo);
      } catch (e) {
        console.warn('Push: falha ao registrar (não bloqueia o app):', e);
      }
    })();
    return () => { vivo = false; };
  }, [user]);

  // Vigia a validade do token (a cada 30s e ao voltar pra frente).
  //
  // ⚠️ ISTO DESLOGAVA O CLIENTE NO MEIO DO PEDIDO. A regra era: token vencido
  // → logout, ponto. Sem NUNCA tentar renovar — mesmo com um refresh_token
  // válido guardado e com todo o mecanismo de renovação pronto no apiClient.
  //
  // Por que aparecia no checkout e não no resto: o apiClient renova sozinho
  // ANTES de cada chamada. Enquanto a pessoa navega, alguma requisição sempre
  // acontece e o token se mantém fresco. No checkout ela para — escolhe
  // endereço, confere o carrinho, decide o pagamento — e passa minutos sem
  // disparar nada. Aí este timer chegava primeiro e derrubava a sessão com o
  // pedido montado. Relatado pelo Diego em pedido de teste real.
  //
  // Agora renovar vem antes de desistir. Só desloga se o refresh for RECUSADO
  // (refresh_token revogado ou ausente) — que é a única situação em que a
  // sessão realmente acabou. Falha de rede não derruba: refreshSession devolve
  // REFRESH_NETWORK_ERROR nesse caso, e a próxima passada tenta de novo.
  useEffect(() => {
    let rodando = false;
    const checkExpiry = async () => {
      if (rodando) return;            // não empilha renovação a cada tique
      const token = authService.getToken();
      if (!token || !isTokenExpired(token)) return;
      rodando = true;
      try {
        const novo = await refreshSession();
        // Só o `null` significa sessão encerrada de verdade (refresh_token
        // ausente ou recusado). Erro de rede devolve o sentinel e espera.
        if (novo || novo === REFRESH_NETWORK_ERROR) return;
        authService.logout();
        setUser(null);
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      } finally {
        rodando = false;
      }
    };
    const interval = setInterval(checkExpiry, 30_000);
    // Tambem verifica quando a aba volta a ficar visivel (Capacitor/celular)
    const onVisible = () => { if (!document.hidden) checkExpiry(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const loginResponse = await authService.login(email, password);
      console.log('✅ [AuthContext] Login bem-sucedido:', loginResponse);

      // Atualiza o contexto após login
      await fetchAndSetUser();

      // FCM: solicita permissão e salva token — falha nunca quebra o login
      try {
        const fcmToken = await requestNotificationPermission();
        if (fcmToken) await saveFcmToken(fcmToken, CLIENT_API_URL, createAuthHeaders());
      } catch (fcmErr) {
        console.warn('FCM pós-login error (ignorado):', fcmErr);
      }
    } catch (error) {
      console.error("❌ [AuthContext] Erro no login:", error);
      throw error;
    }
  };

  /** Entra com uma sessão que JÁ veio pronta do servidor (checkout rápido).
   *
   *  Espelha o login() de propósito, inclusive o FCM. A primeira versão do
   *  checkout rápido gravava a sessão direto no CartPage e pulava o push —
   *  o cliente novo, vindo do link do Instagram, fazia o pedido e NÃO recebia
   *  "pedido aceito" nem "saiu para entrega". Justamente quem a gente mais
   *  quer que tenha uma boa primeira experiência.
   *
   *  Duas formas de entrar significam dois lugares pra esquecer de algo. */
  const entrarComSessao = async (dados) => {
    if (!guardarSessao(dados)) throw new Error('Sessão inválida.');
    await fetchAndSetUser();
    try {
      const fcmToken = await requestNotificationPermission();
      if (fcmToken) await saveFcmToken(fcmToken, CLIENT_API_URL, createAuthHeaders());
    } catch (fcmErr) {
      // Push é bônus: negar a permissão não pode travar o pedido.
      console.warn('FCM pós-checkout rápido (ignorado):', fcmErr);
    }
  };

  const loginWithGoogle = async (idToken) => {
    try {
      await authService.loginWithGoogle(idToken);
      console.log('✅ [AuthContext] Login com Google bem-sucedido');

      // Atualiza o contexto após login
      await fetchAndSetUser();

      // FCM: solicita permissão e salva token — falha nunca quebra o login
      try {
        const fcmToken = await requestNotificationPermission();
        if (fcmToken) await saveFcmToken(fcmToken, CLIENT_API_URL, createAuthHeaders());
      } catch (fcmErr) {
        console.warn('FCM pós-login Google error (ignorado):', fcmErr);
      }
    } catch (error) {
      console.error("❌ [AuthContext] Erro no login com Google:", error);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    userToken: authService.getToken(),
    isAuthenticated: !!user,
    isLoading,
    login,
    loginWithGoogle,
    logout,
    refreshUser: fetchAndSetUser,
    entrarComSessao,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
