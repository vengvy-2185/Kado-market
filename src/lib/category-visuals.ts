// Shared with the admin categories page and the home category tabs so a
// given category always renders in the same color everywhere. Deeper,
// less saturated tones than the base Tailwind 500 shades -- a fully
// saturated neon background makes the white icon glyph on top harder to
// read, not easier.
export const CATEGORY_COLORS = [
  { bg: "bg-gradient-to-br from-pink-600 to-rose-600", solid: "#db2777" },
  { bg: "bg-gradient-to-br from-blue-600 to-cyan-600", solid: "#2563eb" },
  { bg: "bg-gradient-to-br from-fuchsia-600 to-pink-500", solid: "#c026d3" },
  { bg: "bg-gradient-to-br from-emerald-600 to-teal-600", solid: "#059669" },
  { bg: "bg-gradient-to-br from-orange-600 to-amber-600", solid: "#ea580c" },
  { bg: "bg-gradient-to-br from-indigo-600 to-violet-600", solid: "#4f46e5" },
  { bg: "bg-gradient-to-br from-red-600 to-orange-600", solid: "#dc2626" },
  { bg: "bg-gradient-to-br from-sky-600 to-blue-500", solid: "#0284c7" },
  { bg: "bg-gradient-to-br from-purple-600 to-fuchsia-600", solid: "#9333ea" },
  { bg: "bg-gradient-to-br from-teal-600 to-emerald-500", solid: "#0d9488" },
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
