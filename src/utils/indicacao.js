// Código de indicação que chega pela URL (?ref=INKABC123).
//
// O PROBLEMA QUE ISTO RESOLVE: o convite chega por link no WhatsApp, mas quem
// clica ainda não tem conta — e o cadastro deste app não loga, ele manda pro
// login. Então o código precisa SOBREVIVER a: abrir o link, cadastrar, confirmar
// e-mail, voltar, logar. Nada disso cabe num estado de componente.
//
// Guardamos no localStorage e aplicamos no primeiro acesso já autenticado.
const CHAVE = 'inksa.indicacao.pendente';

/** Lê ?ref= (ou ?indicacao=) da URL, guarda e LIMPA a barra de endereço.
 *
 *  Limpar importa: sem isso o código fica no link que a pessoa vai copiar e
 *  mandar pra outra — e ela distribuiria o convite de um terceiro achando que
 *  era o dela.
 */
export function capturarDaUrl() {
  let codigo = null;
  let p = null;
  try {
    p = new URLSearchParams(window.location.search);
    codigo = (p.get('ref') || p.get('indicacao') || '').trim().toUpperCase() || null;
    if (!codigo) return null;
    localStorage.setItem(CHAVE, codigo);
  } catch {
    return codigo;   // storage bloqueado: o código não sobrevive, mas o app segue
  }

  // Limpeza da URL em try SEPARADO, de propósito: replaceState pode falhar
  // (origem file://, políticas do navegador) e isso não pode fazer a função
  // dizer que não capturou nada — o código já está guardado e válido.
  try {
    p.delete('ref');
    p.delete('indicacao');
    const q = p.toString();
    window.history.replaceState({}, '',
      window.location.pathname + (q ? `?${q}` : '') + window.location.hash);
  } catch { /* barra de endereço fica suja; o convite funciona igual */ }

  return codigo;
}

export function guardar(codigo) {
  try {
    const c = (codigo || '').trim().toUpperCase();
    if (c) localStorage.setItem(CHAVE, c);
  } catch { /* storage cheio/bloqueado */ }
}

export function pendente() {
  try { return localStorage.getItem(CHAVE) || null; } catch { return null; }
}

export function limpar() {
  try { localStorage.removeItem(CHAVE); } catch { /* ignore */ }
}
