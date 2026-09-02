// src/components/CheckoutRapido.jsx
//
// TRÊS CAMPOS NO LUGAR DA TELA DE LOGIN.
//
// O parceiro cola o link curto da loja na bio do Instagram. A pessoa vem de
// lá, monta o carrinho — e batia numa tela de login. É ali que a maior parte
// desiste, logo depois de a gente ter feito o trabalho de trazê-la.
//
// Aqui ela informa nome, telefone e e-mail: dados que teria que dar de
// qualquer jeito para receber comida em casa. A conta nasce por trás, com
// senha aleatória, e ela segue o pedido sem ver nenhuma tela de cadastro.
//
// Quem JÁ tem conta cai no login normal (o servidor devolve 409). Não é
// regressão: hoje essa pessoa já ia para o login de qualquer forma. E é o que
// impede alguém de entrar na conta alheia só digitando o telefone dela.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { CLIENT_API_URL as API } from '../services/api';

export default function CheckoutRapido({ onPronto, addToast }) {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);

  const mascara = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 10) return d.replace(/(\d{0,2})(\d{0,4})(\d{0,4})/, (_, a, b, c) =>
      [a && `(${a}`, a.length === 2 ? ') ' : '', b, c && `-${c}`].filter(Boolean).join(''));
    return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  };

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const r = await fetch(`${API}/api/auth/checkout-rapido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nome, phone: telefone, email }),
      });
      const d = await r.json();

      if (r.status === 409) {
        // Já tem conta: manda pro login com o e-mail preenchido, e o carrinho
        // continua guardado (é local). Explicar o motivo evita a sensação de
        // "o site me barrou do nada".
        addToast?.('info', d.message || 'Você já tem conta. Entre para continuar.');
        navigate('/login', { state: { from: '/carrinho', email: d.email || email } });
        return;
      }
      if (!r.ok || d.status !== 'success') {
        addToast?.('error', d.error === 'conta_existente' ? d.message : (d.error || 'Não foi possível continuar.'));
        return;
      }
      await onPronto(d.data);
    } catch {
      addToast?.('error', 'Sem conexão. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  };

  const campo = 'mt-1 w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary';

  return (
    <form onSubmit={enviar} className="mt-6 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <h3 className="font-bold text-gray-900">Falta só isso para receber seu pedido</h3>
      <p className="text-sm text-gray-500 mt-1">
        Sem senha, sem cadastro. É só o que a gente precisa para entregar e te avisar.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="ck-nome" className="text-sm font-medium text-gray-700">Seu nome</label>
          <input id="ck-nome" className={campo} value={nome} required minLength={2}
                 autoComplete="name" onChange={(e) => setNome(e.target.value)} />
        </div>
        <div>
          <label htmlFor="ck-tel" className="text-sm font-medium text-gray-700">Telefone</label>
          {/* inputMode numeric: no celular abre o teclado de número direto. */}
          <input id="ck-tel" className={campo} value={telefone} required inputMode="numeric"
                 autoComplete="tel" placeholder="(49) 99999-9999"
                 onChange={(e) => setTelefone(mascara(e.target.value))} />
        </div>
        <div>
          <label htmlFor="ck-email" className="text-sm font-medium text-gray-700">E-mail</label>
          <input id="ck-email" className={campo} value={email} required type="email"
                 autoComplete="email" placeholder="voce@email.com"
                 onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>

      <button type="submit" disabled={enviando}
              className="mt-4 w-full min-h-[48px] rounded-lg bg-primary text-white font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
        {enviando ? (<><Loader2 className="h-4 w-4 animate-spin" /> Criando seu acesso…</>) : 'Continuar'}
      </button>

      <p className="mt-3 text-xs text-gray-500">
        O e-mail serve para o comprovante do pedido e para você entrar de novo
        depois. Já tem conta?{' '}
        <button type="button" className="text-primary font-semibold"
                onClick={() => navigate('/login', { state: { from: '/carrinho' } })}>
          Entrar
        </button>
      </p>
    </form>
  );
}
