import { StarRating } from "./star-rating";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  images: string[] | null;
  seller_reply: string | null;
  created_at: string;
  profiles: { full_name: string | null } | null;
};

export function ReviewsList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-white/40">No reviews yet — be the first to review this product.</p>;
  }

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium">{r.profiles?.full_name ?? "Customer"}</span>
            <span className="text-xs text-white/30">{new Date(r.created_at).toLocaleDateString()}</span>
          </div>
          <StarRating rating={r.rating} />
          {r.comment && <p className="mt-2 text-sm text-white/70">{r.comment}</p>}
          {r.images && r.images.length > 0 && (
            <div className="mt-2 flex gap-2">
              {r.images.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={url} src={url} alt="" className="h-16 w-16 rounded-lg object-cover" />
              ))}
            </div>
          )}
          {r.seller_reply && (
            <div className="mt-2 rounded-lg border border-accent/20 bg-accent/5 p-2.5 text-sm">
              <p className="mb-0.5 text-xs font-semibold text-accent">Seller reply</p>
              {r.seller_reply}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
