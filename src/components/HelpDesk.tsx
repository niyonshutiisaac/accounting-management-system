/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Bot, HelpCircle, FileBarChart2, RefreshCw } from "lucide-react";

interface Message {
  role: "user" | "model";
  text: string;
}

interface HelpDeskProps {
  onQueryAI: (prompt: string) => Promise<string>;
}

export default function HelpDesk({ onQueryAI }: HelpDeskProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "Amakuru! I am KoraBooks AI, your real-time cloud assistant. I can inspect your double-entry ledgers, compute RRA taxes, find stock issues, and run analytics. Ask me any financial question!"
    }
  ]);
  const [prompt, setPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg = textToSend.trim();
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setPrompt("");
    setLoading(true);

    try {
      const response = await onQueryAI(userMsg);
      setMessages(prev => [...prev, { role: "model", text: response }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: "model", text: "I encountered a minor network latency issue trying to route your financial audit report. Please try again." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const preBakedPrompts = [
    { label: "Predict next month's cash flow", prompt: "Perform a predictive cash flow projection for Murakoze Builders based on the current Ledger balances. Recommend dynamic optimizations." },
    { label: "Audit current VAT obligation", prompt: "Identify potential tax discrepancies and calculate Standard RRA VAT (18%) Net liabilities. Present summary." },
    { label: "Anomalies check", prompt: "Perform an deep anomaly check across the Double Entry chart of accounts codes. List potential warnings." }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-xs flex flex-col h-[520px]" id="aigo-chat-helper">
      
      {/* Header panel */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-slate-800 block">KoraBooks AI Financial Copilot</span>
            <span className="text-[10px] text-slate-400">Server-side Gemini 2.x Smart Reasoning Engine</span>
          </div>
        </div>
        <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-150 rounded text-[9px] font-bold text-indigo-700 uppercase">
          Online & Compliant
        </span>
      </div>

      {/* Suggestion prompt bar */}
      <div className="p-3 border-b border-slate-50 bg-slate-50/20 flex gap-2 overflow-x-auto text-[10px]" id="prompt-chips">
        {preBakedPrompts.map((p, idx) => (
          <button
            key={idx}
            disabled={loading}
            onClick={() => handleSend(p.prompt)}
            className="px-3 py-1.5 bg-white border border-slate-150 rounded-full hover:border-indigo-400 text-slate-650 hover:text-indigo-700 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            ✧ {p.label}
          </button>
        ))}
      </div>

      {/* Messages layout */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" id="chat-scroller">
        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          return (
            <div key={idx} className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
              <div className={`p-2 rounded-lg shrink-0 flex items-center justify-center ${
                isUser ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
              } h-8 w-8`}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-3.5 rounded-xl border text-xs leading-relaxed whitespace-pre-wrap ${
                isUser 
                  ? "bg-slate-50 border-slate-100 text-slate-800 shadow-3xs" 
                  : "bg-indigo-50/10 border-indigo-100/30 text-slate-850"
              }`}>
                {m.text}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="p-2 rounded-lg bg-slate-100 text-indigo-600 h-8 w-8 flex items-center justify-center animate-spin">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-400 font-sans flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]"></span>
              Gemini is auditing Ledger books & preparing advisory statement...
            </div>
          </div>
        )}
        <div ref={scrollRef}></div>
      </div>

      {/* Entry Box */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex gap-2">
        <input
          type="text"
          disabled={loading}
          placeholder="Ask KoraBooks: 'Are my debits equal to credits?' or 'Summarize PAYE obligations'..."
          className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-500"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") handleSend(prompt);
          }}
        />
        <button
          onClick={() => handleSend(prompt)}
          disabled={!prompt.trim() || loading}
          className={`p-2.5 rounded-xl flex items-center justify-center text-white font-bold transition-all ${
            prompt.trim() && !loading
              ? "bg-indigo-600 hover:bg-indigo-750 cursor-pointer"
              : "bg-slate-350 bg-slate-200 cursor-not-allowed text-slate-400"
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
