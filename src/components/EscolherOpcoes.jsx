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

  const alternar = (grupo, opcao) => {
    setErro('');
    setEscolhas((atual) => {
      const jaTem = (atual[grupo.id] || []).some((o) => o.id === opcao.id);
      const lista = jaTem
        ? atual[grupo.id].filter((o) => o.id !== opcao.id)
        : [...(atual[grupo.id] || []), { ...opcao, grupo: grupo.nome }];

      // Grupo de escolha única troca em vez de acumular — é o que a pessoa
      // espera ao tocar em outra opção, e evita ela ter que desmarcar antes.
      if (!jaTem && grupo.max_escolhas === 1) {
        return { ...atual, [grupo.id]: [{ ...opcao, grupo: grupo.nome }] };
      }
      if (lista.length > grupo.max_escolhas) return atual;
      return { ...atual, [grupo.id]: lista };
    });
  };

  const todas = useMemo(() => Object.values(escolhas).flat(), [escolhas]);
  const extra = todas.reduce((s, o) => s + Number(o.preco_extra || 0), 0);
  const totalLinha = (Number(item.price || 0) + extra) * quantidade;

  const faltando = (grupos || []).filter(
    (g) => (escolhas[g.id] || []).length < g.min_escolhas,
  );

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
                    const marcada = marcadas.some((m) => m.id === o.id);
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => alternar(g, o)}
                        className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                          marcada
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-orange-300'}`}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                            marcada ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>
                            {marcada && <Check className="h-3 w-3 text-white" />}
                          </span>
                          <span className="truncate text-sm text-gray-800">{o.nome}</span>
                        </span>
                        {Number(o.preco_extra) > 0 && (
                          <span className="shrink-0 text-sm font-semibold text-orange-700">
                            + {brl(o.preco_extra)}
                          </span>
                        )}
                      </button>
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
