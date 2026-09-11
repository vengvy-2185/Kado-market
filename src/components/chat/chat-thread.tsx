"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { X, Pencil, Trash2, CornerUpLeft, ImagePlus, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, editMessage, deleteMessage } from "@/lib/actions/chat";
import { uploadPublicFile } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { LocationPicker } from "@/components/map/location-picker";
import { LocationCard } from "@/components/map/location-card";

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  attachment_url: string | null;
  location_lat: number | null;
  location_lng: number | null;
  reply_to_id: string | null;
  edited_at: string | null;
  created_at: string;
};

export function ChatThread({
  conversationId,
  initialMessages,
  currentUserId,
}: {
  conversationId: string;
  initialMessages: Message[];
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [pickingLocation, setPickingLocation] = useState(false);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  const messageById = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);

  useEffect(() => {
    const supabase = createClient();
    supabase.rpc("mark_conversation_read", { p_conversation_id: conversationId });
  }, [conversationId]);

  // Realtime is the fast path for incoming messages, but isn't guaranteed to
  // be reliable in every deployment (websocket/proxy quirks, etc.) — this
  // poll is a belt-and-suspenders fallback so a reply never requires a
  // manual page refresh to appear, even if Realtime silently isn't working.
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function poll() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (cancelled || !data) return;
      setMessages((prev) => {
        const optimisticOnly = prev.filter((m) => m.id.startsWith("optimistic-"));
        return [...(data as Message[]), ...optimisticOnly];
      });
    }

    const interval = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [conversationId]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const incoming = payload.new as Message;
          if (incoming.sender_id === currentUserId) return; // already shown optimistically
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const removedId = (payload.old as { id: string }).id;
          setMessages((prev) => prev.filter((m) => m.id !== removedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handlePickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPublicFile("chat-attachments", conversationId, file);
      setPendingImage(url);
    } catch {
      // silently ignore — the send button stays disabled without an image
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() && !pendingImage && !pendingLocation) return;

    if (editing) {
      const newContent = text.trim();
      setMessages((prev) => prev.map((m) => (m.id === editing.id ? { ...m, content: newContent, edited_at: new Date().toISOString() } : m)));
      startTransition(() => {
        editMessage(editing.id, newContent);
      });
      setEditing(null);
      setText("");
      return;
    }

    const content = text.trim() || null;
    const attachmentUrl = pendingImage;
    const replyToId = replyTo?.id ?? null;

    const optimistic: Message = {
      id: `optimistic-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
      attachment_url: attachmentUrl,
      location_lat: pendingLocation?.lat ?? null,
      location_lng: pendingLocation?.lng ?? null,
      reply_to_id: replyToId,
      edited_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const formData = new FormData();
    formData.set("conversation_id", conversationId);
    if (content) formData.set("content", content);
    if (attachmentUrl) formData.set("attachment_url", attachmentUrl);
    if (pendingLocation) {
      formData.set("location_lat", String(pendingLocation.lat));
      formData.set("location_lng", String(pendingLocation.lng));
    }
    if (replyToId) formData.set("reply_to_id", replyToId);
    startTransition(async () => {
      await sendMessage(formData);
      // resolve the optimistic message into the real one immediately,
      // instead of waiting for the next poll/realtime tick
      const supabase = createClient();
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (data) {
        setMessages((prev) => {
          const stillPendingOptimistic = prev.filter((m) => m.id.startsWith("optimistic-") && m.id !== optimistic.id);
          return [...(data as Message[]), ...stillPendingOptimistic];
        });
      }
    });

    setText("");
    setPendingImage(null);
    setPendingLocation(null);
    setReplyTo(null);
  }

  function startEdit(m: Message) {
    setEditing(m);
    setReplyTo(null);
    setText(m.content ?? "");
  }

  function cancelEdit() {
    setEditing(null);
    setText("");
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this message?")) return;
    setMessages((prev) => prev.filter((m) => m.id !== id));
    startTransition(() => deleteMessage(id));
  }

  return (
    <div className="flex h-[65vh] flex-col rounded-2xl border border-white/10 bg-surface/60">
      <div className="no-scrollbar flex-1 space-y-2 overflow-y-auto p-4">
        {messages.map((m) => {
          const isMine = m.sender_id === currentUserId;
          const repliedTo = m.reply_to_id ? messageById.get(m.reply_to_id) : null;
          return (
            <div key={m.id} className={cn("group flex items-end gap-1.5", isMine ? "justify-end" : "justify-start")}>
              {isMine && (
                <div className="mb-1 hidden items-center gap-1 group-hover:flex">
                  {m.content !== null && !m.attachment_url && !m.location_lat && (
                    <button onClick={() => startEdit(m)} className="rounded-full p-1 text-white/30 hover:text-white" aria-label="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(m.id)} className="rounded-full p-1 text-white/30 hover:text-danger" aria-label="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <div
                className={cn(
                  "max-w-[75%] rounded-2xl text-sm",
                  (m.attachment_url || m.location_lat) && !m.content
                    ? "overflow-hidden p-0"
                    : cn("px-3.5 py-2", isMine ? "bg-brand-gradient text-white" : "bg-white/10 text-white/90")
                )}
              >
                {repliedTo && (
                  <div className="mb-1.5 truncate rounded-lg bg-black/20 px-2 py-1 text-xs opacity-70">
                    {repliedTo.attachment_url ? "📷 Photo" : repliedTo.location_lat ? "📍 Location" : repliedTo.content ?? "Message"}
                  </div>
                )}
                {m.attachment_url && (
                  <div className="relative">
                    <Image
                      src={m.attachment_url}
                      alt=""
                      width={220}
                      height={220}
                      className={cn("max-h-64 w-full rounded-2xl object-cover", m.content && "mb-1 max-h-56 rounded-lg")}
                    />
                    {!m.content && (
                      <span className="absolute bottom-1.5 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                )}
                {m.location_lat !== null && m.location_lng !== null && (
                  <div className={cn(isMine ? "" : "", "p-0.5")}>
                    <LocationCard latitude={m.location_lat} longitude={m.location_lng} label="📍 Shared location" />
                  </div>
                )}
                {m.content && <p className={m.location_lat ? "px-3 pb-2 pt-1.5" : ""}>{m.content}</p>}
                {!((m.attachment_url || m.location_lat) && !m.content) && (
                  <p className={cn("mt-0.5 text-[10px]", isMine ? "text-white/70" : "text-white/40")}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {m.edited_at && " · edited"}
                  </p>
                )}
              </div>

              {!isMine && (
                <button
                  onClick={() => {
                    setReplyTo(m);
                    setEditing(null);
                  }}
                  className="mb-1 hidden rounded-full p-1 text-white/30 hover:text-white group-hover:block"
                  aria-label="Reply"
                >
                  <CornerUpLeft className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {(replyTo || editing) && (
        <div className="flex items-center justify-between border-t border-white/10 bg-white/5 px-3 py-2 text-xs">
          <span className="truncate text-white/60">
            {editing ? "Editing message" : `Replying to: ${replyTo?.attachment_url ? "📷 Photo" : replyTo?.location_lat ? "📍 Location" : replyTo?.content ?? "Message"}`}
          </span>
          <button onClick={editing ? cancelEdit : () => setReplyTo(null)} className="text-white/40 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {pendingImage && (
        <div className="flex items-center gap-2 border-t border-white/10 px-3 py-2">
          <Image src={pendingImage} alt="" width={40} height={40} className="h-10 w-10 rounded-lg object-cover" />
          <button onClick={() => setPendingImage(null)} className="text-xs text-white/40 hover:text-white">
            Remove
          </button>
        </div>
      )}

      {pendingLocation && (
        <div className="flex items-center gap-2 border-t border-white/10 px-3 py-2">
          <MapPin className="h-4 w-4 text-accent" />
          <span className="text-xs text-white/60">
            Pinned: {pendingLocation.lat.toFixed(4)}, {pendingLocation.lng.toFixed(4)}
          </span>
          <button onClick={() => setPendingLocation(null)} className="text-xs text-white/40 hover:text-white">
            Remove
          </button>
        </div>
      )}

      {pickingLocation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={() => setPickingLocation(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-surface p-4" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-sm font-semibold">Share a location</p>
            <LocationPicker
              latitude={pendingLocation?.lat ?? null}
              longitude={pendingLocation?.lng ?? null}
              onChange={(lat, lng) => setPendingLocation({ lat, lng })}
            />
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setPickingLocation(false)} className="rounded-full px-3 py-1.5 text-sm text-white/60 hover:bg-white/5">
                Cancel
              </button>
              <button
                onClick={() => setPickingLocation(false)}
                disabled={!pendingLocation}
                className="rounded-full bg-brand-gradient px-4 py-1.5 text-sm font-semibold disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-white/10 p-3">
        <label className="flex cursor-pointer items-center rounded-full border border-white/10 bg-white/5 px-3 text-white/60 hover:bg-white/10">
          <ImagePlus className="h-4 w-4" />
          <input type="file" accept="image/*" onChange={handlePickImage} className="hidden" disabled={Boolean(editing)} />
        </label>
        <button
          type="button"
          onClick={() => setPickingLocation(true)}
          disabled={Boolean(editing)}
          className="flex items-center rounded-full border border-white/10 bg-white/5 px-3 text-white/60 hover:bg-white/10 disabled:opacity-40"
          aria-label="Share location"
        >
          <MapPin className="h-4 w-4" />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={editing ? "Edit your message..." : "Type a message..."}
          className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={isPending || uploading || (!text.trim() && !pendingImage && !pendingLocation)}
          className="rounded-full bg-brand-gradient px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {editing ? "Save" : "Send"}
        </button>
      </form>
    </div>
  );
}
