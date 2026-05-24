// src/pages/ClubePage.jsx — Clube Inksa: fidelidade automática
import { useState, useEffect } from 'react';
import { CLIENT_API_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';

const LEVEL_STYLES = {
  bronze:   { bg: 'bg-amber-50',    border: 'border-amber-300',   text: 'text-amber-700',   bar: 'bg-amber-500',   ring: 'ring-amber-300' },
  prata:    { bg: 'bg-gray-50',     border: 'border-gray-300',    text: 'text-gray-600',    bar: 'bg-gray-400',    ring: 'ring-gray-300' },
  ouro:     { bg: 'bg-yellow-50',   border: 'border-yellow-400',  text: 'text-yellow-700',  bar: 'bg-yellow-500',  ring: 'ring-yellow-400' },
  diamante: { bg: 'bg-cyan-50',     border: 'border-cyan-300',    text: 'text-cyan-700',    bar: 'bg-cyan-500',    ring: 'ring-cyan-300' },
};

function ProgressBar({ value, max, colorClass }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 100;
  return (
    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
      <div
        className={`h-3 rounded-full transition-all duration-700 ${colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function ClubePage() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('inksa_token') || sessionStorage.getItem('inksa_token') || '';
    Promise.all([
      fetch(`${CLIENT_API_URL}/api/club/status`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
      fetch(`${CLIENT_API_URL}/api/club/levels`).then(r => r.json()),
    ])
      .then(([statusData, levelsData]) => {
        if (statusData?.status === 'success') setStatus(statusData.data);
        else setError(statusData?.error || 'Erro ao carregar status do clube');
        if (levelsData?.status === 'success') setLevels(levelsData.data || []);
      })
      .catch(() => setError('Não foi possível carregar o Clube Inksa'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Carregando seu clube...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">😕</p>
        <p className="text-gray-700 font-semibold">{error}</p>
      </div>
    );
  }

  const { current_level, next_level, orders_this_month, orders_to_next_level, recent_orders = [], motivation } = status || {};
  const style = LEVEL_STYLES[current_level?.level] || LEVEL_STYLES.bronze;
  const maxForBar = next_level ? next_level.min_orders : orders_this_month;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-gray-900">Clube Inksa</h1>
        <p className="text-sm text-gray-500 mt-1">Quanto mais você pede, mais benefícios ganha</p>
      </div>

      {/* Current level card */}
      <div className={`rounded-2xl border-2 p-6 ${style.bg} ${style.border}`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-4xl ring-4 ${style.ring} bg-white`}>
            {current_level?.emoji}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Seu nível atual</p>
            <p className={`text-2xl font-extrabold ${style.text}`}>{current_level?.label}</p>
            <p className="text-sm text-gray-600">{orders_this_month} pedido{orders_this_month !== 1 ? 's' : ''} este mês</p>
          </div>
        </div>

        {next_level && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{orders_this_month} pedidos</span>
              <span>{next_level.min_orders} para {next_level.label} {next_level.emoji}</span>
            </div>
            <ProgressBar value={orders_this_month} max={next_level.min_orders} colorClass={style.bar} />
          </div>
        )}

        <p className={`mt-3 text-sm font-semibold ${style.text}`}>{motivation}</p>
      </div>

      {/* Benefits */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-base font-bold text-gray-900 mb-3">Seus benefícios ativos</h2>
        <ul className="space-y-2">
          {current_level?.benefits?.map((b, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
              <span className="text-green-500">✓</span> {b}
            </li>
          ))}
        </ul>
        {next_level && (
          <>
            <p className="text-xs font-bold text-gray-400 uppercase mt-4 mb-2">Desbloqueie no nível {next_level.label}</p>
            <ul className="space-y-2 opacity-50">
              {next_level.benefits?.filter(b => !current_level?.benefits?.includes(b)).map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-500">
                  <span>🔒</span> {b}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* All levels table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-base font-bold text-gray-900 mb-3">Todos os níveis</h2>
        <div className="space-y-3">
          {levels.map((lvl) => {
            const s = LEVEL_STYLES[lvl.level] || LEVEL_STYLES.bronze;
            const isCurrent = lvl.level === current_level?.level;
            return (
              <div key={lvl.level}
                className={`rounded-xl p-3 border ${s.border} ${s.bg} ${isCurrent ? 'ring-2 ring-orange-400' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lvl.emoji}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${s.text}`}>
                      {lvl.label}
                      {isCurrent && <span className="ml-2 text-xs font-semibold bg-orange-500 text-white px-1.5 py-0.5 rounded-full">Você está aqui</span>}
                    </p>
                    <p className="text-xs text-gray-500">
                      {lvl.max_orders ? `${lvl.min_orders}–${lvl.max_orders} pedidos/mês` : `${lvl.min_orders}+ pedidos/mês`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent orders */}
      {recent_orders.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-bold text-gray-900 mb-3">Pedidos contabilizados este mês</h2>
          <ul className="space-y-2">
            {recent_orders.map((o, i) => (
              <li key={i} className="flex items-center justify-between text-sm text-gray-700">
                <span className="text-gray-500 text-xs">{new Date(o.created_at).toLocaleDateString('pt-BR')}</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(o.total_amount || 0)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
