import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Loader2, ShoppingBag } from 'lucide-react';
import { useRifa } from '../hooks/useRifa';

/**
 * "Quais são os meus números?"
 *
 * A tela existe por uma razão só: quem está concorrendo precisa VER os
 * números. Promoção em que a pessoa acumula algo invisível não gera a volta —
 * ela esquece que está participando.
 *
 * ⚠️ Com a campanha desligada esta tela diz que não há campanha, e o item
 * some do menu. Hoje esse é o estado normal: a campanha só liga depois da
 * autorização do sorteio.
 */

const DE_ONDE = {
  cadastro: 'por ter se cadastrado',
  pedido: 'por um pedido',
  venda: 'por uma venda',
  entrega: 'por uma entrega',
};

export default function RifaPage() {
  const { ligada, numeros, total, carregando } = useRifa();

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando seus números…
      </div>
    );
  }

  if (!ligada) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <Ticket className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-gray-900">Nenhuma campanha no momento</h1>
        <p className="text-gray-600 mt-2">
          Quando tiver uma promoção valendo, seus números aparecem aqui.
        </p>
        <Link to="/" className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-orange-500 text-white font-medium">
          Ver as lojas
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-1">
        <Ticket className="w-7 h-7 text-orange-500" />
        <h1 className="text-2xl font-bold text-gray-900">Meus números</h1>
      </div>

      {/* O número grande primeiro: é a única coisa que a pessoa abriu a tela
          pra ver. A lista vem depois, pra quem quiser conferir. */}
      <p className="text-gray-600 mb-6">
        Você está concorrendo com{' '}
        <strong className="text-gray-900">
          {total} {total === 1 ? 'número' : 'números'}
        </strong>.
      </p>

      {total === 0 ? (
        <div className="rounded-2xl border border-gray-200 p-6 text-center">
          <p className="text-gray-700">Você ainda não tem números.</p>
          <p className="text-sm text-gray-500 mt-1">
            Faça um pedido e eles começam a aparecer aqui.
          </p>
          <Link to="/" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-orange-500 text-white font-medium">
            <ShoppingBag className="w-4 h-4" /> Ver as lojas
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
            {numeros.map((n) => (
              <div key={n.numero}
                className="rounded-xl border border-orange-200 bg-orange-50 py-3 text-center">
                <p className="text-lg font-bold text-orange-700 tabular-nums">{n.numero}</p>
                <p className="text-[11px] text-orange-800/70 leading-tight px-1">
                  {DE_ONDE[n.origem] || n.origem}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-5 text-sm text-gray-700">
            <p className="font-semibold text-gray-900 mb-1">Como ganhar mais</p>
            <p>
              A cada <strong>R$ 50,00</strong> em pedidos entregues você ganha mais um
              número. O valor é cumulativo — dois pedidos de R$ 30,00 somam R$ 60,00 e
              valem um número, e o que sobra continua contando.
            </p>
            {/* Dito aqui porque é a dúvida que chega no suporte depois que
                alguém cancela um pedido e vê o número sumir. */}
            <p className="mt-2 text-gray-600">
              Pedido cancelado ou estornado não vale, e o número gerado por ele é
              cancelado junto.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
