import { MapPin, Calendar, Users } from "lucide-react";
import { LocationCard } from "@/components/map/location-card";
import { ShareShopButtons } from "@/components/store/share-shop-buttons";

export function StoreInfoPanel({
  city,
  country,
  createdAt,
  followerCount,
  latitude,
  longitude,
  storeName,
  storeUrl,
}: {
  city: string | null;
  country: string | null;
  createdAt: string;
  followerCount: number;
  latitude: number | null;
  longitude: number | null;
  storeName: string;
  storeUrl: string;
}) {
  const joinedAgo = (() => {
    const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000);
    if (days < 1) return "Today";
    if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
    if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? "" : "s"} ago`;
    return `${Math.floor(days / 365)} year${Math.floor(days / 365) === 1 ? "" : "s"} ago`;
  })();

  return (
    <aside className="sticky top-20 hidden h-fit w-64 flex-shrink-0 self-start space-y-4 xl:block">
      <div className="rounded-2xl border border-white/10 bg-surface/40 p-4">
        <p className="mb-3 text-sm font-bold text-white/80">Shop Info</p>
        <div className="space-y-2.5 text-sm">
          {city && (
            <p className="flex items-center gap-2 text-white/60">
              <MapPin className="h-4 w-4 flex-shrink-0 text-white/30" />
              {[city, country].filter(Boolean).join(", ")}
            </p>
          )}
          <p className="flex items-center gap-2 text-white/60">
            <Calendar className="h-4 w-4 flex-shrink-0 text-white/30" />
            Joined {joinedAgo}
          </p>
          <p className="flex items-center gap-2 text-white/60">
            <Users className="h-4 w-4 flex-shrink-0 text-white/30" />
            {followerCount} follower{followerCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {latitude && longitude && (
        <div className="rounded-2xl border border-white/10 bg-surface/40 p-4">
          <p className="mb-3 text-sm font-bold text-white/80">Shop Location</p>
          <LocationCard latitude={latitude} longitude={longitude} label={`View ${storeName} on map`} />
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-surface/40 p-4">
        <ShareShopButtons storeUrl={storeUrl} storeName={storeName} />
      </div>
    </aside>
  );
}
