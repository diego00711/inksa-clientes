// DE ONDE ESTA PESSOA VEIO (?de=guga na URL).
//
// Irmão de utils/indicacao.js e pelo mesmo motivo: o link chega por fora
// (post do Instagram, rádio, panfleto com QR) e a pessoa ainda não tem conta.
// O código precisa SOBREVIVER a abrir o link, cadastrar, confirmar e-mail,
// voltar e logar. Nada disso cabe em estado de componente.
//
// ⚠️ NÃO CONFUNDIR COM ?ref=. São coisas separadas de propósito:
//   ?ref=  indique e ganhe — um CLIENTE indicou outro, e vale R$5 pra ele.
//   ?de=   campanha — de onde veio a visita. Não paga nada a ninguém.
// Um link pode ter os dois. Misturar os dois num campo só faria a campanha
// paga disputar o prêmio do indique e ganhe.

const CHAVE = 'inksa.campanha.origem';

// Mesmo formato que o backend aceita (routes/campanhas.py). Minúsculas porque
// `guga`, `Guga` e `GUGA` têm que ser a MESMA campanha — o link vai ser
// digitado errado, e três baldes pro mesmo influenciador é não medir.
const FORMATO = /^[a-z0-9][a-z0-9_-]{1,31}$/;

export function normalizar(bruto) {
  const c = String(bruto || '').trim().toLowerCase();
  return FORMATO.test(c) ? c : null;
}

/** Lê ?de= da URL, guarda, conta a chegada e LIMPA a barra de endereço.
 *
 *  Limpar importa por dois motivos. O óbvio: sem isso o código fica no link
 *  que a pessoa vai copiar pra mandar pra outra, e a campanha do Guga levaria
 *  crédito por gente que veio do boca a boca. O menos óbvio: é o que garante
 *  que a chegada seja contada UMA vez — recarregar a página não conta de novo.
 */
export function capturarDaUrl(apiUrl) {
  let codigo = null;
  let p = null;
  try {
    p = new URLSearchParams(window.location.search);
    codigo = normalizar(p.get('de') || p.get('campanha'));
    if (!codigo) return null;
    localStorage.setItem(CHAVE, codigo);
  } catch {
    // Storage bloqueado (aba anônima, cookies off): a atribuição do cadastro
    // se perde, mas a CHEGADA ainda vale ser contada — é o topo do funil e
    // não depende de guardar nada.
    if (codigo) contarChegada(apiUrl, codigo);
    return codigo;
  }

  contarChegada(apiUrl, codigo);

  // Limpeza em try SEPARADO, como em indicacao.js: replaceState pode falhar
  // por política do navegador, e isso não pode fazer a função dizer que não
  // capturou nada — o código já está guardado.
  try {
    p.delete('de');
    p.delete('campanha');
    const q = p.toString();
    window.history.replaceState({}, '',
      window.location.pathname + (q ? `?${q}` : '') + window.location.hash);
  } catch { /* barra suja; a medição funciona igual */ }

  return codigo;
}

/** Avisa o servidor que alguém chegou. Dispara e esquece.
 *
 *  ⚠️ Sem await, sem tratar erro, sem toast. Isto roda no carregamento do app
 *  de quem ACABOU de chegar pela campanha: se a medição pudesse travar ou
 *  sujar a tela, ela estaria atrapalhando exatamente a visita que existe pra
 *  contar. A rota responde 204 até pra código inválido, pelo mesmo motivo.
 */
function contarChegada(apiUrl, codigo) {
  try {
    fetch(`${apiUrl}/api/campanha/clique`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo }),
      keepalive: true,   // sobrevive se a pessoa navegar na mesma hora
    }).catch(() => {});
  } catch { /* sem rede: perde-se a chegada, não a visita */ }
}

export function pendente() {
  try { return localStorage.getItem(CHAVE) || null; } catch { return null; }
}

export function limpar() {
  try { localStorage.removeItem(CHAVE); } catch { /* ignore */ }
}
