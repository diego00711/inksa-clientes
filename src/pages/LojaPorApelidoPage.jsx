// src/pages/LojaPorApelidoPage.jsx
//
// O LINK QUE O PARCEIRO COLA NA BIO DO INSTAGRAM.
//
// Formato: clientes.inksadelivery.com.br/gelae
// (o mesmo desenho de pedir.delivery/duospizzaria, que é o que o comércio
//  de Lages já reconhece)
//
// A rota /restaurantes/<uuid> já era pública e funcionava. O problema nunca
// foi técnico: ninguém cola um UUID de 36 caracteres na bio. Esta página só
// traduz o apelido para o id e manda pra tela de sempre — assim existe UM
// caminho para carregar loja, não dois que podem divergir.
//
// ⚠️ ESTA ROTA É CURINGA NA RAIZ. Qualquer endereço não reconhecido cai aqui.
// Duas defesas contra isso virar problema:
//   1. O React Router dá prioridade a segmento fixo sobre parâmetro, então
//      /carrinho continua indo para o carrinho mesmo com esta rota existindo.
//   2. O banco recusa apelido reservado (carrinho, perfil, login, admin…) no
//      trigger de slug, então nenhuma loja consegue tomar o nome de uma tela.
import { useEffect, useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { CLIENT_API_URL as API } from '../services/api';

export default function LojaPorApelidoPage() {
  const { apelido } = useParams();
  const [estado, setEstado] = useState('procurando'); // procurando | achou | nao-existe
  const [id, setId] = useState(null);

  useEffect(() => {
    let vivo = true;
    setEstado('procurando');
    fetch(`${API}/api/restaurants/slug/${encodeURIComponent(apelido)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => {
        if (!vivo) return;
        if (d?.data?.id) { setId(d.data.id); setEstado('achou'); }
        else setEstado('nao-existe');
      })
      .catch(() => { if (vivo) setEstado('nao-existe'); });
    return () => { vivo = false; };
  }, [apelido]);

  // replace: o redirecionamento não entra no histórico. Sem isso, o "voltar"
  // do navegador devolveria a pessoa para esta tela, que redirecionaria de
  // novo — e ela ficaria presa sem conseguir sair.
  if (estado === 'achou') return <Navigate to={`/restaurantes/${id}`} replace />;

  if (estado === 'nao-existe') {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="text-xl font-bold text-gray-800">Não achamos essa loja</h1>
        <p className="mt-2 text-gray-500 max-w-sm">
          O link pode estar com um erro de digitação, ou a loja pode não estar
          atendendo no momento.
        </p>
        <Link to="/" className="mt-6 px-5 py-3 rounded-lg bg-primary text-white font-semibold">
          Ver as lojas abertas
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-32">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-3 text-sm text-gray-500">Abrindo a loja…</p>
    </div>
  );
}
