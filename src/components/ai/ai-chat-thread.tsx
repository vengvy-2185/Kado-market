"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Bot, Pencil, Trash2, Check, X, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { askAiAssistant, editAiQuestion, deleteAiQuestion, markAiThreadRead, clearAiThread } from "@/lib/actions/ai-assistant";
import { cn } from "@/lib/utils";

type AiMessage = {
  id: string;
  thread_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

const THINKING_TIMEOUT_MS = 25000; // safety net — never stay "thinking" forever

export function AiChatThread({ threadId, initialMessages, storeName }: { threadId: string; initialMessages: AiMessage[]; storeName: string }) {
  const [messages, setMessages] = useState<AiMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const thinkingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    markAiThreadRead(threadId); // no-op unless the viewer is the store's seller

    const channel = supabase
      .channel(`ai_messages:${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ai_messages", filter: `thread_id=eq.${threadId}` },
        (payload) => {
          const incoming = payload.new as AiMessage;
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
          if (incoming.role === "assistant") stopThinking();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ai_messages", filter: `thread_id=eq.${threadId}` },
        (payload) => {
          const updated = payload.new as AiMessage;
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "ai_messages", filter: `thread_id=eq.${threadId}` },
        (payload) => {
          const removedId = (payload.old as { id: string }).id;
          setMessages((prev) => prev.filter((m) => m.id !== removedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (thinkingTimeoutRef.current) clearTimeout(thinkingTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, thinking]);

  function stopThinking() {
    setThinking(false);
    if (thinkingTimeoutRef.current) {
      clearTimeout(thinkingTimeoutRef.current);
      thinkingTimeoutRef.current = null;
    }
  }

  async function refetchMessages() {
    const supabase = createClient();
    const { data } = await supabase
      .from("ai_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as AiMessage[]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const question = text.trim();
    if (!question || thinking) return;
    setText("");
    setThinking(true);

    // Optimistic: show the question immediately, don't wait on Realtime for it.
    const optimisticId = `optimistic-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: optimisticId, thread_id: threadId, role: "user", content: question, created_at: new Date().toISOString() },
    ]);

    // Safety net: if something goes wrong and we never get a real answer,
    // don't leave the UI stuck forever.
    thinkingTimeoutRef.current = setTimeout(stopThinking, THINKING_TIMEOUT_MS);

    try {
      await askAiAssistant(threadId, question);
    } catch (err) {
      console.error("askAiAssistant failed:", err);
    } finally {
      // Pull the real, authoritative message list — this is what actually
      // makes the answer show up even if the Realtime subscription isn't
      // working (e.g. the table hasn't been added to the publication yet).
      await refetchMessages();
      stopThinking();
    }
  }

  function startEdit(m: AiMessage) {
    setEditingId(m.id);
    setEditText(m.content);
  }

  function submitEdit(id: string) {
    const content = editText.trim();
    if (!content) return;
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content } : m)));
    startTransition(() => {
      editAiQuestion(id, content);
    });
    setEditingId(null);
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this question?")) return;
    setMessages((prev) => prev.filter((m) => m.id !== id));
    startTransition(() => {
      deleteAiQuestion(id);
    });
  }

  function handleClearAll() {
    if (messages.length === 0) return;
    if (!confirm("Clear this entire conversation? This can't be undone.")) return;
    setMessages([]);
    startTransition(() => {
      clearAiThread(threadId);
    });
  }

  return (
    <div className="flex h-[65vh] flex-col rounded-2xl border border-white/10 bg-surface/60">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold">{storeName} AI Assistant</p>
            <p className="text-[11px] text-white/40">Automated · answers from this store&apos;s info only</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/60 hover:bg-danger/10 hover:text-danger"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      <div className="no-scrollbar flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-white/30">Ask about products, shipping, or store policies. ភាសាខ្មែរ ក៏បាន។</p>
        )}
        {messages.map((m) => {
          const isUser = m.role === "user";
          const isEditing = editingId === m.id;
          return (
            <div key={m.id} className={cn("group flex items-end gap-1.5", isUser ? "justify-end" : "justify-start")}>
              {isUser && !isEditing && (
                <div className="mb-1 hidden items-center gap-1 group-hover:flex">
                  <button onClick={() => startEdit(m)} className="rounded-full p-1 text-white/30 hover:text-white" aria-label="Edit">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="rounded-full p-1 text-white/30 hover:text-danger" aria-label="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {isEditing ? (
                <div className="flex max-w-[80%] items-center gap-1.5">
                  <input
                    autoFocus
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="rounded-full border border-primary bg-white/5 px-3 py-1.5 text-sm text-white outline-none"
                  />
                  <button onClick={() => submitEdit(m.id)} className="rounded-full p-1 text-success hover:bg-success/10">
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="rounded-full p-1 text-white/40 hover:bg-white/10">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                    isUser ? "bg-brand-gradient text-white" : "bg-white/10 text-white/90"
                  )}
                >
                  {!isUser && (
                    <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-accent">
                      <Bot className="h-3 w-3" /> AI
                    </p>
                  )}
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              )}
            </div>
          );
        })}
        {thinking && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white/10 px-3.5 py-2 text-sm text-white/50">
              <Bot className="mr-1 inline h-3.5 w-3.5 animate-pulse" /> thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-white/10 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask the AI assistant... / សួរជាភាសាខ្មែរក៏បាន"
          className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={thinking || !text.trim()}
          className="flex-shrink-0 rounded-full bg-brand-gradient px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
