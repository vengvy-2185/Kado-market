import { Star } from "lucide-react";
import { getMyStoreOrRedirect } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { StarRating } from "@/components/reviews/star-rating";
import { ReviewReplyForm } from "@/components/reviews/review-reply-form";

export default async function SellerReviewsPage() {
  const { supabase, store } = await getMyStoreOrRedirect();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, products(name, slug), profiles(full_name)")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  const avgRating = reviews && reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-10">
      <div className="mb-6 flex items-center gap-2">
        <Star className="h-6 w-6 text-accent" />
        <h1 className="text-2xl font-bold">Reviews</h1>
      </div>

      {reviews && reviews.length > 0 && (
        <Card className="mb-6 flex items-center gap-3">
          <StarRating rating={avgRating} size="md" />
          <span className="text-sm text-white/60">
            {avgRating.toFixed(1)} average · {reviews.length} review{reviews.length === 1 ? "" : "s"}
          </span>
        </Card>
      )}

      {!reviews || reviews.length === 0 ? (
        <Card>
          <p className="text-white/60">No reviews yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => {
            const product = r.products as unknown as { name: string; slug: string } | null;
            const customer = r.profiles as unknown as { full_name: string | null } | null;
            return (
              <Card key={r.id}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{product?.name}</p>
                  <span className="text-xs text-white/30">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <p className="mt-0.5 text-xs text-white/40">by {customer?.full_name ?? "Customer"}</p>
                <div className="mt-1.5">
                  <StarRating rating={r.rating} />
                </div>
                {r.comment && <p className="mt-2 text-sm text-white/70">{r.comment}</p>}
                <ReviewReplyForm reviewId={r.id} existingReply={r.seller_reply} />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
