"use client";

import { useState, useTransition } from "react";
import { Send, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { savePlatformTelegramToken, detectPlatformTelegramChat, disconnectPlatformTelegram } from "@/lib/actions/platform-telegram";

export function PlatformTelegramPanel({ hasToken, botUsername, isConnected }: { hasToken: boolean; botUsername: string | null; isConnected: boolean }) {
  const [token, setToken] = useState("");
  const [savingToken, setSavingToken] = useState(false);
  const [detecting, startDetecting] = useTransition();
  const [disconnecting, startDisconnecting] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSaveToken(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSavingToken(true);
    const formData = new FormData();
    formData.set("telegram_bot_token", token);
    try {
      await savePlatformTelegramToken(formData);
      setSaved(true);
      setToken("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save token.");
    } finally {
      setSavingToken(false);
    }
  }

  function handleDetect() {
    setError(null);
    startDetecting(async () => {
      try {
        await detectPlatformTelegramChat();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not detect chat.");
      }
    });
  }

  return (
    <Card>
      <h2 className="mb-1 text-sm font-semibold text-white/70">Telegram — seller purchase alerts</h2>
      <p className="mb-4 text-xs text-white/40">
        Get a Telegram message whenever a seller subscribes to a store plan, AI Assistant plan, or
        boosts a post/product. Uses your own bot from{" "}
        <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-accent hover:underline">
          @BotFather <ExternalLink className="inline h-3 w-3" />
        </a>{" "}
        — separate from any individual seller's own bot.
      </p>

      {isConnected ? (
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" /> Connected
          </span>
          <Button variant="outline" loading={disconnecting} onClick={() => startDisconnecting(() => disconnectPlatformTelegram())}>
            Disconnect
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <form onSubmit={handleSaveToken} className="space-y-2">
            <Label htmlFor="platform_telegram_bot_token">{hasToken ? "Bot token (saved — enter a new one to replace it)" : "1. Paste your bot token"}</Label>
            <div className="flex gap-2">
              <Input
                id="platform_telegram_bot_token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="123456789:AAExampleTokenFromBotFather"
              />
              <Button type="submit" variant="outline" loading={savingToken} disabled={!token.trim()}>
                Save
              </Button>
            </div>
            {saved && <p className="text-xs text-success">Token saved.</p>}
          </form>

          {hasToken && (
            <div className="space-y-2 border-t border-white/10 pt-4">
              <p className="text-xs text-white/60">
                2. Open{" "}
                {botUsername ? (
                  <a href={`https://t.me/${botUsername}`} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                    your bot on Telegram
                  </a>
                ) : (
                  "your bot on Telegram"
                )}{" "}
                and press <strong>Start</strong>, then click below.
              </p>
              <Button variant="outline" loading={detecting} onClick={handleDetect} className="w-full">
                <Send className="h-4 w-4" />
                3. Detect my chat
              </Button>
            </div>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      )}
    </Card>
  );
}
