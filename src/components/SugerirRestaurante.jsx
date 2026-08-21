// "Não achou o seu restaurante? Diz qual é."
//
// Nasce do problema mais caro que a Inksa tem hoje: o app mostra pouquíssimas
// lojas, e quem abre e não encontra nada desinstala SEM DIZER NADA. É a falha
// que não gera reclamação — a pessoa só some, e a gente nunca fica sabendo o
// que ela queria.
//
// Isto transforma essa saída silenciosa em duas coisas:
//   1. a pessoa sente que foi ouvida (e tem motivo pra voltar);
//   2. o admin ganha uma fila de prospecção ordenada por demanda REAL.
//      Chegar num restaurante dizendo "sete clientes meus pediram vocês" não
//      é venda, é recado — e converte muito melhor que falar de comissão.
//
// NÃO promete prazo. "Vamos atrás" é verdade; "em 7 dias" não seria, e
// promessa quebrada no primeiro contato custa mais que a sugestão vale.
import React, { useState } from 'react';
import { Store, Check, Loader2 } from 'lucide-react';
import { CLIENT_API_URL, createAuthHeaders } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SugerirRestaurante({ compacto = false }) {
  const { isAuthenticated } = useAuth();
  const [nome, setNome] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState(null);   // { pedidos } quando deu certo
  const [erro, setErro] = useState('');

  // Só pra quem está logado: sem identificar quem pediu, não dá pra avisar
  // depois que a loja entrou — e esse aviso é a melhor parte da ideia.
  if (!isAuthenticated) return null;

  const enviar = async (e) => {
    e.preventDefault();
    const limpo = nome.trim();
    if (limpo.length < 3) { setErro('Escreva o nome do restaurante.'); return; }
    setEnviando(true); setErro('');
    try {
      const r = await fetch(`${CLIENT_API_URL}/api/client/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...createAuthHeaders() },
        body: JSON.stringify({ nome: limpo }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || d.erro || 'Não consegui registrar agora.');
      setPronto({ pedidos: d.pedidos || 1 });
      setNome('');
    } catch (e2) {
      setErro(e2.message || 'Não consegui registrar agora.');
    } finally {
      setEnviando(false);
    }
  };

  if (pronto) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4">
        <p className="flex items-center gap-2 font-bold text-green-800">
          <Check className="h-5 w-5 shrink-0" /> Anotado. Vamos atrás.
        </p>
        <p className="mt-1 text-sm text-green-700">
          {pronto.pedidos > 1
            // Prova social verdadeira: o número vem do banco, não é enfeite.
            // "Você e mais 6" faz a pessoa sentir que o pedido tem força.
            ? `Você e mais ${pronto.pedidos - 1} ${pronto.pedidos - 1 === 1 ? 'pessoa pediram' : 'pessoas pediram'} esse restaurante.`
            : 'Você foi a primeira pessoa a pedir esse aqui.'}
          {' '}Se ele entrar, a gente te avisa.
        </p>
        <button
          onClick={() => setPronto(null)}
          className="mt-3 text-sm font-semibold text-green-800 underline underline-offset-2"
        >
          Sugerir outro
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="rounded-xl border border-orange-200 bg-orange-50 p-4">
      <p className="flex items-center gap-2 font-bold text-orange-900">
        <Store className="h-5 w-5 shrink-0" />
        {compacto ? 'Falta algum restaurante?' : 'Não achou o seu restaurante favorito?'}
      </p>
      <p className="mt-1 text-sm text-orange-800">
        Diz qual é que a gente vai atrás. Ir buscar é literalmente o nosso trabalho.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={nome}
          onChange={(e) => { setNome(e.target.value); if (erro) setErro(''); }}
          placeholder="Nome do restaurante"
          maxLength={120}
          aria-label="Nome do restaurante que você gostaria de encontrar"
          className="min-h-[44px] flex-1 rounded-lg border border-orange-300 bg-white px-3 text-sm text-gray-800 outline-none focus:border-orange-500"
        />
        <button
          type="submit"
          disabled={enviando}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-60"
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {enviando ? 'Enviando' : 'Enviar'}
        </button>
      </div>
      {erro && <p className="mt-2 text-sm font-semibold text-red-600">{erro}</p>}
    </form>
  );
}
