import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Gift, Ticket } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import AuthService from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { mensagemDeErro } from '../utils/mensagemDeErro.js';
import { marcarCadastro } from '../utils/pixel';
import { useRifa } from '../hooks/useRifa';
import { brl } from '../utils/dinheiro';
import { pendente as indicacaoPendente, guardar as guardarIndicacao } from '../utils/indicacao';
import { useIndicacaoLigada } from '../hooks/useIndicacao';

export default function RegisterPage() {
  // O código NÃO vai no cadastro: este registro não loga, ele manda pro login,
  // e a indicação precisa de token pra ser aplicada. Então aqui só GUARDAMOS,
  // e o IndicacaoHandler aplica no primeiro acesso autenticado. Se chegou por
  // link (?ref=), o campo já vem preenchido e a pessoa não digita nada.
  const [codigoIndicacao, setCodigoIndicacao] = useState(() => indicacaoPendente() || '');
  // Quem decide se o campo aparece é o servidor, não o localStorage.
  const indicacaoLigada = useIndicacaoLigada();
  // ⚠️ SEM "Apelido". Era obrigatório e não servia pra nada: o sobrenome não
  // aparece em pedido, em entrega nem na comanda. Num cadastro que em 03/11
  // converteu ZERO de 39 visitas vindas do anúncio, cada campo obrigatório a
  // menos conta — e este era o único que não tinha uso nenhum depois.
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // FIX: replace alert() with inline message
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { loginWithGoogle } = useAuth();

  // A faixa do prêmio em cima do formulário. Existe porque o anúncio pago
  // passou a apontar direto pra cá: sem ela, quem clica num anúncio de
  // scooter cai num formulário seco que não menciona scooter nenhuma — o
  // mesmo descasamento que em 03/11 fez 39 cliques virarem zero cadastro.
  //
  // ⚠️ O texto vem do SERVIDOR (useRifa), não está escrito aqui. Quando a
  // campanha for desligada no admin, a faixa some sozinha em vez de ficar
  // prometendo um prêmio que acabou.
  const { ligada: rifaLigada, premio, nome: nomeRifa,
          reais_por_numero, numero_no_cadastro } = useRifa();
  const premioTexto = premio || nomeRifa || 'um prêmio';

  // Fica escondido até `VITE_GOOGLE_CLIENT_ID` existir, e dentro do APK
  // sempre — o plugin nativo do Google não está instalado, então o botão
  // apareceria e não funcionaria. Mesmo gate do LoginForm, de propósito: se
  // um dia a chave entrar, os dois acendem juntos.
  const googleEnabled = !!import.meta.env.VITE_GOOGLE_CLIENT_ID && !Capacitor.isNativePlatform();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ⚠️ Pelo Google a pessoa já entra LOGADA — diferente do cadastro por
  // formulário, que manda pro /login. Por isso a indicação é guardada aqui
  // também: o IndicacaoHandler aplica no primeiro acesso autenticado, e sem
  // esta linha quem entrasse pelo Google perderia o código que digitou.
  const handleGoogleCredential = async (credential) => {
    setError('');
    setIsLoading(true);
    try {
      guardarIndicacao(codigoIndicacao);
      const dados = await loginWithGoogle(credential);
      // Só no PRIMEIRO acesso. Pelo Google não existe "tela de cadastro": o
      // mesmo botão serve pra criar conta e pra voltar, e contar os dois como
      // cadastro ensinaria o Meta a buscar quem já é cliente.
      if (dados?.is_new_user) marcarCadastro('google');
      navigate('/');
    } catch (err) {
      setError(mensagemDeErro(err, 'Não foi possível entrar com o Google.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Objeto com os dados formatados para o backend
      const dataToSend = {
        email: formData.email,
        password: formData.password,
        name: formData.firstName.trim(),
        userType: 'client', // Adiciona o tipo de usuário fixo
      };

      // Envia os dados corretos para o serviço de autenticação
      await AuthService.register(dataToSend);
      marcarCadastro('formulario');

      // Guarda ANTES de sair da tela. O vínculo em si é feito depois do login,
      // pelo IndicacaoHandler — aqui só não se perde o que a pessoa digitou.
      guardarIndicacao(codigoIndicacao);

      // FIX: show inline success message, then redirect after short delay
      setSuccessMessage('Registo feito com sucesso! Redirecionando para o login...');
      setTimeout(() => navigate('/login'), 2000);

    } catch (err) {
      // Captura a mensagem de erro específica vinda do backend
      const errorMessage = err.response?.data?.message || err.message || 'Ocorreu um erro ao tentar registar.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-orange-50">
      <div className="w-full max-w-md p-4 sm:p-8 space-y-6 bg-white rounded-xl shadow-lg mx-4 sm:mx-0">
        <div className="text-center">
          <img src="/inksa-marca.png" alt="Inksa Logo" className="h-10 w-auto mx-auto" />
          <h2 className="mt-4 text-2xl font-bold text-center text-gray-900">
            Crie a sua Conta
          </h2>
        </div>

        {rifaLigada && (
          <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 p-3 text-white shadow">
            <Ticket className="h-8 w-8 shrink-0" />
            <div className="min-w-0">
              <p className="font-extrabold leading-tight">Concorra a {premioTexto}</p>
              <p className="text-xs leading-snug text-white/90">
                {numero_no_cadastro
                  ? 'Ao criar sua conta você já ganha o primeiro número.'
                  : 'Crie sua conta para participar.'}
                {reais_por_numero
                  ? ` Depois, a cada ${brl(reais_por_numero)} em pedidos, mais um.`
                  : ''}
              </p>
            </div>
          </div>
        )}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">Nome</label>
            <input id="firstName" name="firstName" type="text" autoComplete="given-name" required value={formData.firstName} onChange={handleChange} className="mt-1 w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mail</label>
            <input id="email" name="email" type="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="email" required value={formData.email} onChange={handleChange} className="mt-1 w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
            <div className="relative mt-1">
              <input id="password" name="password" type={showPassword ? "text" : "password"} required minLength="6" value={formData.password} onChange={handleChange} className="w-full pr-10 px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} tabIndex={-1} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {/* FIX: surface password requirement to the user */}
            <p className="mt-1 text-xs text-gray-400">Mínimo de 6 caracteres</p>
          </div>

          {/* Opcional e por último: campo obrigatório-parecendo no cadastro
              espanta quem não tem código. Quem chegou pelo link nem vê — já
              vem preenchido.

              O campo INTEIRO some com o programa desligado, não só a frase do
              frete grátis: um campo de código que o backend vai recusar é pior
              que campo nenhum — a pessoa digita, cria a conta e leva "programa
              de indicação pausado" como boas-vindas. */}
          {indicacaoLigada && <div>
            <label htmlFor="codigoIndicacao" className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <Gift className="h-4 w-4 text-orange-500" />
              Código de indicação <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              id="codigoIndicacao"
              name="codigoIndicacao"
              type="text"
              value={codigoIndicacao}
              onChange={(e) => setCodigoIndicacao(e.target.value.toUpperCase())}
              placeholder="INKABC123"
              className="mt-1 w-full px-3 py-2 text-base uppercase tracking-widest border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="mt-1 text-xs text-orange-600">
              Tem o código de um amigo? Seu primeiro pedido sai sem frete.
            </p>
          </div>}

          {/* FIX: show success or error feedback inline */}
          {successMessage && <p className="text-sm text-center text-green-600 font-medium">{successMessage}</p>}
          {error && <p className="text-sm text-center text-red-500">{error}</p>}

          <p className="text-xs text-center text-gray-500">
            Ao criar sua conta, você concorda com os{' '}
            <a href="https://inksadelivery.com.br/termos" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">Termos de Uso</a>{' '}
            e a{' '}
            <a href="https://inksadelivery.com.br/privacidade" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">Política de Privacidade</a>.
          </p>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !!successMessage} // FIX: disable after successful registration
              className="w-full flex justify-center py-2.5 px-4 min-h-[44px] border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {isLoading ? 'A Registar...' : 'Criar Conta'}
            </button>
          </div>
        </form>

        {googleEnabled && (
          <>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400">ou</span>
              </div>
            </div>
            <GoogleSignInButton
              onCredential={handleGoogleCredential}
              onError={(e) => setError(mensagemDeErro(e, 'Falha ao carregar o Google.'))}
              text="signup_with"
            />
          </>
        )}

        <div className="text-sm text-center text-gray-500 pt-4 border-t">
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Já tem uma conta? Faça Login
          </Link>
        </div>
      </div>
    </div>
  );
}