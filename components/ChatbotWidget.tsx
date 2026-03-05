'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  ChevronDown,
  Clock,
  Loader2,
  MessageSquare,
  RotateCcw,
  Send,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

/* ── Types ─────────────────────────────────────────────── */
type Sender = 'You' | 'Kudos AI';

interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  timestamp: number;
}

const defaultSuggestions = ['How do grants work?', 'What is escrow?', 'Find open projects'];

/* ── Time formatting ───────────────────────────────────── */
function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ── Initial state ─────────────────────────────────────── */
const welcomeMessage: ChatMessage = {
  id: 'welcome',
  sender: 'Kudos AI',
  text: "Hi! I'm your **Kudos AI** assistant. I know everything about grants, milestones, escrow, wallets, and more. Ask me anything or pick a topic below!",
  timestamp: Date.now(),
};

/* ── Component ─────────────────────────────────────────── */
export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(defaultSuggestions);
  const [hasUnread, setHasUnread] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Clear unread badge when opened
  useEffect(() => {
    if (isOpen) setHasUnread(false);
  }, [isOpen]);

  const fetchAIResponse = useCallback(
    async (allMessages: ChatMessage[]) => {
      setIsTyping(true);
      setSuggestions([]);

      // Build OpenRouter-style messages from chat history (skip welcome)
      const apiMessages = allMessages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.sender === 'You' ? ('user' as const) : ('assistant' as const),
          content: m.text,
        }));

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: apiMessages }),
        });

        const data = await res.json();

        const aiMsg: ChatMessage = {
          id: `k-${Date.now()}`,
          sender: 'Kudos AI',
          text: data.content ?? data.error ?? 'Sorry, something went wrong. Please try again.',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch {
        const errMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          sender: 'Kudos AI',
          text: "I'm having trouble connecting right now. Please check your internet and try again.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsTyping(false);
      }
    },
    [],
  );

  const sendMessage = useCallback(
    (content?: string) => {
      const text = (content ?? inputValue).trim();
      if (!text || isTyping) return;

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        sender: 'You',
        text,
        timestamp: Date.now(),
      };

      setMessages((prev) => {
        const updated = [...prev, userMsg];
        // Fire API call with full history
        fetchAIResponse(updated);
        return updated;
      });
      setInputValue('');
      setSuggestions([]);
    },
    [inputValue, isTyping, fetchAIResponse],
  );

  const handleReset = () => {
    setMessages([
      {
        ...welcomeMessage,
        id: `welcome-${Date.now()}`,
        timestamp: Date.now(),
      },
    ]);
    setSuggestions(defaultSuggestions);
    setIsTyping(false);
    setInputValue('');
  };

  /* ── Render markdown-light ───────────────────────────── */
  function renderText(raw: string) {
    // Bold: **text**
    const parts = raw.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      // Newlines
      return part.split('\n').map((line, j) => (
        <span key={`${i}-${j}`}>
          {j > 0 && <br />}
          {line}
        </span>
      ));
    });
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
      <div className="relative pointer-events-auto flex flex-col items-end">
        <AnimatePresence>
          {isOpen && (
            <motion.section
              initial={{ opacity: 0, y: 40, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="mb-4 flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0D1117]/95 backdrop-blur-xl shadow-[0_24px_80px_rgba(124,58,237,0.3),0_8px_32px_rgba(0,0,0,0.6)]"
              style={{ width: 440, height: 620 }}
            >
              {/* ── Header ────────────────────────────── */}
              <header className="shrink-0 px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-[#0D1117]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative size-9 rounded-full bg-linear-to-br from-purple-600 to-indigo-600 inline-flex items-center justify-center">
                    <Bot className="size-5 text-white" />
                    <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-400 border-2 border-[#0D1117]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white leading-tight">Kudos AI</p>
                    <p className="text-[11px] text-emerald-400 leading-tight flex items-center gap-1">
                      <span className="inline-block size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Online — Grant Assistant
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="size-8 rounded-full inline-flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
                    aria-label="Reset conversation"
                    title="Reset conversation"
                  >
                    <RotateCcw className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="size-8 rounded-full inline-flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
                    aria-label="Minimize"
                  >
                    <ChevronDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="size-8 rounded-full inline-flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
                    aria-label="Close"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </header>

              {/* ── Messages ──────────────────────────── */}
              <div className="flex-1 min-h-0 px-5 py-4">
                <div
                  ref={chatScrollRef}
                  className="h-full overflow-y-auto pr-2 space-y-4 chat-scroll"
                >
                  {messages.map((msg, idx) => {
                    const isAI = msg.sender === 'Kudos AI';
                    const prevMsg = messages[idx - 1];
                    const showTimestamp =
                      !prevMsg || msg.timestamp - prevMsg.timestamp > 120_000;
                    return (
                      <div key={msg.id}>
                        {showTimestamp && (
                          <div className="flex items-center justify-center gap-2 my-3">
                            <span className="h-px flex-1 bg-white/5" />
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Clock className="size-3" />
                              {formatTime(msg.timestamp)}
                            </span>
                            <span className="h-px flex-1 bg-white/5" />
                          </div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25 }}
                          className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}
                        >
                          {isAI ? (
                            <div className="flex items-start gap-2.5 max-w-[88%]">
                              <div className="mt-0.5 shrink-0 size-7 rounded-full bg-linear-to-br from-purple-600 to-indigo-600 text-white text-[11px] font-bold inline-flex items-center justify-center shadow-md">
                                K
                              </div>
                              <div className="rounded-2xl rounded-tl-sm bg-[#161B2E] text-slate-200 px-4 py-3 text-[13px] leading-relaxed border border-white/5">
                                {renderText(msg.text)}
                              </div>
                            </div>
                          ) : (
                            <div className="max-w-[82%] rounded-2xl rounded-tr-sm bg-linear-to-br from-purple-600 to-indigo-600 text-white px-4 py-3 text-[13px] leading-relaxed shadow-lg shadow-purple-500/20">
                              {msg.text}
                            </div>
                          )}
                        </motion.div>
                      </div>
                    );
                  })}

                  {/* Typing indicator */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 shrink-0 size-7 rounded-full bg-linear-to-br from-purple-600 to-indigo-600 text-white text-[11px] font-bold inline-flex items-center justify-center shadow-md">
                          K
                        </div>
                        <div className="rounded-2xl rounded-tl-sm bg-[#161B2E] border border-white/5 px-4 py-3 flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="size-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="size-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* ── Quick suggestions ─────────────────── */}
              <AnimatePresence>
                {suggestions.length > 0 && !isTyping && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="shrink-0 px-5 pb-2 overflow-hidden"
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <Zap className="size-3 text-purple-400" />
                      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                        Suggested
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => sendMessage(s)}
                          className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs text-purple-200 hover:bg-purple-500/20 hover:border-purple-400/50 transition-all duration-200"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Input bar ─────────────────────────── */}
              <div className="shrink-0 px-5 pb-4 pt-3">
                <div
                  className={`rounded-2xl border bg-[#111827] flex items-center pl-4 pr-2 h-12 transition-all duration-200 ${
                    isTyping
                      ? 'border-white/5 opacity-60'
                      : 'border-white/10 focus-within:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/20'
                  }`}
                >
                  <input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder={isTyping ? 'Kudos AI is thinking...' : 'Ask about grants, escrow, milestones...'}
                    disabled={isTyping}
                    className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none disabled:cursor-not-allowed"
                  />
                  {isTyping ? (
                    <div className="size-9 rounded-xl inline-flex items-center justify-center text-purple-400">
                      <Loader2 className="size-4 animate-spin" />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => sendMessage()}
                      disabled={!inputValue.trim()}
                      className="size-9 rounded-xl inline-flex items-center justify-center text-slate-400 hover:text-white hover:bg-purple-600/30 transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                      aria-label="Send message"
                    >
                      <Send className="size-4" />
                    </button>
                  )}
                </div>
                <p className="text-center text-[10px] text-slate-600 mt-2">
                  Kudos AI · Grant Assistant · Powered by knowledge base
                </p>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Floating trigger button ──────────────── */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="relative size-14 rounded-full bg-linear-to-br from-purple-600 to-indigo-600 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_10px_30px_rgba(124,58,237,0.45)] inline-flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
        >
          {!isOpen && (
            <span className="absolute inset-0 rounded-full animate-ping bg-purple-500/25 pointer-events-none" />
          )}
          {hasUnread && !isOpen && (
            <span className="absolute -top-1 -right-1 size-4 rounded-full bg-red-500 border-2 border-[#0D1117] text-[9px] font-bold text-white inline-flex items-center justify-center">
              !
            </span>
          )}
          <span className="relative z-10 inline-flex items-center justify-center">
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <MessageSquare className="size-5" />
                </motion.span>
              ) : (
                <motion.span
                  key="open"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sparkles className="size-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </button>
      </div>

      <style jsx>{`
        .chat-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .chat-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .chat-scroll::-webkit-scrollbar-thumb {
          background: rgba(124, 58, 237, 0.4);
          border-radius: 999px;
        }
        .chat-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(124, 58, 237, 0.6);
        }
      `}</style>
    </div>
  );
}
