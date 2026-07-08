import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  TrendingUp,
  Target,
  Gift,
  History,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  Star,
  Lock,
  Zap,
} from 'lucide-react';
import { CLIENT_API_URL, createAuthHeaders, processResponse } from '../services/api';
import { apiFetch } from '../services/apiClient';
import authService from '../services/authService';
import { useToast } from '../context/ToastContext';

// ─── Level config ──────────────────────────────────────────────────────────────

const LEVELS = [
  { min: 0,    max: 299,  name: 'Bronze',  gradient: 'from-amber-400 to-amber-600',  ring: 'ring-amber-400',  bar: 'bg-amber-500' },
  { min: 300,  max: 799,  name: 'Prata',   gradient: 'from-slate-300 to-slate-500',   ring: 'ring-slate-400',  bar: 'bg-slate-400' },
  { min: 800,  max: 1499, name: 'Ouro',    gradient: 'from-yellow-400 to-yellow-600', ring: 'ring-yellow-400', bar: 'bg-yellow-500' },
  { min: 1500, max: 2999, name: 'Platina', gradient: 'from-cyan-400 to-cyan-600',     ring: 'ring-cyan-400',   bar: 'bg-cyan-500'  },
  { min: 3000, max: Infinity, name: 'Diamante', gradient: 'from-purple-400 to-purple-600', ring: 'ring-purple-400', bar: 'bg-purple-500' },
];

function getLevelInfo(totalPoints) {
  const level = LEVELS.findIndex(l => totalPoints >= l.min && totalPoints <= l.max);
  const idx = level === -1 ? LEVELS.length - 1 : level;
  const current = LEVELS[idx];
  const next = LEVELS[idx + 1] || null;
  const rangeSize = current.max === Infinity ? 0 : current.max - current.min + 1;
  const progress = rangeSize === 0 ? 100 : Math.min(100, Math.round(((totalPoints - current.min) / rangeSize) * 100));
  const toNext = next ? Math.max(0, next.min - totalPoints) : 0;
  return { ...current, idx, next, progress, toNext };
}

// ─── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, color = 'text-orange-500' }) {
  return (
    <h2 className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-700 mb-4`}>
      <Icon className={`w-4 h-4 ${color}`} />
      {title}
    </h2>
  );
}

// ─── Loading / Error / Empty states ───────────────────────────────────────────

function SectionLoading() {
  return (
    <div className="flex items-center justify-center py-10">
      <Loader2 className="animate-spin w-7 h-7 text-orange-400" />
    </div>
  );
}

function SectionError({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      <AlertCircle className="w-8 h-8 text-red-400" />
      <p className="text-red-500 text-sm text-center">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-full transition-colors"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}

function SectionEmpty({ message }) {
  return (
    <p className="text-gray-400 text-sm text-center py-8">{message}</p>
  );
}

// ─── Card wrapper ──────────────────────────────────────────────────────────────

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 ${className}`}>
      {children}
    </div>
  );
}

// ─── PointsLevelCard ───────────────────────────────────────────────────────────

