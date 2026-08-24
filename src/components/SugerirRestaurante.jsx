// "Não achou o parceiro que você queria? Diz qual é."
//
// Fala em PARCEIRO, não em restaurante (decisão do Diego, 20/08/2026). A Inksa
// não é só comida: pet shop, padaria, mercado e farmácia cabem no mesmo app, e
// escrever "restaurante" ensina o cliente a NÃO pedir o resto. A palavra que
// aparece na tela é o que delimita o negócio na cabeça de quem lê.
//
// Nasce do problema mais caro que a Inksa tem hoje: o app mostra pouquíssimas
// lojas, e quem abre e não encontra nada desinstala SEM DIZER NADA. É a falha
// que não gera reclamação — a pessoa só some, e a gente nunca fica sabendo o
// que ela queria.
//
// Isto transforma essa saída silenciosa em duas coisas:
//   1. a pessoa sente que foi ouvida (e tem motivo pra voltar);
//   2. o admin ganha uma fila de prospecção ordenada por demanda REAL.
//      Chegar numa loja dizendo "sete clientes meus pediram vocês" não
//      é venda, é recado — e converte muito melhor que falar de comissão.
//
// A LISTA DO QUE JÁ FOI PEDIDO vem antes do campo de texto, e isso é o
// conserto de um problema do primeiro dia de uso: a mesma padaria entrou duas
// vezes, como "Padaria muller" e "Pqdaria mullre". Normalizar junta maiúscula,
// acento e espaço a mais — não conserta letra trocada. Agrupar por semelhança
// seria pior: no dia em que o palpite errar, junta duas lojas diferentes num
// registro só e o número que o Diego leva pro dono da loja passa a ser falso.
// Então não adivinha: mostra o que existe e deixa a pessoa escolher.
//
// NÃO promete prazo. "Vamos atrás" é verdade; "em 7 dias" não seria, e
// promessa quebrada no primeiro contato custa mais que a sugestão vale.
import React, { useEffect, useMemo, useState } from 'react';
import { Store, Check, Loader2, Users } from 'lucide-react';
import { CLIENT_API_URL, createAuthHeaders } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Mesma normalização do servidor, só pra filtrar a lista enquanto digita.
// Quem decide o agrupamento continua sendo o backend.
const chave = (s) =>
  (s || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')  // tira acento depois do NFKD
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export default function SugerirRestaurante({ compacto = false }) {
  const { isAuthenticated } = useAuth();
  const [nome, setNome] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState(null);   // { pedidos, jaTinha, nome }
  const [erro, setErro] = useState('');
  const [existentes, setExistentes] = useState([]);

  // O early return de "não logado" fica DEPOIS de todos os hooks: React não
  // aceita hook atrás de return condicional, e a versão anterior deste arquivo
  // só escapava porque não tinha nenhum hook depois dele.
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let vivo = true;
    fetch(`${CLIENT_API_URL}/api/client/suggestions`, { headers: createAuthHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (vivo && d?.sugestoes) setExistentes(d.sugestoes); })
      .catch(() => { /* sem a lista, a caixa vira só o campo de texto */ });
    return () => { vivo = false; };
  }, [isAuthenticated]);

  const casam = useMemo(() => {
    const k = chave(nome);
    const base = k ? existentes.filter((s) => s.nome_chave.includes(k)) : existentes;
    // Sem texto digitado mostra só as mais pedidas, pra não virar parede.
    return base.slice(0, k ? 4 : 3);
  }, [nome, existentes]);

  const jaEscolhida = existentes.some((s) => s.nome_chave === chave(nome));

  // Só pra quem está logado: sem identificar quem pediu, não dá pra avisar
  // depois que a loja entrou — e esse aviso é a melhor parte da ideia.
  if (!isAuthenticated) return null;

  const enviarNome = async (valor) => {
    const limpo = (valor || '').trim();
    if (limpo.length < 3) { setErro('Escreva o nome do lugar.'); return; }
    setEnviando(true); setErro('');
    try {
      const r = await fetch(`${CLIENT_API_URL}/api/client/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...createAuthHeaders() },
        body: JSON.stringify({ nome: limpo }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || d.erro || 'Não consegui registrar agora.');
      setPronto({ pedidos: d.pedidos || 1, jaTinha: Boolean(d.ja_tinha), nome: limpo });
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
          <Check className="h-5 w-5 shrink-0" />
          {/* Distinguir os dois casos importa: antes o app dizia "anotado, você
              foi a primeira pessoa" pra quem já tinha pedido, e parecia que o
              pedido não contou — quando na verdade tinha contado antes. */}
          {pronto.jaTinha ? 'Você já tinha pedido esse.' : 'Anotado. Vamos atrás.'}
        </p>
        <p className="mt-1 text-sm text-green-700">
          {pronto.pedidos > 1
            // Prova social verdadeira: o número vem do banco, não é enfeite.
            ? `Você e mais ${pronto.pedidos - 1} ${pronto.pedidos - 1 === 1 ? 'pessoa pediram' : 'pessoas pediram'} esse lugar.`
            : 'Você foi a primeira pessoa a pedir esse aqui.'}
          {' '}Se ele entrar, a gente te avisa.
        </p>
        <button
          onClick={() => setPronto(null)}
          className="mt-3 text-sm font-semibold text-green-800 underline underline-offset-2"
        >
          Pedir outro
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); enviarNome(nome); }}
      className="rounded-xl border border-orange-200 bg-orange-50 p-4"
    >
      <p className="flex items-center gap-2 font-bold text-orange-900">
        <Store className="h-5 w-5 shrink-0" />
        {compacto ? 'Falta algum parceiro?' : 'Não achou o parceiro que você queria?'}
      </p>
      <p className="mt-1 text-sm text-orange-800">
        Restaurante, pet shop, padaria, mercado, farmácia. Diz qual é que a gente
        vai atrás — ir buscar é literalmente o nosso trabalho.
      </p>

      {casam.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-700/70">
            {nome.trim() ? 'Já pediram esses' : 'Os mais pedidos'}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {casam.map((s) => (
              <button
                key={s.nome_chave}
                type="button"
                disabled={enviando}
                // Manda o nome exatamente como já está gravado: é isso que faz
                // o contador subir em vez de nascer uma linha nova.
                onClick={() => enviarNome(s.nome)}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-orange-300 bg-white px-3 py-1.5 text-xs font-semibold text-orange-900 hover:bg-orange-100 disabled:opacity-60"
              >
                <span className="truncate">{s.nome}</span>
                <span className="inline-flex shrink-0 items-center gap-0.5 text-orange-600">
                  <Users className="h-3 w-3" />{s.pedidos}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-orange-700/70">
            Toque em um pra somar o seu pedido ao dele.
          </p>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={nome}
          onChange={(e) => { setNome(e.target.value); if (erro) setErro(''); }}
          placeholder="Ex.: padaria, pet shop, restaurante…"
          maxLength={120}
          aria-label="Nome do parceiro que você gostaria de encontrar no app"
          className="min-h-[44px] flex-1 rounded-lg border border-orange-300 bg-white px-3 text-sm text-gray-800 outline-none focus:border-orange-500"
        />
        <button
          type="submit"
          disabled={enviando}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-60"
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {enviando ? 'Enviando' : jaEscolhida ? 'Somar o meu' : 'Enviar'}
        </button>
      </div>
      {erro && <p className="mt-2 text-sm font-semibold text-red-600">{erro}</p>}
    </form>
  );
}
