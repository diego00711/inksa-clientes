// "O indique-e-ganhe aceita código AGORA?"
//
// O PROBLEMA QUE ISTO RESOLVE (achado em 12/10/2026): a faixa de convite, a
// LoginPage e a RegisterPage prometiam "seu primeiro pedido sai sem frete"
// olhando SÓ o código guardado no localStorage. Nenhuma das três perguntava se
// o programa estava ligado. Com ele desligado a promessa continuava na tela, a
// pessoa criava conta por causa dela, e `aplicar_codigo` respondia "o programa
// de indicação está pausado no momento" — a recusa chegava exatamente no
// momento da conversão, que é o pior lugar possível.
//
// Quem decide é o SERVIDOR (`referral_enabled` + janela de datas no admin),
// pelo mesmo motivo do useRifa: se cada tela decidisse por conta, uma delas
// continuaria anunciando campanha encerrada.
//
// ⚠️ ERRA PARA ESCONDER, ao contrário do useRifa.
// Lá, esconder uma campanha de aquisição era o erro. Aqui é o contrário: esta
// faixa faz uma PROMESSA que o backend recusa quando o programa está parado.
// Sem rede, não anunciar custa um convite; anunciar custa uma pessoa que se
// cadastrou achando que ia ter frete grátis.
//
// Uma busca por sessão, em memória do módulo: as três telas perguntam e a
// resposta não muda no meio do uso.
import { useEffect, useState } from 'react';
import { CLIENT_API_URL } from '../services/api';

let cache = null;     // null = ainda não perguntei
let voando = null;

export function limparCacheDaIndicacao() {
  cache = null;
  voando = null;
}

async function buscar() {
  if (cache !== null) return cache;
  if (voando) return voando;
  voando = (async () => {
    try {
      const r = await fetch(`${CLIENT_API_URL}/api/public/app-config`);
      if (!r.ok) return false;
      const j = await r.json();
      // Ausente é DESLIGADO de propósito: backend antigo, sem a flag, não pode
      // fazer o app voltar a prometer o que não entrega.
      cache = j?.indicacao_ligada === true;
      return cache;
    } catch {
      return false;
    } finally {
      voando = null;
    }
  })();
  return voando;
}

/** `true` só quando o servidor confirmou que o programa aceita código agora. */
export function useIndicacaoLigada() {
  const [ligada, setLigada] = useState(cache === true);

  useEffect(() => {
    let vivo = true;
    buscar().then((v) => { if (vivo) setLigada(v === true); });
    return () => { vivo = false; };
  }, []);

  return ligada;
}
