// Tela de pagamento PIX dentro do app (sem redirecionar pro checkout do Asaas).
// Mostra o QR + copia-e-cola e fica checando o status do pedido; quando o
// webhook do Asaas confirma o pagamento (awaiting_payment -> pending), navega
// pra tela de acompanhamento. Se o QR não vier, o CartPage nem abre esta tela
// (cai no checkout hospedado como antes).
import { useEffect, useRef, useState, useCallback } from 'react';
import { Copy, Check, Loader2, QrCode, X, ExternalLink } from 'lucide-react';
import { getOrderCodes } from '../services/orderService';

const money = (v) =>
  (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function PixPaymentModal({ pix, orderId, amount, checkoutLink, onPaid, onClose }) {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const paidRef = useRef(false);

  const payload = pix?.payload || '';
  const img = pix?.encoded_image ? `data:image/png;base64,${pix.encoded_image}` : null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      // WebView antigo: fallback com textarea + execCommand
      const ta = document.createElement('textarea');
      ta.value = payload; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch { /* ignore */ }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Confere o status do pedido; ao sair de "awaiting_payment", pagamento entrou.
  const checkStatus = useCallback(async () => {
    if (paidRef.current || !orderId) return;
    try {
      const { status } = await getOrderCodes(orderId);
      if (status && status !== 'awaiting_payment') {
        paidRef.current = true;
        onPaid();
      }
    } catch {
      // rede instável: ignora e tenta de novo no próximo ciclo
    }
  }, [orderId, onPaid]);

  const checkNow = async () => {
    setChecking(true);
    await checkStatus();
    setTimeout(() => setChecking(false), 600);
  };

  useEffect(() => {
    const t = setInterval(checkStatus, 4000);
    return () => clearInterval(t);
  }, [checkStatus]);

  return (
    <div className="fixed inset-0 z-[2000] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Fechar"
        >
          <X size={22} />
        </button>

        <div className="p-5 sm:p-6 text-center">
          <div className="inline-flex items-center gap-2 text-[#FF6F00] font-bold">
            <QrCode className="w-5 h-5" /> Pague com PIX
          </div>
          <p className="text-2xl font-black text-gray-900 mt-1">{money(amount)}</p>
          <p className="text-sm text-gray-500 mt-1">Escaneie o QR Code ou use o copia-e-cola.</p>

          {img ? (
            <img
              src={img}
              alt="QR Code PIX"
              className="mx-auto mt-4 w-56 h-56 rounded-xl border border-gray-100"
            />
          ) : (
            <div className="mx-auto mt-4 w-56 h-56 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-sm">
              QR indisponível — use o código abaixo
            </div>
          )}

          <button
            onClick={copy}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-[#FF6F00] hover:bg-[#e56500] text-white font-bold rounded-xl py-3 transition-colors"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? 'Código copiado!' : 'Copiar código PIX'}
          </button>

          <p className="mt-2 text-[11px] text-gray-400 break-all px-2 leading-snug">{payload}</p>

          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600 bg-amber-50 rounded-lg py-2.5 px-3">
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            Aguardando confirmação do pagamento…
          </div>

          <button
            onClick={checkNow}
            disabled={checking}
            className="mt-3 text-sm font-medium text-[#FF6F00] hover:underline disabled:opacity-50"
          >
            {checking ? 'Verificando…' : 'Já paguei — verificar agora'}
          </button>

          {checkoutLink && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <a
                href={checkoutLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
              >
                Ter problemas? Abrir a página de pagamento <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          <p className="mt-3 text-[11px] text-gray-400">
            Assim que o pagamento cair, você vai direto pro acompanhamento do pedido. Pode
            deixar esta tela aberta.
          </p>
        </div>
      </div>
    </div>
  );
}
