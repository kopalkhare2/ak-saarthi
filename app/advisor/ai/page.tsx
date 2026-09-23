'use client';

import { useState } from 'react';
import { Bot, Send, Sparkles, User, Zap } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const suggestedPrompts = [
  "Summarize Rajesh Sharma's portfolio",
  "Which clients have upcoming renewals?",
  "Draft a renewal reminder for Priya Patel's motor insurance",
  "Identify insurance gaps across all clients",
  "Prepare a meeting agenda for Amit Verma's quarterly review",
  "Which clients should I follow up with this week?",
];

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;

    setInput('');
    setIsLoading(true);

    const userMsg: Message = {
      role: 'user',
      content: msg,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: msg }),
      });

      const data = await res.json();
      
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.response || data.error || "Sorry, I couldn't process that request.",
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      console.error(e);
      const errorMsg: Message = {
        role: 'assistant',
        content: 'An error occurred while connecting to the AI assistant.',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-yellow-500/10 animate-pulse-glow">
          <Sparkles size={22} className="text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Assistant</h1>
          <p className="text-sm text-slate-400">Your intelligent financial advisor copilot</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 px-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <Bot size={48} className="text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-400 mb-2">How can I help you today?</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-md">I can summarize portfolios, identify insurance gaps, draft messages, and help with your daily advisory tasks.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg">
              {suggestedPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => handleSend(p)}
                  className="text-left text-sm p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-yellow-500/30 transition-all text-slate-300"
                >
                  <Zap size={12} className="inline text-yellow-400 mr-1.5" />
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 animate-slide-in-up ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                <Sparkles size={14} className="text-yellow-400" />
              </div>
            )}
            <div className={`max-w-[75%] p-4 rounded-2xl text-sm ${
              msg.role === 'user'
                ? 'bg-yellow-500/10 border border-yellow-500/20 text-slate-200'
                : 'bg-slate-800 border border-slate-700 text-slate-300'
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              <p className="text-[10px] text-slate-500 mt-2">{msg.timestamp}</p>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                <User size={14} className="text-slate-400" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
              <Sparkles size={14} className="text-yellow-400" />
            </div>
            <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl text-sm text-slate-400">
              <div className="flex items-center gap-1.5 py-1">
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-3 p-1">
        <input
          className="input flex-1"
          placeholder="Ask me anything about your business..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={() => handleSend()} className="btn btn-primary px-4">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
