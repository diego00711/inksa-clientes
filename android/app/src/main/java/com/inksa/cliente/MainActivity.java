package com.inksa.cliente;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;

import com.android.installreferrer.api.InstallReferrerClient;
import com.android.installreferrer.api.InstallReferrerStateListener;
import com.android.installreferrer.api.ReferrerDetails;
import com.getcapacitor.BridgeActivity;

/**
 * Recupera o código de indicação de quem instalou o app pelo link do convite.
 *
 * O PROBLEMA QUE ISTO RESOLVE (incidente 27/08/2026): o convite chega por
 * WhatsApp, a pessoa abre no NAVEGADOR — onde o código fica no localStorage do
 * navegador —, vê "Baixe o app", instala, e se cadastra DENTRO do APK. São
 * storages diferentes: o convite nunca atravessa e some sem aviso. Foi assim
 * que a indicação do sogro do Diego pra sogra se perdeu.
 *
 * COMO FUNCIONA: o link da loja sai com `&referrer=<codigo>` (montado no
 * LoginPage.jsx). O Google Play guarda essa string e entrega ao app na primeira
 * abertura, via Install Referrer API. Aqui a gente lê e escreve no localStorage
 * do WebView — o MESMO lugar onde a versão web guardaria. Daí pra frente o
 * IndicacaoHandler do React aplica o código sozinho, sem saber de onde veio.
 *
 * ⚠️ SÓ FUNCIONA EM INSTALAÇÃO VINDA DA PLAY STORE. APK instalado na mão
 * (sideload) não recebe referrer nenhum — não é defeito, é como a API funciona.
 * Por isso não dá pra testar sem publicar; o teste real é instalar pela faixa
 * de teste fechado usando um link com &referrer=.
 *
 * TUDO AQUI É BEST-EFFORT E ENGOLE EXCEÇÃO DE PROPÓSITO. Este app está com
 * testadores reais: prêmio de indicação não pode, em hipótese alguma, impedir
 * alguém de abrir o app. Qualquer falha só significa "sem código", que é
 * exatamente o comportamento de hoje.
 */
public class MainActivity extends BridgeActivity {

    private static final String TAG = "InksaReferrer";
    private static final String PREFS = "inksa.referrer";
    private static final String JA_CONSULTOU = "consultou_play";
    private static final String PENDENTE = "codigo_pendente";

    /** Mesma chave usada por src/utils/indicacao.js. Se mudar lá, muda aqui. */
    private static final String CHAVE_WEB = "inksa.indicacao.pendente";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            consultarPlayUmaVezSo();
        } catch (Throwable t) {
            Log.w(TAG, "consulta ao Install Referrer falhou", t);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        // A consulta ao Play é assíncrona e pode responder antes de o WebView
        // existir. Em vez de tentar acertar o instante, guarda no
        // SharedPreferences e entrega aqui — que roda toda vez que o app volta
        // pra frente. Some da fila só quando o JS confirma que gravou.
        try {
            entregarAoWebView();
        } catch (Throwable t) {
            Log.w(TAG, "entrega do código ao WebView falhou", t);
        }
    }

    private void consultarPlayUmaVezSo() {
        final SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        // O referrer só tem sentido na instalação. Consultar de novo a cada
        // abertura gastaria conexão com o Play pra receber sempre a mesma coisa.
        if (prefs.getBoolean(JA_CONSULTOU, false)) return;

        final InstallReferrerClient cliente = InstallReferrerClient.newBuilder(this).build();
        cliente.startConnection(new InstallReferrerStateListener() {
            @Override
            public void onInstallReferrerSetupFinished(int codigoResposta) {
                try {
                    if (codigoResposta == InstallReferrerClient.InstallReferrerResponse.OK) {
                        ReferrerDetails d = cliente.getInstallReferrer();
                        String codigo = extrairCodigo(d.getInstallReferrer());
                        if (codigo != null) {
                            prefs.edit().putString(PENDENTE, codigo).apply();
                            Log.i(TAG, "código de indicação recebido do Play");
                        }
                    }
                    // Marca como consultado em QUALQUER desfecho, inclusive
                    // FEATURE_NOT_SUPPORTED e SERVICE_UNAVAILABLE: nenhum deles
                    // melhora tentando de novo, e insistir vira consulta eterna.
                    prefs.edit().putBoolean(JA_CONSULTOU, true).apply();
                } catch (Throwable t) {
                    Log.w(TAG, "leitura do referrer falhou", t);
                } finally {
                    try { cliente.endConnection(); } catch (Throwable ignored) { }
                }
            }

            @Override
            public void onInstallReferrerServiceDisconnected() {
                // Sem retry de propósito: onCreate da próxima abertura tenta de
                // novo enquanto JA_CONSULTOU for false.
            }
        });
    }

    /**
     * O Play devolve a string CRUA que veio na URL da loja. Pode ser só o
     * código ("INKT5YMX4") ou uma query com utm ("utm_source=x&referrer=INK...").
     * Aceita as duas, e recusa qualquer coisa fora do formato do código —
     * instalação orgânica costuma trazer "utm_source=google-play&utm_medium=organic",
     * que não é convite de ninguém.
     */
    static String extrairCodigo(String bruto) {
        if (bruto == null) return null;
        String s = bruto.trim();
        if (s.isEmpty()) return null;

        if (s.contains("=")) {
            String achado = null;
            for (String par : s.split("&")) {
                int i = par.indexOf('=');
                if (i <= 0) continue;
                String chave = par.substring(0, i).trim().toLowerCase();
                if (chave.equals("ref") || chave.equals("referrer") || chave.equals("indicacao")) {
                    achado = par.substring(i + 1).trim();
                    break;
                }
            }
            s = achado;
        }
        if (s == null) return null;

        s = s.toUpperCase();
        // Formato de src/utils/referrals.py: "INK" + 6 do alfabeto sem I, O, 0 e 1.
        return s.matches("^INK[A-HJ-NP-Z2-9]{6}$") ? s : null;
    }

    private void entregarAoWebView() {
        final SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        final String codigo = prefs.getString(PENDENTE, null);
        if (codigo == null) return;
        if (getBridge() == null || getBridge().getWebView() == null) return;

        // NÃO SOBRESCREVE. Se a pessoa já tem um código guardado (digitou no
        // cadastro, ou abriu um link dentro do próprio app), o dela vale mais
        // que o da instalação — pode ter trocado de convite no caminho.
        final String js =
            "(function(){try{" +
            "  var k='" + CHAVE_WEB + "';" +
            "  if(!localStorage.getItem(k)){localStorage.setItem(k,'" + codigo + "');}" +
            "  return 'ok';" +
            "}catch(e){return 'erro';}})()";

        getBridge().getWebView().post(new Runnable() {
            @Override public void run() {
                try {
                    getBridge().getWebView().evaluateJavascript(js, valor -> {
                        // Só tira da fila com confirmação do JS. Se o WebView
                        // ainda não estava pronto, tenta no próximo onResume.
                        if (valor != null && valor.contains("ok")) {
                            prefs.edit().remove(PENDENTE).apply();
                            Log.i(TAG, "código de indicação entregue ao app");
                        }
                    });
                } catch (Throwable t) {
                    Log.w(TAG, "evaluateJavascript falhou", t);
                }
            }
        });
    }
}
