// src/components/ChatModal.jsx
// Props: orderId, isOpen, onClose, senderType="client"
// Polling a cada 5s enquanto aberto; auto-scroll para a última mensagem.

import { useState, useEffect, useRef } from 'react';
import { CLIENT_API_URL, createAuthHeaders } from '../services/api';
import { supabase } from '../services/restaurantService';
import { X, Send } from 'lucide-react';

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch { /* sem erro silencioso */ }
}

function toMs(ts) {
  if (!ts) return 0;
  let s = String(ts);
  if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) s = s.replace(' ', 'T') + 'Z';
  const t = new Date(s).getTime();
  return Number.isNaN(t) ? 0 : t;
}

// Une o que está na tela com o que veio do servidor, SEM substituir a lista.
// Antes o poll fazia setMessages(...) direto: uma resposta lenta, disparada
// ANTES da mensagem existir, chegava DEPOIS do envio e apagava a mensagem
// recém-enviada (parecia que só uma tinha sido enviada).
function mergeMessages(prev, incoming) {
  const byId = new Map();
  for (const m of prev) if (!m?._pending && m?.id != null) byId.set(String(m.id), m);
  for (const m of incoming) if (m?.id != null) byId.set(String(m.id), m);

  const confirmed = [...byId.values()].sort((a, b) => toMs(a.created_at) - toMs(b.created_at));
  const pending = prev.filter(m =>
    m?._pending &&
    !confirmed.some(c => c.sender_type === m.sender_type && c.message === m.message)
  );
  return [...confirmed, ...pending];
}

export default function ChatModal({ orderId, isOpen, onClose, senderType = 'client', onUnreadChange }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const lastCountRef = useRef(0);
  const seqRef = useRef(0);

  const fetchMessages = async () => {
    const seq = ++seqRef.current;
    try {
      const res = await fetch(`${CLIENT_API_URL}/api/chat/${orderId}/messages`, {
        headers: createAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.messages || data.data || [];
        if (seq !== seqRef.current) return; // resposta fora de ordem — ignora
        setMessages(prev => mergeMessages(prev, list));
      }
    } catch (e) {
      // falha silenciosa — polling tentará novamente
    }
  };

  useEffect(() => {
    if (!isOpen || !orderId) return;

    // Reset unread count when opened
    lastCountRef.current = 0;
    onUnreadChange?.(0);

    fetchMessages();

    // Polling: o realtime do Supabase não entrega aqui (chat_messages tem RLS
    // ligada e sem policy pro anon do supabase-js), então a mensagem demorava.
    // Busca a cada 3s enquanto o chat está aberto.
    const pollId = setInterval(fetchMessages, 3000);

    let channel = null;
    if (supabase) {
      channel = supabase
        .channel(`chat-${orderId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `order_id=eq.${orderId}`,
        }, (payload) => {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new?.id)) return prev; // evita duplicar com o poll
            if (payload.new?.sender_type !== senderType) playBeep();
            return mergeMessages(prev, [payload.new]);
          });
        })
        .subscribe();
    }

    return () => { clearInterval(pollId); if (channel) supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, orderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = newMessage.trim();
    if (!text || !orderId) return;
    // Eco otimista: a bolha aparece NA HORA. Antes era POST + GET (duas idas ao
    // servidor) pra só então desenhar — parecia que a mensagem não foi enviada.
    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const optimistic = {
      id: tempId,
      _pending: true,
      sender_type: senderType,
      message: text,
      created_at: new Date().toISOString(),
    };
    setNewMessage('');
    setMessages(prev => [...prev, optimistic]);
    setSending(true);
    try {
      const res = await fetch(`${CLIENT_API_URL}/api/chat/${orderId}/messages`, {
        method: 'POST',
        headers: { ...createAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_type: senderType, message: text }),
      });
      if (!res.ok) throw new Error('envio falhou');
      // O POST devolve a mensagem criada — troca a pendente pela real sem GET.
      let saved = null;
      try { saved = await res.json(); } catch { /* corpo vazio */ }
      setMessages(prev => {
        const semTemp = prev.filter(m => m.id !== tempId);
        return saved?.id ? mergeMessages(semTemp, [saved]) : semTemp;
      });
      if (!saved?.id) fetchMessages();
    } catch (e) {
      // Falhou: tira a bolha pendente e devolve o texto pro input.
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(prev => (prev ? prev : text));
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    // z-[1100]: acima das camadas do Leaflet (panes ate 700, controles 1000),
    // que vivem no MESMO stacking context — com z-50 o mapa pintava por cima
    // do chat aberto.
    <div className="fixed inset-0 z-[1100] flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-[#FF6F00] text-white">
        <h2 className="font-bold text-lg">Chat com Entregador</h2>
        <button
          onClick={onClose}
          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-orange-600 transition-colors"
          aria-label="Fechar chat"
        >
          <X />
        </button>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-8">Nenhuma mensagem ainda</p>
        )}
        {messages.map((msg, i) => (
          <div
            key={msg.id ?? i}
            className={`flex ${msg.sender_type === senderType ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm transition-opacity ${
                msg.sender_type === senderType
                  ? 'bg-[#FF6F00] text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              } ${msg._pending ? 'opacity-60' : ''}`}
            >
              {msg.message}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area — piso de padding embaixo pra não ficar atrás da barra de
          navegação do Android (env volta 0 na navegação de 3 botões). */}
      <div
        className="border-t px-3 pt-3 flex gap-2 bg-white"
        style={{ paddingBottom: 'max(3rem, calc(0.75rem + env(safe-area-inset-bottom)))' }}
      >
        <input
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Digite uma mensagem..."
          className="flex-1 border rounded-full px-4 py-2 text-base outline-none focus:border-[#FF6F00]"
        />
        <button
          onClick={sendMessage}
          disabled={!newMessage.trim()}
          className="bg-[#FF6F00] text-white rounded-full p-3 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50 hover:bg-orange-600 transition-colors"
          aria-label="Enviar mensagem"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
