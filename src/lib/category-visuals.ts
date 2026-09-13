// Shared with the admin categories page and the home category tabs so a
// given category always renders in the same color everywhere.
export const CATEGORY_COLORS = [
  { bg: "bg-gradient-to-br from-pink-500 to-rose-500", solid: "#ec4899" },
  { bg: "bg-gradient-to-br from-blue-500 to-cyan-500", solid: "#3b82f6" },
  { bg: "bg-gradient-to-br from-fuchsia-500 to-pink-400", solid: "#d946ef" },
  { bg: "bg-gradient-to-br from-emerald-500 to-teal-500", solid: "#10b981" },
  { bg: "bg-gradient-to-br from-orange-500 to-amber-500", solid: "#f97316" },
  { bg: "bg-gradient-to-br from-indigo-500 to-violet-500", solid: "#6366f1" },
  { bg: "bg-gradient-to-br from-red-500 to-orange-500", solid: "#ef4444" },
  { bg: "bg-gradient-to-br from-sky-500 to-blue-400", solid: "#0ea5e9" },
  { bg: "bg-gradient-to-br from-purple-500 to-fuchsia-500", solid: "#a855f7" },
  { bg: "bg-gradient-to-br from-teal-500 to-emerald-400", solid: "#14b8a6" },
];

export function colorForIndex(i: number) {
  return CATEGORY_COLORS[i % CATEGORY_COLORS.length];
}

// A quick-pick emoji set for the "Choose Icon" tab — covers the common
// marketplace categories without requiring an image upload for the
// common case. Uploading a custom image is still always available.
export const PRESET_CATEGORY_ICONS = [
  "🏷️", "👗", "👟", "👜", "💄", "🏠", "🍔", "☕", "🍰", "🍹",
  "⚽", "🎮", "🕹️", "🚗", "🏍️", "📚", "📱", "💻", "🖥️", "⌚",
  "🎧", "📷", "🖱️", "🖨️", "🧸", "💍", "🐾", "🌿", "🎁", "🛠️",
];
