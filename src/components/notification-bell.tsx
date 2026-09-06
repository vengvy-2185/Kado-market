"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export function NotificationBell({ userId, initialNotifications }: { userId: string; initialNotifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleOpenNotification(n: Notification) {
    if (!n.is_read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      markNotificationRead(n.id);
    }
    setOpen(false);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full border border-white/10 bg-white/5 p-2.5 text-white/70 hover:bg-white/10"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-highlight px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-2xl border border-white/10 bg-surface shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
                  markAllNotificationsRead();
                }}
                className="flex items-center gap-1 text-xs text-accent hover:underline"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="no-scrollbar max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-white/40">No notifications yet.</p>
            ) : (
              notifications.map((n) => {
                const content = (
                  <div className={cn("border-b border-white/5 px-4 py-3 text-sm last:border-0 hover:bg-white/5", !n.is_read && "bg-primary/5")}>
                    <p className="font-medium">{n.title}</p>
                    <p className="mt-0.5 text-xs text-white/50">{n.message}</p>
                    <p className="mt-1 text-[10px] text-white/30">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                );
                return n.link ? (
                  <Link key={n.id} href={n.link} onClick={() => handleOpenNotification(n)}>
                    {content}
                  </Link>
                ) : (
                  <button key={n.id} onClick={() => handleOpenNotification(n)} className="block w-full text-left">
                    {content}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
