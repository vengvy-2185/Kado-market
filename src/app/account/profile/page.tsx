import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditProfileForm } from "@/components/account/edit-profile-form";
import { MobileBottomNav } from "@/components/home/mobile-bottom-nav";
import { BackButton } from "@/components/dashboard/back-button";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/account/profile");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/");

  return (
    <main className="mx-auto max-w-lg px-4 py-10 md:px-6">
      <div className="mb-4">
        <BackButton />
      </div>
      <h1 className="mb-6 text-2xl font-bold">My Profile</h1>
      <EditProfileForm profile={profile} />
      <div className="h-16 md:hidden" aria-hidden />
      <MobileBottomNav isLoggedIn />
    </main>
  );
}
