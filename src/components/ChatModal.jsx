// src/components/ChatModal.jsx
// Props: orderId, isOpen, onClose, senderType="client"
// Polling a cada 5s enquanto aberto; auto-scroll para a última mensagem.

import { useState, useEffect, useRef } from 'react';
import { CLIENT_API_URL } from '../services/api';
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

export default function ChatModal({ orderId, isOpen, onClose, senderType = 'client', onUnreadChange }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const lastCountRef = useRef(0);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${CLIENT_API_URL}/api/chat/${orderId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || data.data || []);
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

    if (!supabase) return;
    const channel = supabase
      .channel(`chat-${orderId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `order_id=eq.${orderId}`,
      }, (payload) => {
        setMessages(prev => {
          const updated = [...prev, payload.new];
          // Only beep if message is from the other party
          if (payload.new?.sender_type !== senderType) {
            playBeep();
            if (!isOpen) {
              lastCountRef.current += 1;
              onUnreadChange?.(lastCountRef.current);
            }
          }
          return updated;
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, orderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      await fetch(`${CLIENT_API_URL}/api/chat/${orderId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_type: senderType, message: newMessage.trim() }),
      });
      setNewMessage('');
      fetchMessages();
    } catch (e) {
      // falha silenciosa
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
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
            key={i}
            className={`flex ${msg.sender_type === senderType ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                msg.sender_type === senderType
                  ? 'bg-[#FF6F00] text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}
            >
              {msg.message}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-3 flex gap-2 bg-white">
        <input
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Digite uma mensagem..."
          className="flex-1 border rounded-full px-4 py-2 text-base outline-none focus:border-[#FF6F00]"
        />
        <button
          onClick={sendMessage}
          disabled={sending}
          className="bg-[#FF6F00] text-white rounded-full p-3 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50 hover:bg-orange-600 transition-colors"
          aria-label="Enviar mensagem"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
