// Reputação da loja para o CLIENTE — lida antes de fazer o pedido.
// Usado em dois lugares: um resumo na página da loja (`compact`) e a página
// dedicada de avaliações (lista completa).
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, ChevronRight, MessageSquare } from "lucide-react";
import { getStoreReviews } from "../services/reviewService";

function Estrelas({ nota, size = "w-4 h-4" }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${nota} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${size} ${s <= Math.round(nota) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

// Barra "5★ ▓▓▓▓░ 12" — proporção sobre o total, como nos apps grandes.
function BarraDistribuicao({ estrela, quantidade, total }) {
  const pct = total > 0 ? (quantidade / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-gray-500 w-6 shrink-0">{estrela}★</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-7 text-right shrink-0">{quantidade}</span>
    </div>
  );
}

function fmtData(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function StoreReviews({ restaurantId, compact = false, limite = 3 }) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let vivo = true;
    if (!restaurantId) return;
    (async () => {
      setCarregando(true);
      try {
        const d = await getStoreReviews(restaurantId, { limit: compact ? limite : 50 });
        if (!vivo) return;
        setDados(d);
        setErro(null);
      } catch {
        if (vivo) setErro("Não foi possível carregar as avaliações.");
      } finally {
        if (vivo) setCarregando(false);
      }
    })();
    return () => { vivo = false; };
  }, [restaurantId, compact, limite]);

  if (carregando) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 rounded w-40" />
          <div className="h-16 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <p className="text-sm text-gray-500 text-center">{erro}</p>
      </div>
    );
  }

  const media = Number(dados?.average_rating || 0);
  const total = Number(dados?.total_reviews || 0);
  const dist = dados?.distribution || {};
  const reviews = dados?.reviews || [];

  // Loja nova: em vez de "0,0 ★" (que parece nota ruim), diz que ainda não tem.
  if (total === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-2">Avaliações</h3>
        <div className="text-center py-4">
          <MessageSquare className="mx-auto h-8 w-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">Esta loja ainda não recebeu avaliações.</p>
          <p className="text-xs text-gray-400 mt-1">Seja o primeiro a avaliar depois do seu pedido!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800">Avaliações</h3>
        {compact && (
          <Link
            to={`/restaurantes/${restaurantId}/avaliacoes`}
            className="text-sm font-semibold text-orange-600 flex items-center gap-0.5 hover:text-orange-700"
          >
            Ver todas <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Resumo: nota grande + distribuição */}
      <div className="flex gap-5 items-center mb-5">
        <div className="text-center shrink-0">
          <p className="text-4xl font-black text-gray-800 leading-none">
            {media.toFixed(1).replace(".", ",")}
          </p>
          <div className="flex justify-center mt-1.5">
            <Estrelas nota={media} />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {total} {total === 1 ? "avaliação" : "avaliações"}
          </p>
        </div>
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((e) => (
            <BarraDistribuicao key={e} estrela={e} quantidade={Number(dist[String(e)] || 0)} total={total} />
          ))}
        </div>
      </div>

      {/* Comentários */}
      <ul className="space-y-4">
        {reviews.filter((r) => (r.comment || "").trim()).length === 0 ? (
          <li className="text-sm text-gray-500 text-center py-2">
            Ainda sem comentários escritos — só notas.
          </li>
        ) : (
          reviews
            .filter((r) => (r.comment || "").trim())
            .map((r, i) => (
              <li key={i} className="border-t border-gray-100 pt-4 first:border-0 first:pt-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-800">{r.author}</span>
                  <span className="text-xs text-gray-400">{fmtData(r.created_at)}</span>
                </div>
                <Estrelas nota={r.rating} size="w-3.5 h-3.5" />
                <p className="text-sm text-gray-600 mt-1.5 whitespace-pre-wrap break-words">{r.comment}</p>
              </li>
            ))
        )}
      </ul>
    </div>
  );
}
