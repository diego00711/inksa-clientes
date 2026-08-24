// Escolha de opções do item: corte, molho, adicionais.
//
// Pedido da Yo!Frango (24/08/2026): o cardápio só tinha item e preço, e quem
// vende frango precisa perguntar o corte. Sem isso, a saída era cadastrar um
// item por variação — cardápio de 12 linhas pra 3 pratos.
//
// DUAS COISAS QUE ESTA TELA NÃO PODE ERRAR:
//
// 1. O botão de confirmar fica DESLIGADO enquanto faltar escolha obrigatória,
//    e diz o que falta. Deixar passar sem escolher significa comanda sem o
//    corte — e a cozinha adivinhando.
//
// 2. O preço mostrado aqui é só o que o cliente VÊ. Quem decide quanto custa é
//    o servidor, que recalcula por id da opção. Se algum dia os dois
//    divergirem, quem vale é o de lá.
import React, { useEffect, useMemo, useState } from 'react';
import { X, Loader2, Check } from 'lucide-react';
import { CLIENT_API_URL, createAuthHeaders } from '../services/api';

const brl = (v) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;

export default function EscolherOpcoes({ item, quantidade = 1, onConfirmar, onFechar }) {
  const [grupos, setGrupos] = useState(null);   // null = carregando
  const [escolhas, setEscolhas] = useState({}); // grupoId -> [opcao]
  const [erro, setErro] = useState('');

  useEffect(() => {
    let vivo = true;
    fetch(`${CLIENT_API_URL}/api/menu/items/${item.id}/opcoes`, { headers: createAuthHeaders() })
      .then((r) => (r.ok ? r.json() : { grupos: [] }))
      .then((d) => { if (vivo) setGrupos(d.grupos || []); })
      .catch(() => { if (vivo) setGrupos([]); });
    return () => { vivo = false; };
  }, [item.id]);

  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onFechar(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onFechar]);

  // Item SEM opção nenhuma vai direto pro carrinho: quem vende só cafezinho
  // não pode ganhar um passo a mais por causa de um recurso que não usa.
  useEffect(() => {
    if (grupos && grupos.length === 0) onConfirmar([]);
  }, [grupos, onConfirmar]);

  // Quantas UNIDADES já foram marcadas no grupo. Com quantidade por opção,
  // "até 3" passa a contar unidades: 3 bananas ocupam o limite inteiro, que é
  // como qualquer pessoa lê "escolha até 3".
  const unidades = (gid) => (escolhas[gid] || []).reduce((s, o) => s + (o.qtd || 1), 0);

  const alternar = (grupo, opcao) => {
    setErro('');
    setEscolhas((atual) => {
      const lista = atual[grupo.id] || [];
      const jaTem = lista.some((o) => o.id === opcao.id);

      // Escolha única troca em vez de acumular — é o que a pessoa espera ao
      // tocar em outra opção, e evita ter que desmarcar antes.
      if (grupo.max_escolhas === 1) {
        return { ...atual, [grupo.id]: jaTem ? [] : [{ ...opcao, grupo: grupo.nome, qtd: 1 }] };
      }
      if (jaTem) {
        return { ...atual, [grupo.id]: lista.filter((o) => o.id !== opcao.id) };
      }
      const usadas = lista.reduce((s, o) => s + (o.qtd || 1), 0);
      if (usadas + 1 > grupo.max_escolhas) return atual;
      return { ...atual, [grupo.id]: [...lista, { ...opcao, grupo: grupo.nome, qtd: 1 }] };
    });
  };

  /** Mais ou menos uma unidade da MESMA opção (3 de banana). */
  const mudarQtd = (grupo, opcao, passo) => {
    setErro('');
    setEscolhas((atual) => {
      const lista = atual[grupo.id] || [];
      const alvo = lista.find((o) => o.id === opcao.id);
      if (!alvo) return atual;
      const nova = (alvo.qtd || 1) + passo;
      if (nova <= 0) {
        return { ...atual, [grupo.id]: lista.filter((o) => o.id !== opcao.id) };
      }
      const usadas = lista.reduce((s, o) => s + (o.qtd || 1), 0);
      if (passo > 0 && usadas + 1 > grupo.max_escolhas) return atual;
      return {
        ...atual,
        [grupo.id]: lista.map((o) => (o.id === opcao.id ? { ...o, qtd: nova } : o)),
      };
    });
  };

  const todas = useMemo(() => Object.values(escolhas).flat(), [escolhas]);
  const extra = todas.reduce((s, o) => s + Number(o.preco_extra || 0) * (o.qtd || 1), 0);
  const totalLinha = (Number(item.price || 0) + extra) * quantidade;

  // Conta UNIDADES, não linhas: quem pôs 2 de banana num grupo que exige 2 já
  // cumpriu, mesmo tendo marcado uma opção só.
  const faltando = (grupos || []).filter((g) => unidades(g.id) < g.min_escolhas);

  const confirmar = () => {
    if (faltando.length) {
      setErro(`Escolha: ${faltando.map((g) => g.nome).join(', ')}`);
      return;
    }
    onConfirmar(todas);
  };

  // Enquanto não sabe se há opções, não desenha nada. Sem isto, todo item
  // piscaria um modal "carregando" antes de cair no carrinho.
  if (grupos === null || grupos.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 sm:items-center"
         onClick={onFechar} role="dialog" aria-modal="true" aria-label={`Opções de ${item.name}`}>
      <div onClick={(e) => e.stopPropagation()}
           className="flex max-h-[88vh] w-full max-w-md flex-col rounded-t-2xl bg-white sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-gray-900">{item.name}</h3>
            <p className="text-sm text-gray-500">{brl(item.price)}</p>
          </div>
          <button onClick={onFechar} className="rounded p-1 text-gray-400 hover:bg-gray-100"
                  aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {grupos === null && (
            <p className="flex items-center gap-2 py-6 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando opções…
            </p>
          )}

          {grupos?.map((g) => {
            const marcadas = escolhas[g.id] || [];
            return (
              <div key={g.id} className="mb-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-semibold text-gray-800">{g.nome}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    g.min_escolhas > 0
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-500'}`}>
                    {g.min_escolhas > 0 ? 'obrigatório' : 'opcional'}
                    {g.max_escolhas > 1 ? ` · até ${g.max_escolhas}` : ''}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {g.opcoes.filter((o) => o.disponivel).map((o) => {
                    const escolhida = marcadas.find((m) => m.id === o.id);
                    const marcada = Boolean(escolhida);
                    // Só grupo de várias ganha +/-: em "escolher 1" a
                    // quantidade não faz sentido e só polui a tela.
                    const podeRepetir = marcada && g.max_escolhas > 1;
                    return (
                      <div
                        key={o.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => alternar(g, o)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternar(g, o); } }}
                        className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                          marcada
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-orange-300'}`}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                            marcada ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>
                            {marcada && <Check className="h-3 w-3 text-white" />}
                          </span>
                          {/* Foto quando a loja subiu. Morango e banana se
                              escolhem pelo olho; sem foto, a linha continua
                              inteira em texto e nada fica torto. */}
                          {o.imagem_url && (
                            <img src={o.imagem_url} alt="" loading="lazy"
                                 className="h-9 w-9 shrink-0 rounded-md object-cover" />
                          )}
                          <span className="truncate text-sm text-gray-800">{o.nome}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          {Number(o.preco_extra) > 0 && (
                            <span className="text-sm font-semibold text-orange-700">
                              + {brl(o.preco_extra)}
                            </span>
                          )}
                          {/* "Açaí com 3 de banana": a mesma opção, três vezes.
                              stopPropagation porque a linha inteira já é o
                              botão de marcar — sem isso, tocar no + marcaria e
                              desmarcaria junto. */}
                          {podeRepetir && (
                            <span
                              className="flex items-center gap-1.5 rounded-full bg-white px-1 py-0.5 ring-1 ring-orange-300"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => mudarQtd(g, o, -1)}
                                aria-label={`Menos um ${o.nome}`}
                                className="grid h-7 w-7 place-items-center rounded-full text-orange-700 hover:bg-orange-100"
                              >−</button>
                              <span className="min-w-[1.1rem] text-center text-sm font-bold tabular-nums text-orange-900">
                                {escolhida.qtd || 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => mudarQtd(g, o, +1)}
                                disabled={unidades(g.id) >= g.max_escolhas}
                                aria-label={`Mais um ${o.nome}`}
                                className="grid h-7 w-7 place-items-center rounded-full text-orange-700 hover:bg-orange-100 disabled:opacity-30"
                              >+</button>
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {grupos?.length === 0 && (
            <p className="py-6 text-sm text-gray-500">Este item não tem opções.</p>
          )}
        </div>

        <div className="border-t border-gray-100 p-4">
          {erro && <p className="mb-2 text-sm font-semibold text-red-600">{erro}</p>}
          <button
            onClick={confirmar}
            disabled={grupos === null || faltando.length > 0}
            className="flex min-h-[48px] w-full items-center justify-between rounded-xl bg-orange-600 px-4 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50"
          >
            <span>
              {faltando.length
                ? `Escolha ${faltando[0].nome}`
                : `Adicionar${quantidade > 1 ? ` ${quantidade}x` : ''}`}
            </span>
            <span>{brl(totalLinha)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
