"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Bot } from "lucide-react";
import { askAdminInsight } from "@/lib/actions/admin-insights";
import { cn } from "@/lib/utils";

type Exchange = { question: string; answer: string };

const SUGGESTIONS = [
  "How many active sellers do we have?",
  "What's our total gross order revenue so far?",
  "How many stores are pending review?",
  "Which stores have the most products?",
  "How much revenue came from AI Assistant subscriptions?",
];

export function AdminInsightsChat() {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [exchanges.length, loading]);

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    setLoading(true);
    setText("");
    const answer = await askAdminInsight(question);
    setExchanges((prev) => [...prev, { question, answer }]);
    setLoading(false);
  }

  return (
    <div className="flex h-[65vh] flex-col rounded-2xl border border-white/10 bg-surface/60">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold">Platform AI Insights</p>
          <p className="text-[11px] text-white/40">Answers using real, live platform data only</p>
        </div>
      </div>

      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
        {exchanges.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-white/40">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {exchanges.map((ex, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl bg-brand-gradient px-3.5 py-2 text-sm text-white">{ex.question}</div>
            </div>
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl bg-white/10 px-3.5 py-2 text-sm text-white/90">
                <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-accent">
                  <Bot className="h-3 w-3" /> AI
                </p>
                <p className="whitespace-pre-wrap">{ex.answer}</p>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white/10 px-3.5 py-2 text-sm text-white/50">
              <Bot className="mr-1 inline h-3.5 w-3.5 animate-pulse" /> analyzing platform data...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(text);
        }}
        className="flex gap-2 border-t border-white/10 p-3"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask about users, stores, revenue, subscriptions..."
          className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className={cn("rounded-full bg-brand-gradient px-4 py-2 text-sm font-semibold disabled:opacity-50")}
        >
          Ask
        </button>
      </form>
    </div>
  );
}
