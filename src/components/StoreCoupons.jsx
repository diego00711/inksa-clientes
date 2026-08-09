// src/components/StoreCoupons.jsx
// Vitrine dos cupons da loja na página dela. Sem isso o cupom do parceiro só
// funciona pra quem já viu a divulgação dele em outro lugar — quem chega pelo
// app nunca fica sabendo que existe desconto.

import React, { useState } from 'react';
import { Ticket, Check, Copy } from 'lucide-react';
import { useToast } from '../context/ToastContext';

// O carrinho lê esta chave e já preenche o campo de cupom.
export const PENDING_COUPON_KEY = 'inksa.pending_coupon';

const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);

export default function StoreCoupons({ coupons }) {
  const { addToast } = useToast();
  const [copiado, setCopiado] = useState(null);

  if (!Array.isArray(coupons) || coupons.length === 0) return null;

  const usar = async (c) => {
    // Guarda pro carrinho preencher sozinho. O clipboard é só conveniência —
    // no WebView ele pode falhar, e aí o cupom continua funcionando.
    try {
      localStorage.setItem(PENDING_COUPON_KEY, c.code);
    } catch {
      /* modo privado/sem storage: o cliente ainda pode digitar */
    }
    try {
      await navigator.clipboard.writeText(c.code);
    } catch {
      /* sem permissão de clipboard */
    }
    setCopiado(c.id);
    addToast('success', `Cupom ${c.code} guardado — aparece no carrinho.`);
    setTimeout(() => setCopiado(null), 2500);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2 mb-3">
        <Ticket className="text-orange-500 w-5 h-5" />
        Cupons desta loja
      </h2>

      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
        {coupons.map((c) => (
          <div
            key={c.id}
            className="snap-start shrink-0 w-64 border-2 border-dashed border-orange-300 bg-orange-50 rounded-xl p-3"
          >
            <p className="text-orange-600 font-extrabold text-lg leading-tight">{c.label}</p>
            {c.description && (
              <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{c.description}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {Number(c.min_order_value) > 0
                ? `Em pedidos a partir de ${brl(c.min_order_value)}`
                : 'Sem pedido mínimo'}
            </p>

            <div className="flex items-center gap-2 mt-3">
              <span className="font-mono font-bold text-gray-800 bg-white border border-orange-200 rounded-lg px-2 py-1.5 text-sm flex-1 text-center truncate">
                {c.code}
              </span>
              <button
                onClick={() => usar(c)}
                className="shrink-0 inline-flex items-center gap-1 bg-orange-500 text-white text-sm font-semibold px-3 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                {copiado === c.id ? (
                  <>
                    <Check className="w-4 h-4" /> Pronto
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Usar
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-3">
        O desconto é aplicado no carrinho, antes de finalizar o pedido.
      </p>
    </div>
  );
}
