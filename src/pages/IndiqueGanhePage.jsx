// Indique e ganhe.
//
// O QUE FAZ ESTA TELA FUNCIONAR NÃO É O CÓDIGO — É O BOTÃO DE COMPARTILHAR.
// Em cidade pequena a distribuição é grupo de WhatsApp. Um código que a pessoa
// precisa decorar e digitar não circula; uma mensagem pronta, com o código já
// dentro, circula. Por isso o WhatsApp é o botão grande e o "copiar" é o
// secundário.
//
// A regra do dinheiro mora toda no backend (utils/referrals.py). Aqui só se
// mostra o que ele devolve — inclusive os valores, que vêm de lá pra tela não
// prometer R$ 5 no dia em que o Diego mudar pra R$ 7 no servidor.
import React, { useCallback, useEffect, useState } from 'react';
import { Gift, Copy, Check, Share2, Loader2, Users, Ticket } from 'lucide-react';
import { CLIENT_API_URL, createAuthHeaders } from '../services/api';

const brl = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function IndiqueGanhePage() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [codigoAmigo, setCodigoAmigo] = useState('');
  const [aplicando, setAplicando] = useState(false);
  const [aviso, setAviso] = useState(null);

  const carregar = useCallback(async () => {
    try {
      const r = await fetch(`${CLIENT_API_URL}/api/referrals/meu`, { headers: createAuthHeaders() });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Não consegui carregar.');
      setDados(j.data);
    } catch (e) {
      setErro(e.message || 'Não consegui carregar.');
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  // O LINK CARREGA O CÓDIGO (?ref=). Quem clica não precisa digitar, decorar
  // nem lembrar de nada: o app captura sozinho e aplica quando ele logar. O
  // código continua escrito na mensagem só pra quem preferir digitar na mão —
  // e pra pessoa entender o que está mandando.
  const link = dados ? `https://clientes.inksadelivery.com.br/?ref=${dados.codigo}` : '';
  const mensagem = dados
    ? `Tô usando o Inksa pra pedir comida aqui na cidade e tá muito bom. `
      + `Entra por esse link que seu primeiro pedido sai SEM FRETE: ${link} `
      + `(ou usa o código ${dados.codigo} no cadastro)`
    : '';

  // Copia o LINK, não só o código: colado em qualquer lugar ele já funciona
  // sozinho, sem a outra pessoa precisar saber onde digitar o código.
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setAviso({ tipo: 'erro', texto: 'Não consegui copiar. Anote: ' + dados.codigo });
    }
  };

  // wa.me abre o WhatsApp no celular e o Web no computador — um link só serve
  // os dois, e não depende de nada instalado.
  const compartilhar = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank', 'noopener');
  };

  const aplicar = async () => {
    setAplicando(true);
    setAviso(null);
    try {
      const r = await fetch(`${CLIENT_API_URL}/api/referrals/aplicar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...createAuthHeaders() },
        body: JSON.stringify({ code: codigoAmigo }),
      });
      const j = await r.json();
      if (j?.ok) {
        setAviso({ tipo: 'ok', texto: `${j.mensagem} Use o código ${j.cupom} no checkout.` });
        setCodigoAmigo('');
      } else {
        setAviso({ tipo: 'erro', texto: j?.erro || j?.error || 'Não consegui aplicar.' });
      }
    } catch (e) {
      setAviso({ tipo: 'erro', texto: e.message || 'Não consegui aplicar.' });
    } finally {
      setAplicando(false);
    }
  };

  if (erro) return <p className="p-6 text-center text-red-600">{erro}</p>;
  if (!dados) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
      </div>
    );
  }

  const noTeto = dados.no_mes >= dados.teto_mensal;

  return (
    <div className="mx-auto max-w-lg p-4 pb-24">
      <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white shadow-xl">
        <Gift className="mb-2 h-8 w-8" />
        <h1 className="text-2xl font-black leading-tight">Indique e ganhe</h1>
        <p className="mt-1 text-white/90 text-sm">
          Seu amigo ganha <strong>frete grátis</strong> no primeiro pedido.
          Você ganha <strong>{brl(dados.valor_indicacao)}</strong> quando ele receber.
        </p>

        <div className="mt-5 rounded-xl bg-white/15 p-4 text-center">
          <p className="text-xs uppercase tracking-widest text-white/70">Seu código</p>
          <p className="my-1 text-3xl font-black tracking-[0.2em]">{dados.codigo}</p>
        </div>

        <button
          onClick={compartilhar}
          className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-white text-base font-bold text-orange-700 hover:bg-orange-50"
        >
          <Share2 className="h-5 w-5" /> Enviar no WhatsApp
        </button>
        <button
          onClick={copiar}
          className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/40 text-sm font-semibold text-white hover:bg-white/10"
        >
          {copiado ? <><Check className="h-4 w-4" /> Link copiado!</> : <><Copy className="h-4 w-4" /> Copiar link do convite</>}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <Users className="mb-1 h-5 w-5 text-orange-500" />
          <p className="text-2xl font-black text-gray-900">{dados.premiadas}</p>
          <p className="text-xs text-gray-500">amigos que já pediram</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <Ticket className="mb-1 h-5 w-5 text-orange-500" />
          <p className="text-2xl font-black text-gray-900">{brl(dados.ganho_total)}</p>
          <p className="text-xs text-gray-500">que você já ganhou</p>
        </div>
      </div>

      {/* Indicação que ainda não virou prêmio. Mostrar isso evita o "indiquei e
          não ganhei nada": a pessoa vê que está registrado e falta o amigo
          pedir — que é bem diferente de achar que o programa não funciona. */}
      {dados.pendentes > 0 && (
        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          {dados.pendentes} amigo{dados.pendentes > 1 ? 's' : ''} já usou seu código mas ainda
          não fez o primeiro pedido. O prêmio cai quando o pedido for entregue.
        </p>
      )}

      {/* OS CUPONS FICAM AQUI, e não só na notificação. Push é dispensado,
          celular é trocado — e aí a pessoa ganhou um cupom que não tem onde
          procurar, e conclui que não recebeu nada. Os usados e vencidos
          continuam na lista: sumir com eles faria parecer que nunca existiram. */}
      {dados.cupons?.length > 0 && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
          <p className="mb-3 font-semibold text-gray-800">Seus cupons</p>
          <ul className="space-y-2">
            {dados.cupons.map((c) => {
              const inativo = c.usado || c.vencido;
              return (
                <li key={c.codigo}
                    className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
                      inativo ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-orange-200 bg-orange-50'}`}>
                  <div className="min-w-0">
                    <p className={`font-bold tracking-widest ${inativo ? 'text-gray-500 line-through' : 'text-orange-700'}`}>
                      {c.codigo}
                    </p>
                    <p className="text-xs text-gray-500">
                      {c.tipo === 'free_delivery' ? 'Frete grátis' : brl(c.valor)}
                      {c.minimo > 0 && ` · a partir de ${brl(c.minimo)}`}
                      {c.vence_em && ` · até ${new Date(c.vence_em).toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-gray-500">
                    {c.usado ? 'usado' : c.vencido ? 'vencido' : 'disponível'}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-gray-500">
            Digite o código no carrinho, no campo “Cupom”. Vale um cupom por pedido.
          </p>
        </div>
      )}

      {noTeto && (
        <p className="mt-3 rounded-xl bg-gray-100 p-3 text-sm text-gray-600">
          Você já bateu o limite de {dados.teto_mensal} indicações premiadas neste mês.
          Pode continuar indicando — os prêmios voltam no mês que vem.
        </p>
      )}

      <p className="mt-3 text-center text-xs text-gray-400">
        Seus cupons de indicação valem em pedidos a partir de {brl(dados.minimo_de_compra)} e
        vencem em 30 dias. Vale um cupom por pedido.
      </p>

      {/* Só faz sentido pra quem ainda não pediu — o backend recusa os demais e
          explica o porquê, então a tela não precisa esconder e errar. */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
        <p className="font-semibold text-gray-800">Alguém te indicou?</p>
        <p className="mb-3 text-sm text-gray-500">
          Digite o código antes do seu primeiro pedido pra ganhar frete grátis.
        </p>
        <div className="flex gap-2">
          <input
            value={codigoAmigo}
            onChange={(e) => setCodigoAmigo(e.target.value.toUpperCase())}
            placeholder="INKABC123"
            className="min-h-[44px] flex-1 rounded-lg border border-gray-300 px-3 uppercase tracking-widest outline-none focus:border-orange-500"
          />
          <button
            onClick={aplicar}
            disabled={aplicando || !codigoAmigo.trim()}
            className="min-h-[44px] rounded-lg bg-orange-600 px-5 font-bold text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {aplicando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Usar'}
          </button>
        </div>
        {aviso && (
          <p className={`mt-2 text-sm font-medium ${aviso.tipo === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
            {aviso.texto}
          </p>
        )}
      </div>
    </div>
  );
}
