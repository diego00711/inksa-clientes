// Local: src/pages/LoginPage.jsx

import { Link } from "react-router-dom";
import { Smartphone, Gift, ArrowRight } from "lucide-react";
import { LoginForm } from "../components/LoginForm";
import { ehAppNativo } from "../services/notificationService";
import { pendente as indicacaoPendente } from "../utils/indicacao";

const PLAY_STORE = "https://play.google.com/store/apps/details?id=com.inksa.cliente";

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
        )}
      </div>
    </div>
  );
}
