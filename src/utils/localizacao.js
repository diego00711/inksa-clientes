import { Capacitor } from '@capacitor/core';

/**
 * Pega a posição do aparelho. Uma função só, usada por todo mundo.
 *
 * ── POR QUE DAVA ERRO NO IPHONE MESMO COM A LOCALIZAÇÃO LIGADA ──────────────
 *
 * O código antigo fazia isto, em toda tela que pedia localização:
 *
 *     const { Geolocation } = await import('@capacitor/geolocation');
 *     try { await Geolocation.requestPermissions(); } catch {}
 *     await Geolocation.getCurrentPosition(...)      // e só no catch caía
 *     ...                                            // no navigator.geolocation
 *
 * São TRÊS `await` antes de o navegador ver o pedido de localização. E o
 * Safari do iOS exige que `getCurrentPosition` seja chamado DENTRO do gesto
 * do usuário — o toque no botão. Depois de um import dinâmico (que vai buscar
 * um arquivo na rede) o gesto já expirou: o Safari não mostra o pedido de
 * permissão e recusa a chamada. Do lado de fora isso aparece como "erro" num
 * aparelho onde a localização está claramente ligada, que foi exatamente o
 * relato do Diego em 29/08/2026.
 *
 * No Android não doía porque o WebView do Chrome não é rígido com o gesto.
 *
 * A CORREÇÃO: decidir a plataforma com `Capacitor.isNativePlatform()`, que é
 * SÍNCRONO, e no navegador chamar `navigator.geolocation` sem NENHUM await
 * antes. O gesto chega inteiro.
 *
 * ⚠️ Quem chamar esta função a partir de um clique NÃO pode colocar `await`
 * antes dela. `await fetch(...)` antes de `obterCoordenadas()` recria o mesmo
 * bug, e ele só aparece no iPhone.
 *
 * ── SEGUNDA ARMADILHA DO IOS: PRECISÃO ALTA QUE NUNCA RESPONDE ─────────────
 *
 * Com `enableHighAccuracy: true` dentro de prédio, o iOS espera o GPS de
 * satélite e frequentemente estoura o tempo sem devolver nada — mesmo com o
 * Wi-Fi sabendo perfeitamente onde a pessoa está. Por isso aqui são DUAS
 * tentativas: precisão alta e curta primeiro, depois precisão de rede com
 * prazo maior. Para entregar comida, o ponto do Wi-Fi serve.
 */

const ALTA = { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 };
const REDE = { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 };

function ehIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    // iPad moderno se apresenta como Mac; o toque é o que o denuncia.
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** Mensagem que diz O QUE FAZER, não só o que falhou. */
function mensagemDeErro(code) {
  if (code === 1) {
    return ehIOS()
      ? 'Permissão de localização negada. No iPhone: Ajustes → Privacidade e '
        + 'Segurança → Serviços de Localização → Safari, e marque "Ao Usar o App". '
        + 'Depois recarregue esta página e toque de novo.'
      : 'Permissão de localização negada. Habilite nas configurações do navegador.';
  }
  if (code === 2) return 'Não foi possível obter sua localização. Verifique se o GPS está ligado.';
  if (code === 3) return 'O GPS demorou demais para responder. Tente de novo, de preferência perto de uma janela.';
  return 'Não foi possível obter sua localização.';
}

function pedirAoNavegador(opcoes) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Este aparelho não suporta localização.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (err) => reject(Object.assign(new Error(mensagemDeErro(err?.code)), { code: err?.code })),
      opcoes,
    );
  });
}

/**
 * @returns {Promise<{lat:number, lng:number}>}
 * @throws {Error} com mensagem pronta pra mostrar na tela.
 */
export async function obterCoordenadas() {
  // NATIVO (APK): o plugin cuida da permissão do sistema operacional.
  if (Capacitor.isNativePlatform()) {
    const { Geolocation } = await import('@capacitor/geolocation');
    try { await Geolocation.requestPermissions(); } catch { /* já concedida */ }
    try {
      const p = await Geolocation.getCurrentPosition(ALTA);
      return { lat: p.coords.latitude, lng: p.coords.longitude };
    } catch {
      const p = await Geolocation.getCurrentPosition(REDE);
      return { lat: p.coords.latitude, lng: p.coords.longitude };
    }
  }

  // NAVEGADOR: sem nenhum await antes daqui — é o que preserva o gesto no iOS.
  try {
    return await pedirAoNavegador(ALTA);
  } catch (e) {
    // Permissão negada não melhora tentando de novo: repetir só gasta o tempo
    // da pessoa e, no iOS, nem mostra o pedido outra vez.
    if (e?.code === 1) throw e;
    return pedirAoNavegador(REDE);
  }
}