function PointsLevelCard({ data }) {
  const totalPoints = data?.total_points ?? data?.points ?? 0;
  // Fonte da verdade = backend (níveis reais da tabela `levels`). A constante
  // LEVELS local serve só de fallback visual (gradiente/cor por nome) — antes
  // ela recalculava o nível com faixas divergentes do servidor e mostrava
  // nível/progresso errados (ex.: "Ouro" com 900 pts quando o real era Prata).
  const levelName = data?.level_name ?? getLevelInfo(totalPoints).name;
  const toNext = Number(data?.points_to_next_level ?? 0);
  const hasNext = toNext > 0;
  const progress = Math.max(0, Math.min(100, Number(data?.progress_pct ?? 0)));
  const style = LEVELS.find((l) => l.name === levelName) || getLevelInfo(totalPoints);

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${style.gradient} p-6 text-white shadow-xl`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-white/70 text-xs uppercase tracking-widest mb-1">Nível atual</p>
          <h2 className="text-3xl font-black">{levelName}</h2>
        </div>
        <div className="bg-white/20 rounded-full p-3">
          <Trophy className="w-8 h-8 text-white" />
        </div>
      </div>

      <p className="text-5xl font-black tabular-nums">{totalPoints.toLocaleString('pt-BR')}</p>
      <p className="text-white/70 text-sm mb-5">pontos acumulados</p>

      {hasNext ? (
        <>
          <div className="bg-black/20 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-white h-2.5 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-white/70 text-xs mt-2">
            Faltam <span className="font-bold text-white">{toNext.toLocaleString('pt-BR')} pontos</span> para o próximo nível ({progress}% concluído)
          </p>
        </>
      ) : (
        <p className="text-white/80 text-sm font-semibold mt-2">
          Nível máximo atingido!
        </p>
      )}
    </div>
  );
}

// ─── LeaderboardSection ────────────────────────────────────────────────────────

function LeaderboardSection({ entries, currentUserId }) {
  const medal = (i) => {
    if (i === 0) return 'bg-yellow-400 text-yellow-900';
    if (i === 1) return 'bg-slate-300 text-slate-700';
    if (i === 2) return 'bg-amber-600 text-white';
    return 'bg-gray-100 text-gray-500';
  };

  return (
    <div className="space-y-2">
      {entries.map((entry, i) => {
        const userId = entry.user_id || entry.id;
        const isMe = currentUserId && String(userId) === String(currentUserId);
        const name = entry.name || entry.display_name || entry.full_name || 'Cliente';
        const initial = name[0]?.toUpperCase() || '?';
        const pts = entry.total_points ?? entry.points ?? 0;

        return (
          <div
            key={userId || i}
            className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-colors ${isMe ? 'bg-orange-50 border border-orange-200' : 'hover:bg-gray-50'}`}
          >
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${medal(i)}`}>
              {i + 1}
            </span>
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
              {initial}
            </div>
            <span className={`flex-1 text-sm font-medium truncate ${isMe ? 'text-orange-700 font-bold' : 'text-gray-700'}`}>
              {name}
              {isMe && <span className="ml-1 text-xs text-orange-500">(Você)</span>}
            </span>
            <span className="text-sm font-bold text-orange-500 tabular-nums">
              {pts.toLocaleString('pt-BR')} pts
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── ChallengesSection ─────────────────────────────────────────────────────────

function ChallengesSection({ challenges }) {
  return (
    <div className="space-y-4">
      {challenges.map((ch) => {
        const id = ch.id || ch.challenge_id;
        const current = ch.current_progress ?? ch.progress ?? 0;
        const goal = ch.goal ?? ch.target ?? 1;
        const pct = Math.min(100, Math.round((current / goal) * 100));
        const completed = ch.completed || ch.is_completed || pct >= 100;

        return (
          <div key={id} className="border border-gray-100 rounded-xl p-4 hover:border-orange-200 transition-colors">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-gray-800">{ch.name || ch.title}</h3>
                  {completed && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      Concluído
                    </span>
                  )}
                </div>
                {ch.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{ch.description}</p>
                )}
              </div>
              <span className="shrink-0 text-sm font-bold text-orange-500 whitespace-nowrap">
                +{ch.reward_points ?? ch.points ?? 0} pts
              </span>
            </div>

            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{current} / {goal}</span>
                <span>{pct}%</span>
              </div>
              <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${completed ? 'bg-green-500' : 'bg-orange-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── RewardsSection ────────────────────────────────────────────────────────────

const REWARD_TYPE_LABELS = {
  gift: 'Brinde', discount_pct: 'Desconto', free_delivery: 'Frete Grátis', credit: 'Crédito',
};
const REWARD_TYPE_COLORS = {
  gift: 'bg-purple-100 text-purple-700', discount_pct: 'bg-green-100 text-green-700',
  free_delivery: 'bg-blue-100 text-blue-700', credit: 'bg-amber-100 text-amber-700',
};

function RewardsSection({ rewards, userPoints, onRedeem, redeeming }) {
  const totalPoints = userPoints?.total_points ?? userPoints?.points ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {rewards.map((reward) => {
        const id = reward.id || reward.reward_id;
        const cost = reward.points_required ?? reward.cost ?? reward.points_cost ?? 0;
        const canAfford = totalPoints >= cost;
        const isRedeeming = redeeming === id;
        const progress = cost > 0 ? Math.min(100, Math.round((totalPoints / cost) * 100)) : 100;
        const isEmoji = reward.icon && !/^https?:\/\//.test(reward.icon);
        const lowStock = reward.stock != null && reward.stock < 10;

        return (
          <div
            key={id}
            className={`border rounded-xl p-4 flex flex-col gap-3 transition-all ${
              canAfford
                ? 'border-orange-200 bg-orange-50/30 hover:shadow-md'
                : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            {/* Icon + badges row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                {reward.image_url ? (
                  <img src={reward.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                ) : reward.icon ? (
                  isEmoji ? (
                    <span className="text-4xl leading-none">{reward.icon}</span>
                  ) : (
                    <img src={reward.icon} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  )
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Gift className="w-6 h-6 text-orange-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-800 leading-tight">{reward.name || reward.title}</h3>
                  {reward.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{reward.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Type badge + low stock */}
            <div className="flex items-center gap-2 flex-wrap">
              {reward.reward_type && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${REWARD_TYPE_COLORS[reward.reward_type] ?? 'bg-gray-100 text-gray-600'}`}>
                  {REWARD_TYPE_LABELS[reward.reward_type] ?? reward.reward_type}
                </span>
              )}
              {lowStock && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                  Estoque limitado ({reward.stock})
                </span>
              )}
            </div>

            {/* Points + progress */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1 text-sm font-bold text-orange-500">
                  <Star className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
                  {cost.toLocaleString('pt-BR')} pts
                </span>
                <span className="text-xs text-gray-400">{progress}%</span>
              </div>
              <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${canAfford ? 'bg-green-500' : 'bg-orange-400'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {!canAfford && (
                <p className="text-xs text-gray-400 mt-1">
                  Faltam {(cost - totalPoints).toLocaleString('pt-BR')} pontos
                </p>
              )}
            </div>

            {/* Redeem button */}
            <button
              onClick={() => !isRedeeming && onRedeem(reward)}
              disabled={isRedeeming}
              className={`w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-colors mt-auto ${
                canAfford && !isRedeeming
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : !canAfford
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isRedeeming ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Resgatando...</>
              ) : !canAfford ? (
                <><Lock className="w-3 h-3" /> Pontos insuficientes</>
              ) : (
                'Resgatar'
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── HistorySection ────────────────────────────────────────────────────────────

function HistorySection({ history }) {
  return (
    <div className="divide-y divide-gray-50">
      {history.map((item, i) => {
        const pts = item.points ?? item.points_earned ?? item.amount ?? 0;
        const isGain = pts >= 0;
        const date = item.created_at || item.date || item.timestamp;
        const label = item.action || item.description || item.event || 'Ação';

        return (
          <div key={item.id || i} className="flex items-center justify-between py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 font-medium truncate">{label}</p>
              {date && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(date).toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              )}
            </div>
            <span className={`text-sm font-bold shrink-0 ml-4 ${isGain ? 'text-green-600' : 'text-red-500'}`}>
              {isGain ? '+' : ''}{pts.toLocaleString('pt-BR')} pts
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function GamificationPage() {
  const { addToast } = useToast();

  // State: user points / level
  const [userPoints, setUserPoints] = useState(null);
  const [pointsLoading, setPointsLoading] = useState(true);
  const [pointsError, setPointsError] = useState(null);

  // State: point rules ("como ganhar pontos")
  const [pointRules, setPointRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(true);

  // State: leaderboard
  const [leaderboard, setLeaderboard] = useState([]);
  const [lbLoading, setLbLoading] = useState(true);
  const [lbError, setLbError] = useState(null);

  // State: challenges
  const [challenges, setChallenges] = useState([]);
  const [challengesLoading, setChallengesLoading] = useState(true);
  const [challengesError, setChallengesError] = useState(null);

  // State: rewards
  const [rewards, setRewards] = useState([]);
  const [rewardsLoading, setRewardsLoading] = useState(true);
  const [rewardsError, setRewardsError] = useState(null);
  const [redeemingId, setRedeemingId] = useState(null);
  const [confirmReward, setConfirmReward] = useState(null); // reward object awaiting confirmation

  // State: history
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);

  const currentUser = authService.getCurrentUser();
  const userId = currentUser?.id;
  const headers = createAuthHeaders();

  // ── Fetch helpers ────────────────────────────────────────────────────────────

  const fetchUserPoints = useCallback(async () => {
    if (!userId) { setPointsLoading(false); return; }
    setPointsLoading(true);
    setPointsError(null);
    try {
      const res = await apiFetch(
        `${CLIENT_API_URL}/api/gamification/user-points/${userId}`,
        { headers }
      );
      const data = await processResponse(res);
      setUserPoints(data?.data ?? data);
    } catch (err) {
      setPointsError(err.message || 'Erro ao carregar pontuação.');
    } finally {
      setPointsLoading(false);
    }
  }, [userId]);

  const fetchPointRules = useCallback(async () => {
    setRulesLoading(true);
    try {
      const res = await apiFetch(
        `${CLIENT_API_URL}/api/gamification/point-rules?applies_to=client`,
        { headers }
      );
      const data = await processResponse(res);
      setPointRules(data?.data?.items ?? data?.items ?? []);
    } catch {
      setPointRules([]);
    } finally {
      setRulesLoading(false);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    setLbLoading(true);
    setLbError(null);
    try {
      const res = await apiFetch(
        `${CLIENT_API_URL}/api/gamification/leaderboard?scope=client&limit=10`,
        { headers }
      );
      const data = await processResponse(res);
      // Backend responde {status, data:{items:[...], limit}} -- "items", nao "users".
      const users = data?.data?.items ?? data?.items ?? [];
      setLeaderboard(Array.isArray(users) ? users : []);
    } catch (err) {
      setLbError(err.message || 'Erro ao carregar ranking.');
    } finally {
      setLbLoading(false);
    }
  }, []);

  const fetchChallenges = useCallback(async () => {
    if (!userId) { setChallengesLoading(false); return; }
    setChallengesLoading(true);
    setChallengesError(null);
    try {
      const res = await apiFetch(
        `${CLIENT_API_URL}/api/challenges/user/${userId}`,
        { headers }
      );
      const data = await processResponse(res);
      const list = data?.data ?? data?.challenges ?? data ?? [];
      setChallenges(Array.isArray(list) ? list : []);
    } catch (err) {
      setChallengesError(err.message || 'Erro ao carregar desafios.');
    } finally {
      setChallengesLoading(false);
    }
  }, [userId]);

  const fetchRewards = useCallback(async () => {
    setRewardsLoading(true);
    setRewardsError(null);
    try {
      const res = await apiFetch(
        `${CLIENT_API_URL}/api/gamification/rewards?audience=client`,
        { headers }
      );
      const data = await processResponse(res);
      const list = data?.data?.items ?? data?.data ?? data?.items ?? data ?? [];
      setRewards(Array.isArray(list) ? list : []);
    } catch (err) {
      setRewardsError(err.message || 'Erro ao carregar recompensas.');
    } finally {
      setRewardsLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!userId) { setHistoryLoading(false); return; }
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await apiFetch(
        `${CLIENT_API_URL}/api/gamification/points-history/${userId}`,
        { headers }
      );
      const data = await processResponse(res);
      const hist = data?.data?.items ?? data?.items ?? [];
      setHistory(Array.isArray(hist) ? hist : []);
    } catch (err) {
      setHistoryError(err.message || 'Erro ao carregar histórico.');
    } finally {
      setHistoryLoading(false);
    }
  }, [userId]);

  // ── Initial load ─────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchUserPoints();
    fetchPointRules();
    fetchLeaderboard();
    fetchChallenges();
    fetchRewards();
    fetchHistory();
  }, [fetchUserPoints, fetchPointRules, fetchLeaderboard, fetchChallenges, fetchRewards, fetchHistory]);

  // ── Redeem ───────────────────────────────────────────────────────────────────

  const handleRedeemRequest = (reward) => {
    if (!userId) { addToast('error', 'Usuário não identificado.'); return; }
    const totalPoints = userPoints?.total_points ?? userPoints?.points ?? 0;
    const cost = reward.points_required ?? reward.cost ?? 0;
    if (totalPoints < cost) {
      addToast('error', `Pontos insuficientes. Você tem ${totalPoints.toLocaleString('pt-BR')} pts, precisa de ${cost.toLocaleString('pt-BR')} pts.`);
      return;
    }
    setConfirmReward(reward);
  };

  const handleRedeemConfirm = async () => {
    if (!confirmReward || !userId) return;
    const reward = confirmReward;
    setConfirmReward(null);
    setRedeemingId(reward.id);
    const currentUser = authService.getCurrentUser();
    const userName = currentUser?.name || currentUser?.full_name || currentUser?.email || '';
    try {
      const res = await apiFetch(`${CLIENT_API_URL}/api/gamification/rewards/${reward.id}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          user_id: userId,
          user_type: 'client',
          user_name: userName,
          points_used: reward.points_required ?? reward.cost ?? 0,
        }),
      });
      const data = await processResponse(res);
      addToast('success', data?.data?.message ?? `"${reward.name}" resgatado com sucesso!`);
      fetchUserPoints();
      fetchHistory();
    } catch (err) {
      addToast('error', err.message || 'Erro ao resgatar recompensa.');
    } finally {
      setRedeemingId(null);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (!userId) {
    return (
      <div className="bg-amber-50 min-h-screen flex flex-col items-center justify-center p-6 gap-3">
        <AlertCircle className="w-12 h-12 text-orange-400" />
        <p className="text-gray-700 font-semibold text-center">Sessão expirada. Faça login para continuar.</p>
        <Link to="/login" className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-full transition-colors">
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold text-sm">
          <ArrowLeft size={16} />
          Voltar para o início
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800">
          Minha Pontuação
        </h1>

        {/* ── Points / Level card ────────────────────────────────────────────── */}
        {pointsLoading ? (
          <Card>
            <SectionLoading />
          </Card>
        ) : pointsError ? (
          <Card>
            <SectionError message={pointsError} onRetry={fetchUserPoints} />
          </Card>
        ) : (
          <PointsLevelCard data={userPoints} />
        )}

        {/* ── Como ganhar pontos ─────────────────────────────────────────────── */}
        <Card>
          <SectionHeader icon={Zap} title="Como ganhar pontos" color="text-orange-500" />
          {rulesLoading ? (
            <SectionLoading />
          ) : pointRules.length === 0 ? (
            <SectionEmpty message="Nenhuma regra disponível no momento." />
          ) : (
            <div className="divide-y divide-gray-50">
              {pointRules.map((rule) => (
                <div key={rule.action_key} className="flex justify-between items-center py-2.5">
                  <span className="text-sm text-gray-600">{rule.label}</span>
                  <span className="text-sm font-bold text-green-600">+{rule.points}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ── Leaderboard ────────────────────────────────────────────────────── */}
        <Card>
          <SectionHeader icon={TrendingUp} title="Ranking de Clientes" color="text-blue-500" />
          {lbLoading ? (
            <SectionLoading />
          ) : lbError ? (
            <SectionError message={lbError} onRetry={fetchLeaderboard} />
          ) : leaderboard.length === 0 ? (
            <SectionEmpty message="Nenhum dado de ranking disponível ainda." />
          ) : (
            <LeaderboardSection entries={leaderboard} currentUserId={userId} />
          )}
        </Card>

        {/* ── Challenges ─────────────────────────────────────────────────────── */}
        <Card>
          <SectionHeader icon={Target} title="Desafios Ativos" color="text-green-500" />
          {challengesLoading ? (
            <SectionLoading />
          ) : challengesError ? (
            <SectionError message={challengesError} onRetry={fetchChallenges} />
          ) : challenges.length === 0 ? (
            <SectionEmpty message="Nenhum desafio disponível no momento." />
          ) : (
            <ChallengesSection challenges={challenges} />
          )}
        </Card>

        {/* ── Rewards store ──────────────────────────────────────────────────── */}
        <Card>
          <SectionHeader icon={Gift} title="Loja de Recompensas" color="text-orange-500" />
          {rewardsLoading ? (
            <SectionLoading />
          ) : rewardsError ? (
            <SectionError message={rewardsError} onRetry={fetchRewards} />
          ) : rewards.length === 0 ? (
            <SectionEmpty message="Nenhuma recompensa disponível no momento." />
          ) : (
            <RewardsSection
              rewards={rewards}
              userPoints={userPoints}
              onRedeem={handleRedeemRequest}
              redeeming={redeemingId}
            />
          )}
        </Card>

        {/* ── Points history ─────────────────────────────────────────────────── */}
        <Card>
          <SectionHeader icon={History} title="Histórico de Pontos" color="text-purple-500" />
          {historyLoading ? (
            <SectionLoading />
          ) : historyError ? (
            <SectionError message={historyError} onRetry={fetchHistory} />
          ) : history.length === 0 ? (
            <SectionEmpty message="Nenhum histórico de pontos ainda." />
          ) : (
            <HistorySection history={history} />
          )}
        </Card>

      </div>

      {/* ── Redeem Confirmation Modal ── */}
      {confirmReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="text-5xl mb-3">
              {confirmReward.icon && !/^https?:\/\//.test(confirmReward.icon)
                ? confirmReward.icon
                : '🎁'}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{confirmReward.name}</h3>
            <p className="text-sm text-gray-500 mb-4">
              Você usará{' '}
              <span className="font-bold text-orange-500">
                {(confirmReward.points_required ?? confirmReward.cost ?? 0).toLocaleString('pt-BR')} pontos
              </span>{' '}
              para resgatar esta recompensa.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmReward(null)}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleRedeemConfirm}
                className="flex-1 px-4 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-full font-bold transition"
              >
                Confirmar resgate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
