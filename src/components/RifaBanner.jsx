// Banner da campanha de números (sorteio) na tela inicial.
//
// POR QUE ELE EXISTE (09/10/2026): a rifa estava ligada havia 4 dias e tinha
// trazido UMA pessoa. Os 83 números emitidos eram todos retroativos, para
// quem já era cadastrado — nenhum número novo veio de alguém de fora.
//
// O motivo era estrutural: a única porta da rifa no app era o item de menu
// "Meus números", que (a) só aparecia depois do login e (b) tem um nome que
// não diz nada para quem ainda não tem número nenhum. A promoção feita para
// TRAZER cadastro só era visível para quem já havia se cadastrado.
//
// Este banner inverte isso: quem não tem conta vê o prêmio e o convite antes
// de qualquer outra coisa. Quem já tem conta vê quantos números tem.
import { Link } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import { useRifa } from '../hooks/useRifa';
import { brl } from '../utils/dinheiro';

export default function RifaBanner() {
  const { ligada, visitante, premio, nome, reais_por_numero, numero_no_cadastro, total, carregando } = useRifa();

  // Enquanto não sabemos, não desenha nada: banner que pisca e some é pior
  // que banner que demora meio segundo.
  if (carregando || !ligada) return null;

  const premioTexto = premio || nome || 'um prêmio';

  // VISITANTE — este é o caso que o banner existe para atender.
  if (visitante) {
    return (
      <Link
        to="/register"
        className="block mx-3 sm:mx-0 my-2 rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 text-white p-4 shadow-lg active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center gap-3">
          <Ticket className="w-9 h-9 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-extrabold leading-tight">
              Concorra a {premioTexto}
            </p>
            <p className="text-xs sm:text-sm text-white/90 leading-snug">
              {numero_no_cadastro
                ? 'Crie sua conta e já ganhe seu primeiro número.'
                : 'Crie sua conta para participar.'}
              {reais_por_numero
                ? ` Depois, a cada ${brl(reais_por_numero)} em pedidos você ganha mais um.`
                : ''}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-white/95 px-4 py-2 text-sm font-extrabold text-orange-700">
            Participar
          </span>
        </div>
      </Link>
    );
  }

  // JÁ TEM CONTA
  return (
    <Link
      to="/numeros"
      className="block mx-3 sm:mx-0 my-2 rounded-2xl border border-orange-200 bg-orange-50 p-4 active:scale-[0.99] transition-transform"
    >
      <div className="flex items-center gap-3">
        <Ticket className="w-7 h-7 shrink-0 text-orange-500" />
        <div className="min-w-0 flex-1">
          <p className="font-extrabold leading-tight text-orange-900">
            {total > 0
              ? `Você tem ${total} ${total === 1 ? 'número' : 'números'} para concorrer a ${premioTexto}`
              : `Concorra a ${premioTexto}`}
          </p>
          {reais_por_numero ? (
            <p className="mt-0.5 text-xs sm:text-sm leading-snug text-orange-800/80">
              A cada {brl(reais_por_numero)} em pedidos você ganha mais um número.
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
