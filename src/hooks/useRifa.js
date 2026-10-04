// "Existe campanha de números agora, e quantos eu tenho?"
//
// Quem decide se a campanha existe é o SERVIDOR, não o app. Com a campanha
// desligada a rota devolve `{ligada: false}` e tudo some: o item do menu e a
// tela. Se cada app decidisse por conta, um deles continuaria anunciando uma
// promoção encerrada depois que ela acabasse.
//
// ⚠️ A campanha nasce desligada e só liga depois da autorização do sorteio.
// Então o estado NORMAL deste hook, hoje, é `ligada: false` — e isso não é
// erro nem falha de rede.
//
// Uma busca por sessão: o resultado fica em memória do módulo, porque o
// cabeçalho pergunta em toda tela e a resposta não muda no meio do uso.
import { useEffect, useState } from 'react';
import { CLIENT_API_URL, createAuthHeaders } from '../services/api';

const VAZIO = { ligada: false, numeros: [], total: 0 };

let cache = null;
let voando = null;

export function limparCacheDaRifa() {
  cache = null;
  voando = null;
}

async function buscar() {
  if (cache) return cache;
  if (voando) return voando;
  voando = (async () => {
    try {
      const r = await fetch(`${CLIENT_API_URL}/api/client/rifa`, { headers: createAuthHeaders() });
      if (!r.ok) return VAZIO;          // 401 de visitante cai aqui, e é silencioso
      const j = await r.json();
      cache = j?.data || VAZIO;
      return cache;
    } catch {
      // Sem rede: trata como "não sei", e o app segue sem a seção. Errar pro
      // lado de esconder é melhor que anunciar campanha que pode não existir.
      return VAZIO;
    } finally {
      voando = null;
    }
  })();
  return voando;
}

export function useRifa() {
  const [dados, setDados] = useState(cache || VAZIO);
  const [carregando, setCarregando] = useState(!cache);

  useEffect(() => {
    let vivo = true;
    buscar().then((d) => {
      if (!vivo) return;
      setDados(d);
      setCarregando(false);
    });
    return () => { vivo = false; };
  }, []);

  return { ...dados, carregando };
}
