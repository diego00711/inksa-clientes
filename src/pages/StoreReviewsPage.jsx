// Página de avaliações da loja — aberta pelo "Ver todas" na página da loja.
// O cliente consulta a reputação ANTES de pedir, como nos apps grandes.
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import StoreReviews from "../components/StoreReviews";
import RestaurantService from "../services/restaurantService";

export default function StoreReviewsPage() {
  const { id } = useParams();
  const [nomeLoja, setNomeLoja] = useState("");

  // Só pro título do cabeçalho — a lista em si é pública e independe disto.
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const r = await RestaurantService.getRestaurantDetails(id);
        const loja = r?.data ?? r;
        if (vivo) setNomeLoja(loja?.restaurant_name || loja?.name || "");
      } catch { /* sem nome, o cabeçalho fica genérico */ }
    })();
    return () => { vivo = false; };
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            to={`/restaurantes/${id}`}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-6 w-6 text-gray-700" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-800 truncate">Avaliações</h1>
            {nomeLoja && <p className="text-xs text-gray-500 truncate">{nomeLoja}</p>}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <StoreReviews restaurantId={id} />
      </div>
    </div>
  );
}
