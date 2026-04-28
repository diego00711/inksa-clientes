import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Star, Loader2, AlertCircle } from 'lucide-react';
import { CLIENT_API_URL, createAuthHeaders } from '../services/api';
import authService from '../services/authService';

const LEVELS = {
  1: { name: 'Bronze',   gradient: 'from-amber-400 to-amber-600',   ring: 'ring-amber-400' },
  2: { name: 'Prata',    gradient: 'from-slate-300 to-slate-500',    ring: 'ring-slate-400' },
  3: { name: 'Ouro',     gradient: 'from-yellow-400 to-yellow-600',  ring: 'ring-yellow-400' },
  4: { name: 'Platina',  gradient: 'from-cyan-400 to-cyan-600',      ring: 'ring-cyan-400'  },
  5: { name: 'Diamante', gradient: 'from-purple-400 to-purple-600',  ring: 'ring-purple-400' },
};

const POINTS_TABLE = [
  { action: 'Pedido entregue',         pts: '+50' },
  { action: 'Avaliar restaurante',      pts: '+10' },
  { action: 'Primeiro pedido do dia',   pts: '+20' },
];

function StarBar({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`h-3 w-3 ${s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
      ))}
    </div>
  );
}

export default function ClientGamificationDevPage() {
  const [userPoints, setUserPoints] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (!currentUser?.id) throw new Error('Sessão expirada. Faça login novamente.');

        const headers = createAuthHeaders();

        const [ptsRes, lbRes] = await Promise.all([
          fetch(`${CLIENT_API_URL}/api/gamification/${currentUser.id}/points-level`, { headers }),
          fetch(`${CLIENT_API_URL}/api/gamification/leaderboard?scope=client&limit=10`, { headers }),
        ]);

        if (!ptsRes.ok) throw new Error('Não foi possível carregar seus pontos.');
        const ptsJson = await ptsRes.json();
        setUserPoints(ptsJson.data || ptsJson);

        if (lbRes.ok) {
          const lbJson = await lbRes.json();
          const users = lbJson.data?.users ?? lbJson.data ?? lbJson.users ?? [];
          setLeaderboard(Array.isArray(users) ? users : []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <Loader2 className="animate-spin w-10 h-10 text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 gap-3 p-6">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-red-600 font-medium text-center">{error}</p>
      </div>
    );
  }

  const lvl = Math.min(userPoints?.current_level || 1, 5);
  const totalPts = userPoints?.total_points || 0;
  const toNext = userPoints?.points_to_next_level ?? 0;
  const levelName = userPoints?.level_name || LEVELS[lvl]?.name || 'Bronze';
  const { gradient } = LEVELS[lvl] || LEVELS[1];

  // Progress bar estimation (toNext is points remaining to next level)
  const LEVEL_GAP = { 1: 300, 2: 500, 3: 700, 4: 1000, 5: 0 };
  const gap = LEVEL_GAP[lvl] || 300;
  const progress = toNext > 0 ? Math.max(5, Math.min(100, Math.round(((gap - toNext) / gap) * 100))) : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 pb-12">
      <div className="max-w-lg mx-auto space-y-5">

        <h1 className="text-2xl font-bold text-gray-800 text-center pt-2">Minha Pontuação</h1>

        {/* Level card */}
        <div className={`rounded-2xl bg-gradient-to-br ${gradient} p-6 text-white shadow-xl`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-white/70 text-xs uppercase tracking-widest mb-1">Nível atual</p>
              <h2 className="text-3xl font-black">{levelName}</h2>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <Trophy className="w-8 h-8 text-white" />
            </div>
          </div>

          <p className="text-5xl font-black tabular-nums">{totalPts.toLocaleString('pt-BR')}</p>
          <p className="text-white/70 text-sm mb-4">pontos acumulados</p>

          {toNext > 0 ? (
            <>
              <div className="bg-black/20 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-white h-2.5 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-white/70 text-xs mt-2">
                {toNext.toLocaleString('pt-BR')} pontos para o próximo nível ({progress}% concluído)
              </p>
            </>
          ) : (
            <p className="text-white/80 text-sm font-semibold">Nível máximo atingido!</p>
          )}
        </div>

        {/* How to earn */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
            <Star className="w-4 h-4 text-yellow-500" />
            Como ganhar pontos
          </h3>
          <div className="divide-y divide-gray-50">
            {POINTS_TABLE.map(({ action, pts }) => (
              <div key={action} className="flex justify-between items-center py-2.5">
                <span className="text-sm text-gray-600">{action}</span>
                <span className="text-sm font-bold text-green-600">{pts}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            Ranking de Clientes
          </h3>

          {leaderboard.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Nenhum dado disponível ainda.</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((user, i) => {
                const medal = i === 0 ? 'bg-yellow-400 text-yellow-900'
                  : i === 1 ? 'bg-slate-300 text-slate-700'
                  : i === 2 ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-500';
                return (
                  <div key={user.user_id || i} className="flex items-center gap-3 py-1.5">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${medal}`}>
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm text-gray-700 font-medium truncate">
                      {user.name || user.display_name || user.full_name || 'Cliente'}
                    </span>
                    <span className="text-sm font-bold text-blue-600 tabular-nums">
                      {(user.total_points || 0).toLocaleString('pt-BR')} pts
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
