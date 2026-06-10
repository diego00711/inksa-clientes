// src/components/CardPaymentModal.jsx
// Pagamento com cartão DENTRO do app (Checkout Transparente / MP Bricks),
// sem redirecionar. O SDK do Mercado Pago é carregado do CDN oficial
// (sem dependência npm) e o Brick tokeniza o cartão no cliente — os dados
// do cartão nunca passam pelo nosso backend; enviamos só o token para
// /api/pagamentos/processar_cartao.

import { useEffect, useRef, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { processCardPayment } from '../services/orderService';

const PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
const SDK_URL = 'https://sdk.mercadopago.com/js/v2';

// Carrega o script do MP uma única vez
function loadMpSdk() {
  return new Promise((resolve, reject) => {
    if (window.MercadoPago) return resolve(window.MercadoPago);
    let s = document.querySelector(`script[src="${SDK_URL}"]`);
    if (s) {
      s.addEventListener('load', () => resolve(window.MercadoPago));
      s.addEventListener('error', reject);
      return;
    }
    s = document.createElement('script');
    s.src = SDK_URL;
    s.async = true;
    s.onload = () => resolve(window.MercadoPago);
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

export default function CardPaymentModal({ isOpen, amount, orderPayload, onApproved, onClose, onError }) {
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState('');
  const brickRef = useRef(null);
  const controllerRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !PUBLIC_KEY) return;
    let cancelled = false;

    (async () => {
      try {
        const MercadoPago = await loadMpSdk();
        if (cancelled) return;
        const mp = new MercadoPago(PUBLIC_KEY, { locale: 'pt-BR' });
        const bricks = mp.bricks();
        controllerRef.current = await bricks.create('cardPayment', 'inksa-card-brick', {
          initialization: { amount: Number(amount) },
          callbacks: {
            onReady: () => {},
            onError: (e) => onError?.(e?.message || 'Erro no formulário do cartão.'),
            onSubmit: (formData) => handleSubmit(formData),
          },
        });
      } catch (e) {
        onError?.('Não foi possível carregar o pagamento. Verifique sua conexão.');
      }
    })();

    return () => {
      cancelled = true;
      try { controllerRef.current?.unmount?.(); } catch { /* ignore */ }
      controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, amount]);

  const handleSubmit = (formData) => {
    setProcessing(true);
    setMsg('Processando pagamento...');
    return processCardPayment({
      ...orderPayload,
      token: formData.token,
      payment_method_id: formData.payment_method_id,
      issuer_id: formData.issuer_id,
      installments: formData.installments,
      cliente_email: formData.payer?.email || orderPayload.cliente_email,
      payer_identification: formData.payer?.identification,
    })
      .then((res) => {
        if (res.status === 'approved') {
          setMsg('Pagamento aprovado!');
          onApproved(res.pedido_id);
        } else if (res.status === 'in_process' || res.status === 'pending') {
          setMsg('Pagamento em análise.');
          onApproved(res.pedido_id, 'pending');
        } else {
          setMsg('');
          onError?.(res.detail || 'Pagamento recusado. Tente outro cartão.');
        }
      })
      .catch((e) => {
        setMsg('');
        onError?.(e.message || 'Erro ao processar pagamento.');
      })
      .finally(() => setProcessing(false));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-gray-800">Pagar com cartão</h2>
          <button onClick={onClose} disabled={processing} className="p-2 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-500 mb-3">
            Total: <span className="font-bold text-gray-800">R$ {Number(amount).toFixed(2)}</span>
          </p>

          {!PUBLIC_KEY ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              Pagamento no app indisponível (chave pública do Mercado Pago não configurada).
            </p>
          ) : (
            <div id="inksa-card-brick" ref={brickRef} />
          )}

          {processing && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-3">
              <Loader2 className="w-4 h-4 animate-spin" /> {msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
