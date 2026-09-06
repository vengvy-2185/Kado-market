"use client";

import { useState } from "react";
import Image from "next/image";
import { User } from "lucide-react";
import { uploadPublicFile } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { updateProfile } from "@/lib/actions/profile";
import type { Database } from "@/lib/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function EditProfileForm({ profile }: { profile: Profile }) {
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadPublicFile("avatars", profile.id, file);
      setAvatarUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setError(null);
    setSaved(false);
    formData.set("avatar_url", avatarUrl);
    try {
      await updateProfile(formData);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <Card className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-white/5">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white/30">
                <User className="h-6 w-6" />
              </div>
            )}
          </div>
          <div>
            <input type="file" accept="image/*" onChange={handleAvatarPick} className="text-xs text-white/70" />
            {uploading && <p className="mt-1 text-xs text-white/40">Uploading...</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" name="full_name" required defaultValue={profile.full_name ?? ""} />
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" defaultValue={profile.username ?? ""} />
          </div>
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={profile.phone ?? ""} />
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" name="bio" rows={3} defaultValue={profile.bio ?? ""} />
        </div>
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-success">Profile updated.</p>}

      <Button type="submit" loading={saving || uploading} className="w-full">
        Save profile
      </Button>
    </form>
  );
}
