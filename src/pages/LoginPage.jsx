// Local: src/pages/LoginPage.jsx

import { useState } from "react";
import { Link } from "react-router-dom";
import { Smartphone, Gift, ArrowRight } from "lucide-react";
import { LoginForm } from "../components/LoginForm";
import { ehAppNativo } from "../services/notificationService";
import { pendente as indicacaoPendente } from "../utils/indicacao";

const PLAY_STORE = "https://play.google.com/store/apps/details?id=com.inksa.cliente";

/**
 * O "Baixe o app" QUEBRA A INDICAÇÃO — este componente é o remendo.
 *
 * O QUE ACONTECEU DE VERDADE (sogro → sogra, 27/08): ele mandou o link, ela
 * abriu no NAVEGADOR (o código ficou no localStorage do navegador), viu o
 * banner "Baixe o app", instalou, e se cadastrou DENTRO DO APK. Storage do
 * navegador e storage do app são separados — o convite nunca chegou lá, e a
 * tabela referrals ficou vazia. Ninguém foi avisado de nada.
 *
 * O convite só é frágil ENTRE clicar no link e criar a conta. Depois que a
 * conta existe, o vínculo mora no servidor e sobrevive a instalar app, trocar
 * de aparelho, o que for. Por isso a ordem correta é CRIAR CONTA e só então
 * baixar — e é isso que este bloco defende, em vez de empurrar o download no
 * exato minuto em que ele custa o prêmio dos dois.
 *
 * Quem insistir em baixar antes leva o código na tela, copiável, porque o
 * cadastro tem campo pra ele. É pior que criar a conta aqui, mas é MUITO
 * melhor que perder em silêncio.
 */
function ConviteAntesDoApp({ codigo }) {
  const [copiado, setCopiado] = useState(false);
  // O &referrer= é lido pela Install Referrer API do Google Play e entregue ao
  // app na primeira abertura. HOJE NADA LÊ ISSO — falta o plugin no APK. Vai
  // junto porque não custa nada e faz os links já compartilhados funcionarem
  // no dia em que o plugin entrar, sem precisar reenviar convite nenhum.
  const linkLoja = `${PLAY_STORE}&referrer=${encodeURIComponent(codigo)}`;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch { /* sem permissão de área de transferência: o código está na tela */ }
  };

  return (
    <div className="rounded-2xl border-2 border-orange-300 bg-orange-50 p-4">
      <p className="flex items-center gap-2 font-bold text-orange-900">
        <Gift className="h-5 w-5 shrink-0" />
        Você tem um convite
      </p>
      <p className="mt-1 text-sm text-orange-900/90">
        Crie sua conta <strong>aqui mesmo</strong> para garantir o frete grátis.
        Depois é só baixar o app e entrar com a mesma conta — o convite fica
        guardado.
      </p>

      <Link
        to="/register"
        className="mt-3 flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 font-bold text-white hover:bg-orange-600"
      >
        Criar conta e garantir <ArrowRight className="h-4 w-4" />
      </Link>

      <div className="mt-3 border-t border-orange-200 pt-3">
        <p className="text-xs text-orange-900/80">
          Prefere baixar o app primeiro? Então <strong>anote este código</strong> —
          você vai digitar no cadastro:
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <code className="flex-1 rounded-lg bg-white px-3 py-2 text-center font-mono text-base font-bold tracking-widest text-orange-700">
            {codigo}
          </code>
          <button
            type="button"
            onClick={copiar}
            className="min-h-[40px] rounded-lg border border-orange-300 bg-white px-3 text-sm font-semibold text-orange-700 hover:bg-orange-100"
          >
            {copiado ? 'copiado!' : 'copiar'}
          </button>
        </div>
        <a
          href={linkLoja}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-orange-700 underline"
        >
          <Smartphone className="h-3.5 w-3.5" /> Baixar o app mesmo assim
        </a>
      </div>
    </div>
  );
}

export function LoginPage() {
  // Dentro do APK isto seria absurdo — "baixe o app" para quem já está no app.
  // O mesmo site roda nos dois lugares (o Capacitor carrega a versão publicada),
  // então a tela precisa saber onde está.
  const noNavegador = !ehAppNativo();
  const convidado = indicacaoPendente();

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-4">
        {/* Quem chegou pelo link do convite via um login pelado, sem uma
            palavra sobre o convite nem sobre o frete grátis — e o "Cadastre-se"
            é uma linha miúda no rodapé do formulário. Aqui o motivo de ele ter
            clicado aparece antes de qualquer campo. */}
        {convidado && (
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-start gap-3">
              <Gift className="mt-0.5 h-6 w-6 shrink-0 text-orange-600" />
              <div className="min-w-0">
                <p className="font-bold text-gray-900">Você foi convidado 🎉</p>
                <p className="mt-0.5 text-sm text-gray-700">
                  Seu <strong>primeiro pedido sai sem frete</strong>. Crie sua conta
                  para usar — o convite já está guardado.
                </p>
                <Link
                  to="/register"
                  className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-bold text-white hover:bg-orange-700"
                >
                  Criar minha conta <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        <LoginForm />

        {/* Empurrão pro app: quem pede pelo navegador não recebe notificação de
            "seu pedido saiu para entrega", que é justamente o que faz a pessoa
            voltar. Fica DEPOIS do formulário de propósito — quem já tem conta e
            só quer entrar não deve tropeçar num anúncio antes do campo de
            senha. */}
        {noNavegador && (
          convidado
            ? <ConviteAntesDoApp codigo={convidado} />
            : (
              <a
                href={PLAY_STORE}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100">
                  <Smartphone className="h-6 w-6 text-orange-600" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-gray-900">Baixe o app do Inksa</span>
                  <span className="block text-sm text-gray-600">
                    Acompanhe seu pedido em tempo real e receba aviso quando ele sair
                    para entrega.
                  </span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-gray-400" />
              </a>
            )
        )}
      </div>
    </div>
  );
}
